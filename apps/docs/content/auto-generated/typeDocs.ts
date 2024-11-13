import {
  AssistantRuntimeProvider,
  ContentPartState,
} from "@assistant-ui/react";
import { ComponentPropsWithRef } from "react";

export type AssistantRuntimeProvider = ComponentPropsWithRef<
  typeof AssistantRuntimeProvider
>;

export type {
  AssistantRuntime,
  AssistantToolUIsState,
  ThreadListRuntime,
  ThreadListState,
  ThreadListItemRuntime,
  ThreadListItemState,
  ThreadRuntime,
  ThreadState,
  MessageRuntime,
  MessageState,
  ContentPartRuntime,
  ComposerRuntime,
  ComposerState,
  AttachmentRuntime,
  AttachmentState,
} from "@assistant-ui/react";

export type TextContentPartState = ContentPartState & { readonly type: "text" };
export type AudioContentPartState = ContentPartState & {
  readonly type: "audio";
};
export type ImageContentPartState = ContentPartState & {
  readonly type: "image";
};
export type UIContentPartState = ContentPartState & { readonly type: "ui" };
export type ToolCallContentPartState = ContentPartState & {
  readonly type: "tool-call";
};
