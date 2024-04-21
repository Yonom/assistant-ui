"use client";

import { ChatList } from "assistant-ui/src/primitives/ChatList";
import { ChatPrimitive } from "assistant-ui/src/primitives/ChatPrimitive";
import { MessageActionBarPrimitive } from "assistant-ui/src/primitives/MessageActionBarPrimitive";
import { MessageContentValue } from "assistant-ui/src/primitives/MessageValues";
import { useIsEditingContext } from "assistant-ui/src/utils/Context";
import React, { FC } from "react";
import { Composer } from "@/components/Composer";
import {
  ChatMessageAvatar,
  MessageRoleLabel,
  MessageContentOrEditing,
  MessageEditingPrimitive,
  ReloadButton,
  CopyButton,
  EditBeginButton,
  EditConfirmButton,
  EditCancelButton,
  ChatEmpty,
} from "@/components/Misc";
import { BranchUI } from "@/components/BranchUI";
import { useChatWithBranches } from "assistant-ui/src/hooks/useChatWithBranches";

export default function Home() {
  const chat = useChatWithBranches();
  return (
    <ChatPrimitive chat={chat}>
      <div className="flex h-full flex-col items-stretch bg-[#212121] px-16 pt-4">
        <div className="flex flex-grow overflow-y-scroll">
          <ChatList components={{ Message: ChatMessage, Empty: ChatEmpty }} />
        </div>
        <Composer />
        <p className="p-2 text-center text-xs text-[#cdcdcd]">
          ChatGPT can make mistakes. Consider checking important information.
        </p>
      </div>
    </ChatPrimitive>
  );
}

const ChatMessage: FC = () => {
  const [isEditing] = useIsEditingContext();

  return (
    <div className="mb-12 flex gap-3">
      <ChatMessageAvatar />
      <div className="flex-grow">
        <MessageRoleLabel />
        <MessageContentOrEditing
          components={{
            MessageContent: () => (
              <p className="text-[#eee]">
                <MessageContentValue />
              </p>
            ),
            MessageEditing: () => (
              <MessageEditingPrimitive className="mb-2 flex w-full bg-transparent text-white outline-none" />
            ),
          }}
        />

        <MessageActionBarPrimitive
          className={
            "mt-2 flex items-center  gap-3 " +
            (isEditing !== false ? "justify-center" : "")
          }
          components={{
            Branch: BranchUI,
            Reload: ReloadButton,
            Copy: CopyButton,
            EditBegin: EditBeginButton,
            EditConfirm: EditConfirmButton,
            EditCancel: EditCancelButton,
          }}
        />
      </div>
    </div>
  );
};
