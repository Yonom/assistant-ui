import { ReadonlyJSONValue } from "./utils/json/json-value";

export type PartInit =
  | {
      readonly type: "text" | "reasoning";
    }
  | {
      readonly type: "tool-call";
      readonly toolCallId: string;
      readonly toolName: string;
    }
  | {
      readonly type: "source";
      readonly sourceType: "url";
      readonly id: string;
      readonly url: string;
      readonly title?: string;
    };

export type AssistantStreamChunk = { readonly path: readonly number[] } & (
  | {
      readonly type: "part-start";
      readonly part: PartInit;
    }
  | {
      readonly type: "part-finish";
    }
  | {
      readonly type: "tool-call-args-text-finish";
    }
  | {
      readonly type: "text-delta";
      readonly textDelta: string;
    }
  | {
      readonly type: "annotations";
      readonly annotations: ReadonlyJSONValue[];
    }
  | {
      readonly type: "data";
      readonly data: ReadonlyJSONValue[];
    }
  | {
      readonly type: "step-start";
      readonly messageId: string;
    }
  | {
      readonly type: "step-finish";
      readonly finishReason:
        | "stop"
        | "length"
        | "content-filter"
        | "tool-calls"
        | "error"
        | "other"
        | "unknown";
      readonly usage: {
        readonly promptTokens: number;
        readonly completionTokens: number;
      };
      readonly isContinued: boolean;
    }
  | {
      readonly type: "message-finish";
      readonly finishReason:
        | "stop"
        | "length"
        | "content-filter"
        | "tool-calls"
        | "error"
        | "other"
        | "unknown";
      readonly usage: {
        readonly promptTokens: number;
        readonly completionTokens: number;
      };
    }
  | {
      readonly type: "result";
      readonly result: any;
      readonly isError?: boolean;
    }
  | {
      readonly type: "error";
      readonly error: string;
    }
);
