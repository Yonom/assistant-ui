import { create } from "zustand";
import { ReadonlyStore } from "../ReadonlyStore";
import { ThreadRuntimeStore } from "./ThreadRuntime";

export type ThreadState = Readonly<{
  isRunning: boolean;
  isDisabled: boolean;
  canAppendNew: boolean;
}>;

export const getThreadStateFromRuntime = (
  runtime: ThreadRuntimeStore,
): ThreadState => {
  const lastMessage = runtime.messages.at(-1);
  if (lastMessage?.role !== "assistant")
    return Object.freeze({
      isDisabled: runtime.isDisabled,
      isRunning: false,
      canAppendNew: runtime.isDisabled,
    });
  return Object.freeze({
    isDisabled: runtime.isDisabled,
    isRunning: lastMessage.status.type === "running",
    canAppendNew:
      !runtime.isDisabled &&
      lastMessage.status.type !== "running" &&
      lastMessage.status.type !== "requires-action",
  });
};

export const makeThreadStore = (
  runtimeRef: ReadonlyStore<ThreadRuntimeStore>,
) => {
  const runtime = runtimeRef.getState();
  return create<ThreadState>(() => getThreadStateFromRuntime(runtime));
};
