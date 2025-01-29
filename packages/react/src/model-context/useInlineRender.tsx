"use client";

import { FC, useCallback, useEffect, useState } from "react";
import { ToolCallContentPartProps } from "../types";
import { create } from "zustand";
import { JSONObject } from "../utils/json/json-value";

export const useInlineRender = <TArgs extends JSONObject, TResult>(
  toolUI: FC<ToolCallContentPartProps<TArgs, TResult>>,
): FC<ToolCallContentPartProps<TArgs, TResult>> => {
  const [useToolUI] = useState(() => create(() => toolUI));

  useEffect(() => {
    useToolUI.setState(toolUI);
  });

  return useCallback((args) => {
    const toolUI = useToolUI();
    return toolUI(args);
  }, []);
};
