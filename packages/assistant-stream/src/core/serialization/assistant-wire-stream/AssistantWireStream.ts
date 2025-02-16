import { AssistantStreamChunk } from "../../AssistantStream";
import { ToolCallStreamController } from "../../modules/tool-call";
import { AssistantTransformStream } from "../../utils/stream/assistant-transform-stream";
import { PipeableTransformStream } from "../../utils/stream/PipeableTransformStream";
import { LineDecoderStream } from "../../utils/stream/LineDecoderStream";
import { AssistantWireStreamChunk } from "./chunk-types";
import { SSEDecoder } from "./serialization";

type RunContentPart = {
  type: "container";
  content: (
    | RunContentPart
    | {
        type: "text" | "reasoning";
      }
    | {
        type: "tool-call";
        toolCallId: string;
        toolName: string;
        content?: RunContentPart["content"];
      }
  )[];
};

const getAtPath = (obj: RunContentPart, path: number[]) => {
  return path.reduce<RunContentPart["content"][number]>((acc, key) => {
    if (!("content" in acc)) throw new Error("path not found");
    const value = acc.content[key];
    if (!value) throw new Error("path not found");
    return value;
  }, obj);
};

export class AssistantWireStreamEncoder {
  private _transformStream;

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
      const obj: RunContentPart = { type: "container", content: [] };
      const transform = new TransformStream<
        AssistantStreamChunk,
        AssistantWireStreamChunk
      >({
        transform(chunk, controller) {
          const { type, path } = chunk;

          const target = getAtPath(obj, path);

          switch (type) {
            case "content-part": {
              if (target.type !== "tool-call" && target.type !== "container") {
                throw new Error("data stream does not support nested content");
              }

              if (!target.content) {
                target.content = [];
              }
              target.content.push(chunk.contentPart);

              if (chunk.path.length !== 0) {
                // throw new Error("data stream does not support nested content");
                break;
              }

              if (chunk.contentPart.type === "tool-call") {
                controller.enqueue(chunk);
              }
              break;
            }

            case "text-delta": {
              if (
                chunk.path.length !== 1 ||
                chunk.path[0] !== obj.content.length - 1
              ) {
                // throw new Error("data stream does not support nested content");
                break;
              }

              const targetType = target.type;
              switch (targetType) {
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

                case "tool-call":
                  controller.enqueue({
                    type: DataStreamStreamChunkType.ToolCallDelta,
                    value: {
                      toolCallId: target.toolCallId,
                      argsTextDelta: chunk.textDelta,
                    },
                  });
                  break;

                case "container":
                  throw new Error(
                    "text-delta chunk on container not supported",
                  );

                default:
                  const exhaustiveCheck: never = targetType;
                  throw new Error(`unsupported chunk type: ${exhaustiveCheck}`);
              }

              break;
            }

            case "result": {
              if (target.type !== "tool-call") {
                throw new Error("result chunk on non-tool-call not supported");
              }

              if (chunk.path.length !== 1) {
                // throw new Error("data stream does not support nested content");
                break;
              }

              controller.enqueue({
                type: DataStreamStreamChunkType.ToolCallResult,
                value: {
                  toolCallId: target.toolCallId,
                  result: chunk.result,
                },
              });
              break;
            }

            // not supported
            case "state-update":
              break;

            case "finish":
              break;

            // case "tool-call-result":
            //   controller.enqueue({
            //     type: DataStreamStreamChunkType.ToolCallResult,
            //     value: {
            //       toolCallId: chunk.toolCallId,
            //       result: chunk.result,
            //     },
            //   });
            //   break;

            // case "error":
            //   controller.enqueue({
            //     type: DataStreamStreamChunkType.Error,
            //     value: chunk.error,
            //   });
            //   break;

            default:
              const exhaustiveCheck: never = type;
              throw new Error(`unsupported chunk type: ${exhaustiveCheck}`);
          }
        },
      });

      return readable
        .pipeThrough(transform)
        .pipeThrough(new AssistantStreamChunkEncoder())
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

            default:
              const exhaustiveCheck: never = type;
              throw new Error(`unsupported chunk type: ${exhaustiveCheck}`);
          }
        },
      });

      return readable
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new LineDecoderStream())
        .pipeThrough(new SSEDecoder())
        .pipeThrough(transform);
    });
  }
}
