"use client";

import { FC, Fragment } from "react";
import { MessagePrimitive } from "./MessagePrimitive";
import { useChatContext } from "../utils/Context";

type ChatListProps = {
  components: {
    Message: React.ComponentType<{}>;
    Empty?: React.ComponentType<{}>;
  };
};
export const ChatList: FC<ChatListProps> = ({
  components: { Message, Empty = Fragment },
}) => {
  const chat = useChatContext();
  const messages = chat.messages;

  if (messages.length === 0) {
    return <Empty />;
  }

  return (
    <>
      {messages.map((message, index) => {
        return (
          <MessagePrimitive key={index} message={message}>
            <Message />
          </MessagePrimitive>
        );
      })}
      {chat.isLoading &&
        chat.messages[chat.messages.length - 1].role !== "assistant" && (
          <MessagePrimitive
            message={{ id: "", role: "assistant", content: "..." }}
          >
            <Message />
          </MessagePrimitive>
        )}
    </>
  );
};
