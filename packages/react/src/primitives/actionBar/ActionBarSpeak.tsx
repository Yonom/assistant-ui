"use client";

import { useCallback } from "react";
import { useMessage, useMessageRuntime } from "../../context";
import {
  ActionButtonElement,
  ActionButtonProps,
  createActionButton,
} from "../../utils/createActionButton";

const useActionBarSpeak = () => {
  const messageRunime = useMessageRuntime();
  const callback = useCallback(async () => {
    messageRunime.speak();
  }, [messageRunime]);

  const hasSpeakableContent = useMessage((m) => {
    return (
      (m.role !== "assistant" || m.status.type !== "running") &&
      m.content.some((c) => c.type === "text" && c.text.length > 0)
    );
  });

  if (!hasSpeakableContent) return null;
  return callback;
};

export namespace ActionBarPrimitiveSpeak {
  export type Element = ActionButtonElement;
  export type Props = ActionButtonProps<typeof useActionBarSpeak>;
}

export const ActionBarPrimitiveSpeak = createActionButton(
  "ActionBarPrimitive.Speak",
  useActionBarSpeak,
);
