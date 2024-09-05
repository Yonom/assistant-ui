"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, Model } from "../types";
import { handleStreamEvent } from "../lib/streamHandler";
import {
  createAssistant,
  createThread,
  getThreadState,
  sendMessage,
} from "../lib/chatApi";
import { ASSISTANT_ID_COOKIE } from "@/constants";
import { getCookie, setCookie } from "@/lib/cookies";
import { ThreadState } from "@langchain/langgraph-sdk";
import {
  ThreadMessageLike,
  useExternalStoreRuntime,
} from "@assistant-ui/react";

type LangGraphRuntimeSettings = {
  model?: Model;
  systemInstructions?: string;
};

const convertMessage = (message: Message): ThreadMessageLike => {
  return {
    role: message.sender === "user" ? "user" : "assistant",
    content: [{ type: "text", text: message.text }],
    id: message.id,
    createdAt: new Date(),
  };
};

export const useLangGraphRuntime = ({
  model = "openai",
  systemInstructions = "",
}: LangGraphRuntimeSettings) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [assistantId, setAssistantId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [threadState, setThreadState] =
    useState<ThreadState<Record<string, any>>>();
  const [graphInterrupted, setGraphInterrupted] = useState(false);
  const [allowNullMessage, setAllowNullMessage] = useState(false);

  const messageListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initializeChat = async () => {
      let assistantId = getCookie(ASSISTANT_ID_COOKIE);

      if (!assistantId) {
        const assistant = await createAssistant(
          process.env["NEXT_PUBLIC_LANGGRAPH_GRAPH_ID"] as string,
        );
        assistantId = assistant.assistant_id as string;
        setCookie(ASSISTANT_ID_COOKIE, assistantId);
        setAssistantId(assistantId);
        // Use the assistant ID as the user ID.
        setUserId(assistantId);
      } else {
        setUserId(assistantId);
      }

      const { thread_id } = await createThread();
      setThreadId(thread_id);
      setAssistantId(assistantId);
    };

    initializeChat();
  }, []);

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (message: string | null) => {
    if (message !== null) {
      setMessages([
        ...messages,
        { text: message, sender: "user", id: uuidv4() },
      ]);
    }

    if (!threadId) {
      console.error("Thread ID is not available");
      return;
    }
    if (!assistantId) {
      console.error("Assistant ID is not available");
      return;
    }

    try {
      setIsLoading(true);
      setThreadState(undefined);
      setGraphInterrupted(false);
      setAllowNullMessage(false);
      const response = await sendMessage({
        threadId,
        assistantId,
        message,
        model,
        userId,
        systemInstructions,
      });

      for await (const chunk of response) {
        handleStreamEvent(chunk, setMessages);
      }

      // Fetch the current state of the thread
      const currentState = await getThreadState(threadId);
      setThreadState(currentState);
      if (currentState.next.length) {
        setGraphInterrupted(true);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error streaming messages:", error);
      setIsLoading(false);
    }
  };

  return useExternalStoreRuntime({
    messages,
    onNew: (msg) => {
      if (msg.content.length !== 1 || msg.content[0]?.type !== "text")
        throw new Error("Only text messages are supported");
      return handleSendMessage(msg.content[0].text);
    },
    isRunning: isLoading,
    isDisabled: graphInterrupted,
    convertMessage,
  });
};
