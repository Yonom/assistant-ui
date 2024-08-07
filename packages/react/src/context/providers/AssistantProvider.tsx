"use client";

import type { FC, PropsWithChildren } from "react";
import { useEffect, useInsertionEffect, useRef, useState } from "react";
import type { AssistantRuntime } from "../../runtimes";
import { AssistantContext } from "../react/AssistantContext";
import { makeAssistantModelConfigStore } from "../stores/AssistantModelConfig";
import { makeAssistantToolUIsStore } from "../stores/AssistantToolUIs";
import { ThreadProvider } from "./ThreadProvider";
import { makeAssistantActionsStore } from "../stores/AssistantActions";

type AssistantProviderProps = {
  runtime: AssistantRuntime;
};

export const AssistantProvider: FC<
  PropsWithChildren<AssistantProviderProps>
> = ({ children, runtime }) => {
  const runtimeRef = useRef(runtime);
  useInsertionEffect(() => {
    runtimeRef.current = runtime;
  });

  const [context] = useState(() => {
    const useModelConfig = makeAssistantModelConfigStore();
    const useToolUIs = makeAssistantToolUIsStore();
    const useAssistantActions = makeAssistantActionsStore(runtimeRef);

    return { useModelConfig, useToolUIs, useAssistantActions };
  });

  const getModelConfig = context.useModelConfig();
  useEffect(() => {
    return runtime.registerModelConfigProvider(getModelConfig);
  }, [runtime, getModelConfig]);

  return (
    <AssistantContext.Provider value={context}>
      <ThreadProvider provider={runtime}>{children}</ThreadProvider>
    </AssistantContext.Provider>
  );
};
