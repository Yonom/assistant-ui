"use client";

import { FC } from "react";
import {
  type AssistantToolUIProps,
  useAssistantToolUI,
} from "./useAssistantToolUI";
import { JSONObject } from "../utils/json/json-value";

export type AssistantToolUI = FC & {
  unstable_tool: AssistantToolUIProps<any, any>;
};

export const makeAssistantToolUI = <TArgs extends JSONObject, TResult>(
  tool: AssistantToolUIProps<TArgs, TResult>,
) => {
  const ToolUI: AssistantToolUI = () => {
    useAssistantToolUI(tool);
    return null;
  };
  ToolUI.unstable_tool = tool;
  return ToolUI;
};
