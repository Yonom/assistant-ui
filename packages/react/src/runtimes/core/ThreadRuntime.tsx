import type { ThreadState } from "../../context";
import { ThreadActionsState } from "../../context/stores/ThreadActions";
import { ThreadMessage } from "../../types";
import type { Unsubscribe } from "../../types/Unsubscribe";

export type ThreadRuntime = Readonly<
  Omit<ThreadState, "isRunning"> &
    Omit<ThreadActionsState, "getRuntime"> & {
      messages: readonly ThreadMessage[];
      subscribe: (callback: () => void) => Unsubscribe;
    }
>;
