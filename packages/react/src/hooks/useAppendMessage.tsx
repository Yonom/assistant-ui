import { useCallback } from "react";
import { useThreadRuntime } from "../context/react/ThreadContext";
import { CreateAppendMessage } from "../api/ThreadRuntime";

/**
 * @deprecated Use `useThreadRuntime().append()` instead. This will be removed in 0.6.
 */
export const useAppendMessage = () => {
  const threadRuntime = useThreadRuntime();

  const append = useCallback(
    (message: CreateAppendMessage) => {
      threadRuntime.append(message);
    },
    [threadRuntime],
  );

  return append;
};
