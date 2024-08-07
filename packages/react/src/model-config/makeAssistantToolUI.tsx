"use client";
import {
  type AssistantToolUIProps,
  useAssistantToolUI,
} from "./useAssistantToolUI";

export const makeAssistantToolUI = <
  TArgs extends Record<string, unknown>,
  TResult,
>(
  tool: AssistantToolUIProps<TArgs, TResult>,
) => {
  const ToolUI = () => {
    useAssistantToolUI(tool);
    return null;
  };
  return ToolUI;
};
