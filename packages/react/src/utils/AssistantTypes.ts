import type { ReactNode } from "react";

export type TextContentPart = {
  type: "text";
  text: string;
};

export type ImageContentPart = {
  type: "image";
  image: string;
};

export type ToolCallContentPart = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: object;
  result?: object;
};

export type UserContentPart = TextContentPart | ImageContentPart;

export type AssistantContentPart = TextContentPart | ToolCallContentPart;

export type AppendContentPart = TextContentPart | ImageContentPart;

export type BaseMessage = {
  id: string;
  createdAt: Date;
};

export type UserMessage = BaseMessage & {
  role: "user";
  content: UserContentPart[];
};

export type AssistantMessage = BaseMessage & {
  role: "assistant";
  content: AssistantContentPart[];
  status: "in_progress" | "done" | "error";
};

export type AppendMessage = {
  parentId: string | null;
  content: AppendContentPart[];
};

export type ThreadMessage = UserMessage | AssistantMessage;

// TODO types for ui content part
export type UIContentPart = {
  type: "ui";
  display: ReactNode;
};
