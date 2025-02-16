import { ReadonlyJSONValue } from "./json/json-value";
import { AssistantMessageStatus } from "./utils/types";

export type ContentPartInit =
  | {
      type: "text" | "reasoning";
    }
  | {
      type: "tool-call";
      toolCallId: string;
      toolName: string;
    };

/**
 * Create a content part.
 */

export type AppendContentChunk = {
  readonly type: "content-part";
  readonly path: number[];
  readonly contentPart: ContentPartInit;
};
/**
 * Append text delta to the specified path.
 **/

export type TextDeltaChunk = {
  readonly type: "text-delta";
  readonly path: number[];
  readonly textDelta: string;
};
/**
 * Set tool result at the specified path.
 */
export type ToolResultChunk = {
  readonly type: "result";
  readonly path: number[];
  readonly result: ReadonlyJSONValue;
};
/**
 * Finish a content part and set the status of it.
 */
export type FinishChunk = {
  readonly type: "finish";
  readonly path: number[];
  readonly status?: AssistantMessageStatus;
};
/**
 * Update the state.
 */
export type StateUpdateChunk = {
  readonly type: "state-update";
  readonly path: number[];
  readonly stateUpdates: {
    path: string;
    operation: "set" | "delete" | "append-text-delta" | "append-array-items";
    value: ReadonlyJSONValue;
  }[];
};

/**
 * Start a step span.
 */
type StepStartChunk = {
  readonly type: "step-start";
  readonly stepId: string;
};

type StepFinishChunk = {
  readonly type: "step-finish";
};

type MessageFinishChunk = {
  readonly type: "message-finish"
}

export type AssistantStreamChunk =
  | AppendContentChunk
  | TextDeltaChunk
  | ToolResultChunk
  | StateUpdateChunk
  | FinishChunk;
