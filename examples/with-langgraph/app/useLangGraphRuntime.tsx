"use client";

import { useRef, useState } from "react";
import { LangChainMessage } from "../lib/types";
import {
  createThread,
  getThreadState,
  sendMessage as sendMessageApi,
  updateState,
} from "../lib/chatApi";
import {
  useExternalMessageConverter,
  ToolCallContentPart,
  useExternalStoreRuntime,
} from "@assistant-ui/react";

const convertMessages: useExternalMessageConverter.Callback<
  LangChainMessage
> = (message) => {
  switch (message.type) {
    case "system":
      return {
        role: "system",
        id: message.id,
        content: [{ type: "text", text: message.content }],
      };
    case "human":
      return {
        role: "user",
        id: message.id,
        content: [{ type: "text", text: message.content }],
      };
    case "ai":
      return {
        role: "assistant",
        id: message.id,
        content: [
          {
            type: "text",
            text: message.content,
          },
          ...(message.tool_calls?.map(
            (chunk): ToolCallContentPart => ({
              type: "tool-call",
              toolCallId: chunk.id,
              toolName: chunk.name,
              args: chunk.args,
              argsText:
                message.tool_call_chunks?.find((c) => c.id === chunk.id)
                  ?.args ?? JSON.stringify(chunk.args),
            }),
          ) ?? []),
        ],
      };
    case "tool":
      return {
        role: "tool",
        toolName: message.name,
        toolCallId: message.tool_call_id,
        result: message.content,
      };
  }
};

// The JSON to update state with if the user confirms the purchase.
const CONFIRM_PURCHASE = {
  purchaseConfirmed: true,
};
// The name of the node to update the state as
const PREPARE_PURCHASE_DETAILS_NODE = "prepare_purchase_details";

const useLangGraphMessages = ({
  stream,
}: {
  stream: (message: LangChainMessage | null) => Promise<
    AsyncGenerator<{
      event: string;
      data: any;
    }>
  >;
}) => {
  const [messages, setMessages] = useState<LangChainMessage[]>([]);

  const sendMessage = async (message: LangChainMessage | null) => {
    if (message !== null) {
      setMessages((currentMessages) => [...currentMessages, message]);
    }

    const response = await stream(message);

    const completeMessages: LangChainMessage[] = [];
    let partialMessages: LangChainMessage[] = [];
    for await (const chunk of response) {
      if (chunk.event === "messages/partial") {
        partialMessages = chunk.data;
      } else if (chunk.event === "messages/complete") {
        partialMessages = [];
        completeMessages.push(...chunk.data);
      } else {
        continue;
      }

      setMessages([...completeMessages, ...partialMessages]);
    }
  };

  return { messages, sendMessage };
};

export const useLangGraphRuntime = () => {
  const threadIdRef = useRef<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [graphInterrupted, setGraphInterrupted] = useState(false);

  const { messages, sendMessage } = useLangGraphMessages({
    stream: async (message) => {
      let threadId = threadIdRef.current;
      if (!threadId) {
        const { thread_id } = await createThread();
        threadId = thread_id;
        threadIdRef.current = thread_id;
      }

      return sendMessageApi({
        threadId,
        assistantId: process.env["NEXT_PUBLIC_LANGGRAPH_GRAPH_ID"] as string,
        message,
        model: "openai",
        userId: "",
        systemInstructions: "",
      });
    },
  });

  const handleSendMessage = async (message: LangChainMessage | null) => {
    setIsRunning(true);
    try {
      await sendMessage(message);

      const currentState = await getThreadState(threadIdRef.current!);
      if (currentState.next.length) {
        setGraphInterrupted(true);
      }
    } catch (error) {
      console.error("Error streaming messages:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const convertedMessages = useExternalMessageConverter({
    callback: convertMessages,
    messages,
    isRunning,
  });
  return useExternalStoreRuntime({
    isRunning,
    isDisabled: graphInterrupted || isRunning,
    messages: convertedMessages,
    onNew: (msg) => {
      if (msg.content.length !== 1 || msg.content[0]?.type !== "text")
        throw new Error("Only text messages are supported");
      return handleSendMessage({
        type: "human",
        content: msg.content[0].text,
      });
    },
    onAddToolResult: async ({ toolCallId, toolName, result }) => {
      if (toolName === "purchase_stock" && result.confirmed) {
        await updateState(threadIdRef.current as string, {
          newState: CONFIRM_PURCHASE,
          asNode: PREPARE_PURCHASE_DETAILS_NODE,
        });
      }

      await handleSendMessage({
        type: "tool",
        name: toolName,
        tool_call_id: toolCallId,
        content: JSON.stringify(result),
      });
    },
  });
};
