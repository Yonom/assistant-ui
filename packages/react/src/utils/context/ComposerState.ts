import { useContext } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { useAssistantContext } from "./AssistantContext";
import { MessageContext } from "./MessageContext";

export type ComposerState = {
  isEditing: boolean;
  canCancel: boolean;

  edit: () => void;
  send: () => void;
  cancel: () => void;

  value: string;
  setValue: (value: string) => void;
};

export type ComposerStore = {
  useComposer: UseBoundStore<StoreApi<ComposerState>>;
};

export const useUseComposer = () => {
  const { useComposer: useAssisstantComposer } = useAssistantContext();
  const { useComposer: useMessageComposer } = useContext(MessageContext) ?? {};
  return useMessageComposer ?? useAssisstantComposer;
};
