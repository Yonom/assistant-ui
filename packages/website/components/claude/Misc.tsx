"use client";

import * as Avatar from "@radix-ui/react-avatar";
import React from "react";
import { ClipboardIcon, ReloadIcon } from "@radix-ui/react-icons";
import * as MessageActionPrimitive from "assistant-ui/src/primitives/MessageActionPrimitive";
import { useMessageContext } from "assistant-ui/src/utils/Context";

export const ChatMessageAvatar = () => {
  const message = useMessageContext();
  if (message.role === "assistant") return null;
  return (
    <Avatar.Root className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[24px] bg-white">
      <Avatar.AvatarFallback className="text-xs">
        {message.role[0].toUpperCase()}
      </Avatar.AvatarFallback>
    </Avatar.Root>
  );
};

export const CopyButton = () => {
  return (
    <MessageActionPrimitive.Copy className="flex items-center gap-1 font-mono text-xs text-[#b4b4b4] hover:text-white">
      <ClipboardIcon width={12} height={12} />
      Copy
    </MessageActionPrimitive.Copy>
  );
};

export const ReloadButton = () => {
  return (
    <MessageActionPrimitive.Reload className="flex items-center gap-1 font-mono text-xs text-[#b4b4b4] hover:text-white">
      <ReloadIcon width={12} height={12} />
      Retry
    </MessageActionPrimitive.Reload>
  );
};
