"use client";

import { useThreadMessagesStore, useThreadStore } from "../../context";
import type { RequireAtLeastOne } from "../../utils/RequireAtLeastOne";
import { useCombinedStore } from "../../utils/combined/useCombinedStore";

type ThreadIfFilters = {
  empty: boolean | undefined;
  running: boolean | undefined;
  disabled: boolean | undefined;
};

export type UseThreadIfProps = RequireAtLeastOne<ThreadIfFilters>;

export const useThreadIf = (props: UseThreadIfProps) => {
  const threadStore = useThreadStore();
  const threadMessagesStore = useThreadMessagesStore();
  return useCombinedStore(
    [threadStore, threadMessagesStore],
    (thread, messages) => {
      if (props.empty === true && messages.length !== 0) return false;
      if (props.empty === false && messages.length === 0) return false;
      if (props.running === true && !thread.isRunning) return false;
      if (props.running === false && thread.isRunning) return false;
      if (props.disabled === true && thread.isDisabled) return false;
      if (props.disabled === false && thread.isDisabled) return false;

      return true;
    },
  );
};
