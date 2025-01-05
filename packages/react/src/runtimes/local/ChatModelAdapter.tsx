"use client";

import { JSONValue } from "@ai-sdk/provider";
import type {
  MessageStatus,
  RunConfig,
  ThreadAssistantContentPart,
  ThreadMessage,
  ThreadStep,
} from "../../types/AssistantTypes";
import type { ModelConfig } from "../../types/ModelConfigTypes";

export type ChatModelRunUpdate = {
  content: ThreadAssistantContentPart[];
  metadata?: Record<string, unknown>;
};

export type ChatModelRunResult = {
  content?: ThreadAssistantContentPart[] | undefined;
  status?: MessageStatus | undefined;
  metadata?: {
    unstable_data?: JSONValue[] | undefined;
    steps?: ThreadStep[] | undefined;
    custom?: Record<string, unknown> | undefined;
  };
};

export type ChatModelRunOptions = {
  messages: ThreadMessage[];
  runConfig: RunConfig;
  abortSignal: AbortSignal;
  config: ModelConfig;

  unstable_assistantMessageId?: string;
};

export type ChatModelAdapter = {
  run: (
    options: ChatModelRunOptions,
  ) => Promise<ChatModelRunResult> | AsyncGenerator<ChatModelRunResult, void>;
};
