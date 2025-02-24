import { AssistantStreamChunk } from "../../AssistantStreamChunk";
import { ToolCallStreamController } from "../../modules/tool-call";
import { AssistantTransformStream } from "../../utils/stream/AssistantTransformStream";
import { PipeableTransformStream } from "../../utils/stream/PipeableTransformStream";
import { DataStreamChunk, DataStreamStreamChunkType } from "./chunk-types";
import { LineDecoderStream } from "../../utils/stream/LineDecoderStream";
import {
  DataStreamChunkDecoder,
  DataStreamChunkEncoder,
} from "./serialization";
import {
  AssistantMetaStreamChunk,
  AssistantMetaTransformStream,
} from "../../utils/stream/AssistantMetaTransformStream";
import { TextStreamController } from "../../modules/text";

export class DataStreamEncoder extends PipeableTransformStream<
  AssistantStreamChunk,
  Uint8Array
> {
  constructor() {
    super((readable) => {
      const transform = new TransformStream<
        AssistantMetaStreamChunk,
        DataStreamChunk
      >({
        transform(chunk, controller) {
          const type = chunk.type;
          switch (type) {
            case "part-start": {
              const part = chunk.part;
              if (part.type === "tool-call") {
                const { type, ...value } = part;
                controller.enqueue({
                  type: DataStreamStreamChunkType.StartToolCall,
                  value,
                });
              }
              if (part.type === "source") {
                const { type, ...value } = part;
                controller.enqueue({
                  type: DataStreamStreamChunkType.Source,
                  value,
                });
              }
              break;
            }
            case "text-delta": {
              const part = chunk.meta;
              switch (part.type) {
                case "text": {
                  controller.enqueue({
                    type: DataStreamStreamChunkType.TextDelta,
                    value: chunk.textDelta,
                  });
                  break;
                }
                case "reasoning": {
                  controller.enqueue({
                    type: DataStreamStreamChunkType.ReasoningDelta,
                    value: chunk.textDelta,
                  });
                  break;
                }
                case "tool-call": {
                  controller.enqueue({
                    type: DataStreamStreamChunkType.ToolCallDelta,
                    value: {
                      toolCallId: part.toolCallId,
                      argsTextDelta: chunk.textDelta,
                    },
                  });
                  break;
                }
                default:
                  throw new Error(
                    `Unsupported part type for text-delta: ${part.type}`,
                  );
              }
              break;
            }
            case "result": {
              // Only tool-call parts can have results.
              const part = chunk.meta;
              if (part.type !== "tool-call") {
                throw new Error(
                  `Result chunk on non-tool-call part not supported: ${part.type}`,
                );
              }
              controller.enqueue({
                type: DataStreamStreamChunkType.ToolCallResult,
                value: {
                  toolCallId: part.toolCallId,
                  result: chunk.result,
                },
              });
              break;
            }
            case "step-start": {
              const { type, ...value } = chunk;
              controller.enqueue({
                type: DataStreamStreamChunkType.StartStep,
                value,
              });
              break;
            }
            case "step-finish": {
              const { type, ...value } = chunk;
              controller.enqueue({
                type: DataStreamStreamChunkType.FinishStep,
                value,
              });
              break;
            }
            case "message-finish": {
              const { type, ...value } = chunk;
              controller.enqueue({
                type: DataStreamStreamChunkType.FinishMessage,
                value,
              });
              break;
            }
            case "error": {
              controller.enqueue({
                type: DataStreamStreamChunkType.Error,
                value: chunk.error,
              });
              break;
            }
            case "annotations": {
              controller.enqueue({
                type: DataStreamStreamChunkType.Annotation,
                value: chunk.annotations,
              });
              break;
            }
            case "data": {
              controller.enqueue({
                type: DataStreamStreamChunkType.Data,
                value: chunk.data,
              });
              break;
            }

            // TODO ignore for now
            // in the future, we should create a handler that waits for text parts to finish before continuing
            case "tool-call-args-text-finish":
            case "part-finish":
              break;

            default: {
              const exhaustiveCheck: never = type;
              throw new Error(`Unsupported chunk type: ${exhaustiveCheck}`);
            }
          }
        },
      });

      return readable
        .pipeThrough(new AssistantMetaTransformStream())
        .pipeThrough(transform)
        .pipeThrough(new DataStreamChunkEncoder())
        .pipeThrough(new TextEncoderStream());
    });
  }
}

const TOOL_CALL_ARGS_CLOSING_CHUNKS = [
  DataStreamStreamChunkType.StartToolCall,
  DataStreamStreamChunkType.ToolCall,
  DataStreamStreamChunkType.TextDelta,
  DataStreamStreamChunkType.ReasoningDelta,
  DataStreamStreamChunkType.Source,
  DataStreamStreamChunkType.Error,
  DataStreamStreamChunkType.FinishStep,
  DataStreamStreamChunkType.FinishMessage,
];

export class DataStreamDecoder extends PipeableTransformStream<
  Uint8Array,
  AssistantStreamChunk
> {
  constructor() {
    super((readable) => {
      const toolCallControllers = new Map<string, ToolCallStreamController>();
      let activeToolCallArgsText: TextStreamController | undefined;
      const transform = new AssistantTransformStream<DataStreamChunk>({
        transform(chunk, controller) {
          const { type, value } = chunk;

          if (TOOL_CALL_ARGS_CLOSING_CHUNKS.includes(type)) {
            activeToolCallArgsText?.close();
            activeToolCallArgsText = undefined;
          }

          switch (type) {
            case DataStreamStreamChunkType.ReasoningDelta:
              controller.appendReasoning(value);
              break;

            case DataStreamStreamChunkType.TextDelta:
              controller.appendText(value);
              break;

            case DataStreamStreamChunkType.StartToolCall: {
              const { toolCallId, toolName } = value as {
                toolCallId: string;
                toolName: string;
              };
              const toolCallController = controller.addToolCallPart({
                toolCallId,
                toolName,
              });
              toolCallControllers.set(toolCallId, toolCallController);

              activeToolCallArgsText = toolCallController.argsText;
              break;
            }

            case DataStreamStreamChunkType.ToolCallDelta: {
              const { toolCallId, argsTextDelta } = value as {
                toolCallId: string;
                argsTextDelta: string;
              };
              const toolCallController = toolCallControllers.get(toolCallId);
              if (!toolCallController)
                throw new Error(
                  "Encountered tool call with unknown id: " + toolCallId,
                );
              toolCallController.argsText.append(argsTextDelta);
              break;
            }

            case DataStreamStreamChunkType.ToolCallResult: {
              const { toolCallId, result } = value as {
                toolCallId: string;
                result: any;
              };
              const toolCallController = toolCallControllers.get(toolCallId);
              if (!toolCallController)
                throw new Error(
                  "Encountered tool call result with unknown id: " + toolCallId,
                );
              toolCallController.setResult(result);
              break;
            }

            case DataStreamStreamChunkType.ToolCall: {
              const { toolCallId, toolName, args } = value as {
                toolCallId: string;
                toolName: string;
                args: object;
              };

              const toolCallController = controller.addToolCallPart({
                toolCallId,
                toolName,
              });
              toolCallControllers.set(toolCallId, toolCallController);
              toolCallController.argsText.append(JSON.stringify(args));
              toolCallController.argsText.close();
              break;
            }

            case DataStreamStreamChunkType.FinishMessage:
              controller.enqueue({
                type: "message-finish",
                path: [],
                ...value,
              });
              break;

            case DataStreamStreamChunkType.StartStep:
              controller.enqueue({
                type: "step-start",
                path: [],
                ...value,
              });
              break;

            case DataStreamStreamChunkType.FinishStep:
              controller.enqueue({
                type: "step-finish",
                path: [],
                ...value,
              });
              break;
            case DataStreamStreamChunkType.Data:
              controller.enqueue({
                type: "data",
                path: [],
                data: value,
              });
              break;

            case DataStreamStreamChunkType.Annotation:
              controller.enqueue({
                type: "annotations",
                path: [],
                annotations: value,
              });
              break;

            case DataStreamStreamChunkType.Source:
              controller.enqueue({
                type: "part-start",
                path: [],
                part: {
                  type: "source",
                  ...value,
                },
              });
              controller.enqueue({
                type: "part-finish",
                path: [],
              });
              break;

            case DataStreamStreamChunkType.Error:
              controller.enqueue({
                type: "error",
                path: [],
                error: value,
              });
              break;

            default:
              const exhaustiveCheck: never = type;
              throw new Error(`unsupported chunk type: ${exhaustiveCheck}`);
          }
        },
        flush() {
          activeToolCallArgsText?.close();
          activeToolCallArgsText = undefined;
          toolCallControllers.forEach((controller) => controller.close());
          toolCallControllers.clear();
        },
      });

      return readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new LineDecoderStream())
        .pipeThrough(new DataStreamChunkDecoder())
        .pipeThrough(transform);
    });
  }
}
