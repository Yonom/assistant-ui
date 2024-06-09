import { useContext, useMemo } from "react";
import type { StoreApi, UseBoundStore } from "zustand";
import { useAssistantContext } from "./AssistantContext";
import { MessageContext } from "./MessageContext";
import type {
  MessageComposerState,
  ThreadComposerState,
} from "./stores/ComposerStore";

export type ComposerContextValue = {
  useComposer: UseBoundStore<
    StoreApi<MessageComposerState | ThreadComposerState>
  >;
  type: "message" | "assistant";
};

export const useComposerContext = (): ComposerContextValue => {
  const { useComposer: useAssisstantComposer } = useAssistantContext();
  const { useComposer: useMessageComposer } = useContext(MessageContext) ?? {};
  return useMemo(
    () => ({
      useComposer: (useMessageComposer ??
        useAssisstantComposer) as UseBoundStore<
        StoreApi<MessageComposerState | ThreadComposerState>
      >,
      type: useMessageComposer ? ("message" as const) : ("assistant" as const),
    }),
    [useMessageComposer, useAssisstantComposer],
  );
};
