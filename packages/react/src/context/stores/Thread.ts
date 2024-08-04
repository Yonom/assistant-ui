import { create } from "zustand";
import { ReadonlyStore } from "../ReadonlyStore";
import { ThreadRuntimeStore } from "./ThreadRuntime";
import { MessageStatus } from "../../types";

export type ThreadState = Readonly<{
  status: MessageStatus;
  /**
   * @deprecated Use `status.type === "running"` instead. This will be removed in 0.6.0.
   */
  isRunning: boolean;
  isDisabled: boolean;
}>;

export const makeThreadStore = (
  runtimeRef: ReadonlyStore<ThreadRuntimeStore>,
) => {
  const runtime = runtimeRef.getState();
  return create<ThreadState>(() => ({
    isDisabled: runtime.isDisabled,
    isRunning: runtime.status.type === "running", // TODO remove in v0.6
    status: runtime.status,
  }));
};
