import { useCallback } from "react";
import { useMessageContext } from "../utils/context/MessageContext";
import { useCombinedStore } from "../utils/context/combined/useCombinedStore";

export const useBeginMessageEdit = () => {
  const { useMessage, useComposer } = useMessageContext();

  const disabled = useCombinedStore(
    [useMessage, useComposer],
    (m, c) => m.message.role !== "user" || c.isEditing,
  );

  const callback = useCallback(() => {
    const { edit } = useComposer.getState();
    edit();
  }, [useComposer]);

  if (disabled) return null;
  return callback;
};
