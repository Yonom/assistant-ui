import { AssistantStream } from "../AssistantStream";
import { ContentPartInit } from "../assistant-stream-chunks";
import { generateId } from "../utils/generateId";
import { createMergeStream } from "../utils/stream/container-stream-utils";
import { createTextStreamController, TextStreamController } from "./text";
import { createToolCallStream, ToolCallStreamController } from "./tool-call";
import { AssistantMessageStatus } from "../utils/types";
import { Counter } from "../utils/Counter";
import {
  PathAppendEncoder,
  PathMergeEncoder,
} from "../utils/stream/content-path-transforms";
import { DataStreamEncoder } from "../serialization/data-stream/DataStream";

export type AssistantStreamController = {
  appendText(textDelta: string): void;
  appendReasoning(reasoningDelta: string): void;
  addTextPart(): TextStreamController;
  addToolCallPart(toolName: string): ToolCallStreamController;
  addToolCallPart(options: {
    toolCallId: string;
    toolName: string;
  }): ToolCallStreamController;

  merge(stream: AssistantStream): void;
  close(config: { status: AssistantMessageStatus }): void;
};

class AssistantStreamControllerImpl implements AssistantStreamController {
  private _merger = createMergeStream();
  private _append:
    | {
        controller: TextStreamController;
        kind: "text" | "reasoning";
      }
    | undefined;
  private _contentCounter = new Counter();

  get __internal_isClosed() {
    return this._merger.isSealed();
  }

  __internal_getReadable() {
    return this._merger.readable;
  }

  private _addContentPart(
    contentPart: ContentPartInit,
    stream: AssistantStream,
  ) {
    this._merger.enqueue({
      type: "content-part",
      contentPart,
      path: [],
    });
    this._merger.addStream(
      stream.pipeThrough(new PathAppendEncoder(this._contentCounter.up())),
    );
  }

  merge(stream: AssistantStream) {
    this._merger.addStream(
      stream.pipeThrough(new PathMergeEncoder(this._contentCounter)),
    );
  }

  appendText(textDelta: string) {
    if (this._append?.kind !== "text") {
      if (this._append) {
        this._append.controller.close();
      }

      this._append = {
        kind: "text",
        controller: this.addTextPart(),
      };
    }
    this._append.controller.append(textDelta);
  }

  appendReasoning(textDelta: string) {
    if (this._append?.kind !== "reasoning") {
      if (this._append) {
        this._append.controller.close();
      }

      this._append = {
        kind: "reasoning",
        controller: this.addReasoningPart(),
      };
    }
    this._append.controller.append(textDelta);
  }

  addTextPart() {
    const [stream, controller] = createTextStreamController();
    this._addContentPart({ type: "text" }, stream);
    return controller;
  }

  addReasoningPart() {
    const [stream, controller] = createTextStreamController();
    this._addContentPart({ type: "reasoning" }, stream);
    return controller;
  }

  addToolCallPart(
    options:
      | string
      | {
          toolCallId: string;
          toolName: string;
        },
  ): ToolCallStreamController {
    const opt =
      typeof options === "string"
        ? { toolName: options, toolCallId: generateId() }
        : options;

    let controller: ToolCallStreamController;
    const toolCallStream = createToolCallStream({
      start(c) {
        controller = c;
      },
    });
    this._addContentPart({ type: "tool-call", ...opt }, toolCallStream);
    return controller!;
  }

  close({ status }: { status: AssistantMessageStatus }) {
    // this._merger.enqueue({
    //   type: "finish",
    //   parentId: 0,
    //   status,
    // });

    this._merger.seal();
    this._append?.controller?.close();
  }
}

export function createAssistantStream(
  callback: (controller: AssistantStreamController) => PromiseLike<void> | void,
): AssistantStream {
  const controller = new AssistantStreamControllerImpl();
  const promiseOrVoid = callback(controller);
  if (promiseOrVoid instanceof Promise) {
    const runTask = async () => {
      try {
        await promiseOrVoid;
        if (!controller.__internal_isClosed) {
          controller.close({
            status: { type: "complete", reason: "unknown" },
          });
        }
      } catch (e) {
        if (!controller.__internal_isClosed) {
          controller.close({
            status: { type: "complete", reason: "unknown" },
          });
        }
        throw e;
      }
    };
    runTask();
  } else {
    if (!controller.__internal_isClosed) {
      controller.close({
        status: { type: "complete", reason: "unknown" },
      });
    }
  }

  return controller.__internal_getReadable();
}

export function createAssistantStreamResponse(
  callback: (controller: AssistantStreamController) => PromiseLike<void> | void,
) {
  return AssistantStream.toResponse(
    createAssistantStream(callback),
    new DataStreamEncoder(),
  );
}
