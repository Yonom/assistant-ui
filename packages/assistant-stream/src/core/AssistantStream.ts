import { ReadonlyJSONValue } from "./utils/json/json-value";

export type PartInit =
  | {
      type: "text" | "reasoning";
    }
  | {
      type: "tool-call";
      toolCallId: string;
      toolName: string;
    }
  | {
      type: "source";
      sourceType: "url";
      id: string;
      url: string;
      title?: string;
    };

export type AssistantStreamChunk = { path: number[] } & (
  | {
      readonly type: "part";
      readonly part: PartInit;
    }
  | {
      type: "text-delta";
      textDelta: string;
    }
  | {
      type: "annotations";
      annotations: ReadonlyJSONValue[];
    }
  | {
      type: "data";
      data: ReadonlyJSONValue[];
    }
  | {
      type: "step-start";
      messageId: string;
    }
  | {
      type: "step-finish";
      finishReason:
        | "stop"
        | "length"
        | "content-filter"
        | "tool-calls"
        | "error"
        | "other"
        | "unknown";
      usage: {
        promptTokens: number;
        completionTokens: number;
      };
      isContinued: boolean;
    }
  | {
      type: "finish";
      finishReason:
        | "stop"
        | "length"
        | "content-filter"
        | "tool-calls"
        | "error"
        | "other"
        | "unknown";
      usage: {
        promptTokens: number;
        completionTokens: number;
      };
    }
  | {
      type: "result";
      result: any;
      isError?: boolean;
    }
  | {
      type: "error";
      error: string;
    }
);

export type AssistantStream = ReadableStream<AssistantStreamChunk>;

export const AssistantStream = {
  toResponse(
    stream: AssistantStream,
    transformer: ReadableWritablePair<Uint8Array, AssistantStreamChunk>,
  ) {
    return new Response(AssistantStream.toByteStream(stream, transformer));
  },

  fromResponse(
    response: Response,
    transformer: ReadableWritablePair<AssistantStreamChunk, Uint8Array>,
  ) {
    return AssistantStream.fromByteStream(response.body!, transformer);
  },

  toByteStream(
    stream: AssistantStream,
    transformer: ReadableWritablePair<Uint8Array, AssistantStreamChunk>,
  ) {
    return stream.pipeThrough(transformer);
  },

  fromByteStream(
    readable: ReadableStream<Uint8Array>,
    transformer: ReadableWritablePair<AssistantStreamChunk, Uint8Array>,
  ) {
    return readable.pipeThrough(transformer);
  },
};
