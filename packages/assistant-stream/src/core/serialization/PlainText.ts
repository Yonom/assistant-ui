import { AssistantStreamChunk } from "../AssistantStreamChunk";
import { AssistantTransformStream } from "../utils/stream/AssistantTransformStream";
import { PipeableTransformStream } from "../utils/stream/PipeableTransformStream";

export class PlainTextEncoder extends PipeableTransformStream<
  AssistantStreamChunk,
  Uint8Array
> {
  constructor() {
    super((readable) => {
      const transform = new TransformStream<AssistantStreamChunk, string>({
        transform(chunk, controller) {
          const type = chunk.type;
          switch (type) {
            case "text-delta":
              controller.enqueue(chunk.textDelta);
              break;

            default:
              const unsupportedType:
                | "part-start"
                | "part-finish"
                | "tool-call-args-text-finish"
                | "data"
                | "step-start"
                | "step-finish"
                | "message-finish"
                | "annotations"
                | "tool-call-begin"
                | "tool-call-delta"
                | "result"
                | "error" = type;
              throw new Error(`unsupported chunk type: ${unsupportedType}`);
          }
        },
      });

      return readable
        .pipeThrough(transform)
        .pipeThrough(new TextEncoderStream());
    });
  }
}

export class PlainTextDecoder extends PipeableTransformStream<
  Uint8Array,
  AssistantStreamChunk
> {
  constructor() {
    super((readable) => {
      const transform = new AssistantTransformStream<string>({
        transform(chunk, controller) {
          controller.appendText(chunk);
        },
      });

      return readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(transform);
    });
  }
}
