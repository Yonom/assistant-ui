"use client";

import { useInsertionEffect, useMemo, useState } from "react";
import type { ChatModelAdapter } from "./ChatModelAdapter";
import { LocalRuntimeCore } from "./LocalRuntimeCore";
import { LocalRuntimeOptions } from "./LocalRuntimeOptions";
import { AssistantRuntime } from "../../api/AssistantRuntime";

export const useLocalRuntime = (
  adapter: ChatModelAdapter,
  options: LocalRuntimeOptions = {},
) => {
  const [runtime] = useState(() => new LocalRuntimeCore(adapter, options));

  useInsertionEffect(() => {
    runtime.adapter = adapter;
    runtime.options = options;
  });

  return useMemo(() => new AssistantRuntime(runtime), [runtime]);
};
