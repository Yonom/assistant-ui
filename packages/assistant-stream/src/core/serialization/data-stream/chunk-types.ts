import { ReadonlyJSONValue } from "../../utils/json/json-value";

export type DataStreamChunk = {
  [K in DataStreamStreamChunkType]: {
    type: K;
    value: DataStreamStreamChunkValue[K];
  };
}[DataStreamStreamChunkType];

type LanguageModelV1FinishReason =
  | "stop"
  | "length"
  | "content-filter"
  | "tool-calls"
  | "error"
  | "other"
  | "unknown";

type LanguageModelV1Usage = {
  promptTokens: number;
  completionTokens: number;
};

export enum DataStreamStreamChunkType {
  TextDelta = "0",
  Data = "2",
  Error = "3",
  Annotation = "8",
  ToolCall = "9",
  ToolCallResult = "a",
  StartToolCall = "b",
  ToolCallDelta = "c",
  FinishMessage = "d",
  FinishStep = "e",
  StartStep = "f",
  ReasoningDelta = "g",
  Source = "h",
}
type DataStreamStreamChunkValue = {
  [DataStreamStreamChunkType.TextDelta]: string;
  [DataStreamStreamChunkType.Data]: ReadonlyJSONValue[];
  [DataStreamStreamChunkType.Annotation]: ReadonlyJSONValue[];
  [DataStreamStreamChunkType.ToolCall]: {
    toolCallId: string;
    toolName: string;
    args: unknown;
  };
  [DataStreamStreamChunkType.StartToolCall]: {
    toolCallId: string;
    toolName: string;
  };
  [DataStreamStreamChunkType.ToolCallDelta]: {
    toolCallId: string;
    argsTextDelta: string;
  };
  [DataStreamStreamChunkType.ToolCallResult]: {
    toolCallId: string;
    result: any;
  };
  [DataStreamStreamChunkType.Error]: string;
  [DataStreamStreamChunkType.FinishStep]: {
    finishReason: LanguageModelV1FinishReason;
    usage: LanguageModelV1Usage;
    isContinued: boolean;
  };
  [DataStreamStreamChunkType.FinishMessage]: {
    finishReason: LanguageModelV1FinishReason;
    usage: LanguageModelV1Usage;
  };
  [DataStreamStreamChunkType.StartStep]: {
    messageId: string;
  };
  [DataStreamStreamChunkType.ReasoningDelta]: string;
  [DataStreamStreamChunkType.Source]: {
    sourceType: "url";
    id: string;
    url: string;
    title?: string;
  };
};
