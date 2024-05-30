import type { StoreApi, UseBoundStore } from "zustand";
import type { ThreadMessage } from "./AssistantTypes";
import type { ComposerStore } from "./ComposerTypes";

export type MessageState = {
  message: ThreadMessage;
  isLast: boolean;
  isCopied: boolean;
  setIsCopied: (value: boolean) => void;
  isHovering: boolean;
  setIsHovering: (value: boolean) => void;
};

export type MessageStore = ComposerStore & {
  useMessage: UseBoundStore<StoreApi<MessageState>>;
};
