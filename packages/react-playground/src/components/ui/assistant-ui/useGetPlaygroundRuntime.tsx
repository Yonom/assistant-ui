"use client";
import { useThreadContext } from "../../../../../react/src";
import { PlaygroundThreadRuntime } from "../../../lib/playground-runtime";

export const useGetPlaygroundRuntime = () => {
  const { useThreadActions } = useThreadContext();
  const getRuntime = useThreadActions((t) => t.getRuntime);

  return getRuntime as () => PlaygroundThreadRuntime;
};
