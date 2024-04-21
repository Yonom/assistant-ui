"use client";
import { FC, createContext } from "react";
import { UseChatWithBranchesHelpers } from "assistant-ui/src/hooks/useChatWithBranches";

export const ChatContext = createContext<UseChatWithBranchesHelpers | null>(
  null,
);

type ChatPrimitiveProps = {
  chat: UseChatWithBranchesHelpers;
  children: React.ReactNode;
};

export const ChatPrimitive: FC<ChatPrimitiveProps> = ({ chat, children }) => {
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
};
