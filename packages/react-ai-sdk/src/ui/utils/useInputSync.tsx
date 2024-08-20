import { useRef, useInsertionEffect, useEffect } from "react";
import {
  ExternalStoreRuntime,
  subscribeToMainThread,
} from "../../../../react/src";
import { VercelHelpers } from "./VercelHelpers";

export const useInputSync = (
  helpers: VercelHelpers,
  runtime: ExternalStoreRuntime,
) => {
  // sync input from vercel to assistant-ui
  const helpersRef = useRef(helpers);
  useInsertionEffect(() => {
    helpersRef.current = helpers;
    if (runtime.thread.composer.text !== helpers.input) {
      runtime.thread.composer.setText(helpers.input);
    }
  });

  // sync input from assistant-ui to vercel
  useEffect(() => {
    return subscribeToMainThread(runtime, () => {
      if (runtime.thread.composer.text !== helpersRef.current.input) {
        helpersRef.current.setInput(runtime.thread.composer.text);
      }
    });
  }, [runtime]);
};
