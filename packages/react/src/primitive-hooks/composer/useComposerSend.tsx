import { useCallback } from "react";
import { useComposerContext, useThreadContext } from "../../context";

export const useComposerSend = () => {
  const { useViewport, useComposer: useNewComposer } = useThreadContext();
  const { useComposer } = useComposerContext();

  const disabled = useComposer((c) => !c.isEditing || c.value.length === 0);

  const callback = useCallback(() => {
    const composerState = useComposer.getState();
    if (!composerState.isEditing) return;

    composerState.send();

    useViewport.getState().scrollToBottom();
    useNewComposer.getState().focus();
  }, [useNewComposer, useComposer, useViewport]);

  if (disabled) return null;
  return callback;
};
