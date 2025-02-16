import { AssistantStreamChunk } from "../../AssistantStream";
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

export class DataStreamEncoder {
  private _transformStream: PipeableTransformStream<
    AssistantStreamChunk,
    Uint8Array
  >;

  public get writable() {
    return this._transformStream.writable;
  }
  public get readable() {
    return this._transformStream.readable;
  }

  constructor() {
    this._transformStream = new PipeableTransformStream<
      AssistantStreamChunk,
      Uint8Array
    >((readable) => {
      const transform = new TransformStream<
        AssistantMetaStreamChunk,
        DataStreamChunk
      >({
        transform(chunk, controller) {
          const type = chunk.type;
          switch (type) {
            case "part": {
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
            case "finish": {
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

export class DataStreamDecoder {
  private _transformStream;

  public get writable() {
    return this._transformStream.writable;
  }

  public get readable() {
    return this._transformStream.readable;
  }

  constructor() {
    this._transformStream = new PipeableTransformStream<
      Uint8Array,
      AssistantStreamChunk
    >((readable) => {
      const toolCallControllers = new Map<string, ToolCallStreamController>();
      const transform = new AssistantTransformStream<DataStreamChunk>({
        transform(chunk, controller) {
          const { type, value } = chunk;
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
              break;
            }

            case DataStreamStreamChunkType.FinishMessage:
              controller.enqueue({
                type: "finish",
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
                type: "part",
                path: [],
                part: {
                  type: "source",
                  ...value,
                },
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
      });

      return readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new LineDecoderStream())
        .pipeThrough(new DataStreamChunkDecoder())
        .pipeThrough(transform);
    });
  }
}
