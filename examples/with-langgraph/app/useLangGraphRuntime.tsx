"use client";

import { useRef, useState } from "react";
import { LangChainMessage } from "../lib/types";
import { handleStreamEvent } from "../lib/streamHandler";
import {
  createThread,
  getThreadState,
  sendMessage,
  updateState,
} from "../lib/chatApi";
import {
  useExternalMessageConverter,
  ToolCallContentPart,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";

const convertMessages: useExternalMessageConverter.Callback<
  LangChainMessage
> = (message) => {
  switch (message.type) {
    case "system":
      return {
        role: "system",
        content: [{ type: "text", text: message.content }],
      };
    case "human":
      return {
        role: "user",
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

export const useLangGraphRuntime = () => {
  const threadIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<LangChainMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [graphInterrupted, setGraphInterrupted] = useState(false);

  console.log({ messages });

  const handleSendMessage = useCallbackRef(async (message: string | null) => {
    let currentMessages = messages;
    if (message !== null) {
      currentMessages = [
        ...currentMessages,
        { content: message, type: "human" },
      ];
      setMessages(currentMessages);
    }

    let threadId = threadIdRef.current;
    if (!threadId) {
      const { thread_id } = await createThread();
      threadId = thread_id;
      threadIdRef.current = thread_id;
    }

    try {
      setIsRunning(true);
      setGraphInterrupted(false);
      const response = await sendMessage({
        threadId,
        assistantId: process.env["NEXT_PUBLIC_LANGGRAPH_GRAPH_ID"] as string,
        message,
        model: "openai",
        userId: "",
        systemInstructions: "",
      });

      for await (const chunk of response) {
        currentMessages = handleStreamEvent(currentMessages, chunk as any);
        setMessages(currentMessages);
      }

      const currentState = await getThreadState(threadId);
      if (currentState.next.length) {
        setGraphInterrupted(true);
      }
    } catch (error) {
      console.error("Error streaming messages:", error);
    } finally {
      setIsRunning(false);
    }
  });

  const convertedMessages = useExternalMessageConverter({
    callback: convertMessages,
    messages,
    isRunning,
  });
  return useExternalStoreRuntime({
    isRunning,
    isDisabled: graphInterrupted,
    messages: convertedMessages,
    onNew: (msg) => {
      if (msg.content.length !== 1 || msg.content[0]?.type !== "text")
        throw new Error("Only text messages are supported");
      return handleSendMessage(msg.content[0].text);
    },
    onAddToolResult: async ({ toolCallId, toolName, result }) => {
      setMessages((m) => [
        ...m,
        {
          type: "tool",
          name: toolName,
          tool_call_id: toolCallId,
          content: JSON.stringify(result),
        },
      ]);

      if (toolName === "purchase_stock" && result.confirmed) {
        await updateState(threadIdRef.current as string, {
          newState: CONFIRM_PURCHASE,
          asNode: PREPARE_PURCHASE_DETAILS_NODE,
        });
        // send a null message to resume execution
        handleSendMessage(null);
      }
    },
  });
};
