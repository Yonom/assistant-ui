import { AssistantStream, AssistantStreamChunk } from "../AssistantStream";
import { UnderlyingReadable } from "../utils/stream/UnderlyingReadable";
import { createTextStream, TextStreamController } from "./text";

export type ToolCallStreamController = {
  argsText: TextStreamController;

  setResult(result: unknown): void;
  close(): void;
};

class ToolCallStreamControllerImpl implements ToolCallStreamController {
  constructor(
    private _controller: ReadableStreamDefaultController<AssistantStreamChunk>,
  ) {
    const stream = createTextStream({
      start: (c) => {
        this._argsTextController = c;
      },
    });
    stream.pipeTo(
      new WritableStream({
        write: (chunk) => {
          if (chunk.type !== "text-delta")
            throw new Error("Unexpected chunk type");

          this._controller.enqueue(chunk);
        },
      }),
    );
  }

  get argsText() {
    return this._argsTextController;
  }

  private _argsTextController!: TextStreamController;

  setResult(result: unknown, isError?: boolean) {
    this._controller.enqueue({
      type: "result",
      path: [],
      result,
      isError: isError ?? false,
    });
  }

  close() {
    this._controller.close();
  }
}

export const createToolCallStream = (
  readable: UnderlyingReadable<ToolCallStreamController>,
): AssistantStream => {
  return new ReadableStream({
    start(c) {
      return readable.start?.(new ToolCallStreamControllerImpl(c));
    },
    pull(c) {
      return readable.pull?.(new ToolCallStreamControllerImpl(c));
    },
    cancel(c) {
      return readable.cancel?.(c);
    },
  });
};

export const createToolCallStreamController = () => {
  let controller!: ToolCallStreamController;
  const stream = createToolCallStream({
    start(c) {
      controller = c;
    },
  });
  return [stream, controller] as const;
};
