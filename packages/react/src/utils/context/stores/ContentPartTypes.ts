import type { ThreadMessage } from "./AssistantTypes";

export type ContentPartState = Readonly<{
  status: "in_progress" | "done" | "error";
  part: ThreadMessage["content"][number];
}>;
