"use client";

import { Message } from "ai/react";
import { Dispatch, FC, SetStateAction, createContext, useState } from "react";

export const MessageContext = createContext<Message | null>(null);
export const IsEditingContext = createContext<
  [false | string, Dispatch<SetStateAction<false | string>>]
>([false, () => {}]);

export type MessageProps = {
  message: Message;
  children: React.ReactNode;
};

export const MessagePrimitive: FC<MessageProps> = ({ message, children }) => {
  const isEditingValue = useState<false | string>(false);
  return (
    <MessageContext.Provider value={message}>
      <IsEditingContext.Provider value={isEditingValue}>
        {children}
      </IsEditingContext.Provider>
    </MessageContext.Provider>
  );
};
