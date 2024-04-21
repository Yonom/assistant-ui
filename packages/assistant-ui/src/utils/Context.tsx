"use client";
import { useContext } from "react";
import { ChatContext } from "assistant-ui/src/primitives/ChatPrimitive";
import {
  IsEditingContext,
  MessageContext,
} from "assistant-ui/src/primitives/MessagePrimitive";

export const useChatContext = () => {
  const chat = useContext(ChatContext);
  if (!chat) throw new Error("useChat must be used within <Chat />");
  return chat;
};

export const useMessageContext = () => {
  const message = useContext(MessageContext);
  if (!message) throw new Error("useMessage must be used within <Message />");
  return message;
};

export const useIsEditingContext = () => {
  return useContext(IsEditingContext);
};
