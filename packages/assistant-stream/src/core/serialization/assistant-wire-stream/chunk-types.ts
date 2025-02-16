import { ReadonlyJSONValue } from "../../json/json-value";

export type AssistantWireStreamChunk =
  | string
  | {
      path: number | number[];
      textDelta: string;
    }
  | {
      path?: number | number[];
      contentPart:
        | {
            type: "text" | "reasoning"; // text is auto-referred
          }
        | {
            type: "tool-call";
            toolCallId: string;
            toolName: string;
          };
    }
  | {
      path?: number | number[];
      result: ReadonlyJSONValue;
    };
