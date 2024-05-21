import { useContext } from "react";
import { useAssistantContext } from "./AssistantContext";
import { MessageContext } from "./MessageContext";

export const useComposerContext = () => {
  const { useComposer: useAssisstantComposer } = useAssistantContext();
  const { useComposer: useMessageComposer } = useContext(MessageContext) ?? {};
  return { useComposer: useMessageComposer ?? useAssisstantComposer };
};
