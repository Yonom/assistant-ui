"use client";
import { ChatList } from "assistant-ui/src/primitives/ChatList";
import { ChatPrimitive } from "assistant-ui/src/primitives/ChatPrimitive";
import { MessageActionBarPrimitive } from "assistant-ui/src/primitives/MessageActionBarPrimitive";
import { MessageContentValue } from "assistant-ui/src/primitives/MessageValues";
import {
  useIsEditingContext,
  useMessageContext,
} from "assistant-ui/src/utils/Context";
import React, { FC } from "react";
import { Composer } from "@/components/claude/Composer";
import {
  ChatMessageAvatar,
  ReloadButton,
  CopyButton,
} from "@/components/claude/Misc";
import { AssistantProps } from "../../app/page";
import { cn } from "@/lib/utils";

export const Claude: FC<AssistantProps> = ({ chat }) => {
  return (
    <ChatPrimitive chat={chat}>
      <div className="flex h-full flex-col items-stretch bg-[#2b2a27] px-12 pt-16 font-serif">
        <div className="flex flex-grow flex-col overflow-y-scroll">
          <ChatList components={{ Message: ChatMessage }} />
          {chat.messages.length > 1 && (
            <p className="p-2 text-right text-xs text-[#b8b5a9]">
              Claude can make mistakes. Please double-check responses.
            </p>
          )}
        </div>
        <Composer />
      </div>
    </ChatPrimitive>
  );
};
const ChatMessage: FC = () => {
  const message = useMessageContext();
  const [isEditing] = useIsEditingContext();

  return (
    <div className=" mb-4 flex flex-col gap-3">
      <div
        className={cn(
          "relative flex gap-2 rounded-2xl bg-gradient-to-b from-[#21201c] from-50% to-[#1a1915] px-3 py-2.5",
          message.role === "user" && "self-start",
          message.role === "assistant" &&
            "bg-[linear-gradient(to_bottom,_hsla(60_1.8%_22%_/_0.75)_0%,_hsla(60_1.8%_22%_/_0)_90%)] pb-4 font-serif",
        )}
      >
        {message.role === "assistant" && (
          <div className="absolute inset-0 rounded-2xl  border-[0.5px]  border-[hsla(50_5.8%_40%/0.15)]  bg-[radial-gradient(ellipse_at_left_top,_hsla(60_1.8%_22%/0.5)_0%,_hsla(60_1.8%_22%/0.3)_60%)]  shadow-[0_4px_24px_rgba(0,0,0,0.015)]" />
        )}
        <div className="relative flex gap-2">
          <ChatMessageAvatar />
          <p className="text-[#eee]">
            <MessageContentValue />
          </p>
        </div>
      </div>

      {message.role === "assistant" && (
        <MessageActionBarPrimitive
          className={
            "relative -mt-6 mr-3  flex items-center gap-3 self-end rounded-lg border border-[#6c6a6040] bg-[#393937] px-2 py-1" +
            (isEditing !== false ? "justify-center" : "")
          }
          components={{
            Reload: ReloadButton,
            Copy: CopyButton,
          }}
        />
      )}
    </div>
  );
};
