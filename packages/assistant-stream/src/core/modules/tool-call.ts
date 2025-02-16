import { AssistantStream, AssistantStreamChunk } from "../AssistantStream";
import { ReadonlyJSONValue } from "../json/json-value";
import { UnderlyingReadable } from "../utils/stream/UnderlyingReadable";
import { createTextStreamController, TextStreamController } from "./text";

export type ToolCallStreamController = {
  argsText: TextStreamController;

  
  setResult(result: unknown): void;
  close(): void;
};

class ToolCallStreamControllerImpl implements ToolCallStreamController {
  constructor(
    private _controller: ReadableStreamDefaultController<AssistantStreamChunk>,
  ) {
    const [argsTextStream, argsTextController] = createTextStreamController();
    this._argsTextController = argsTextController;

<<<<<<< ours
    const stream = createTextStream({
      start: (c) => {
        this._argsTextController = c;
      },
    });
    stream.pipeTo(
||||||| ancestor
    const stream = createTextStream({
      start: (c) => {
        this._argsTextController = c;
      },
    });
    stream.readable.pipeTo(
=======
    argsTextStream.pipeTo(
>>>>>>> theirs
      new WritableStream({
        write: (chunk) => {
          this._controller.enqueue(chunk);
        },
      }),
    );
  }

  get argsText() {
    return this._argsTextController;
  }

  private _argsTextController: TextStreamController;

  setResult(result: ReadonlyJSONValue) {
    this._controller.enqueue({
      type: "result",
      path: [],
      result,
    });
  }

  close() {
    this._controller.close();
  }
}

type UnderlyingToolCallStreamReadable =
  UnderlyingReadable<ToolCallStreamController>;

export const createToolCallStream = (
  readable: UnderlyingToolCallStreamReadable,
): AssistantStream => {
<<<<<<< ours
  const options = {
    toolCallId: readable.toolCallId,
    toolName: readable.toolName,
  };
  return new ReadableStream({
    start(c) {
      return readable.start?.(new ToolCallStreamControllerImpl(c, options));
    },
    pull(c) {
      return readable.pull?.(new ToolCallStreamControllerImpl(c, options));
    },
    cancel(c) {
      return readable.cancel?.(c);
    },
  });
||||||| ancestor
  const options = {
    toolCallId: readable.toolCallId,
    toolName: readable.toolName,
  };
  return new AssistantStream(
    new ReadableStream({
      start(c) {
        return readable.start?.(new ToolCallStreamControllerImpl(c, options));
      },
      pull(c) {
        return readable.pull?.(new ToolCallStreamControllerImpl(c, options));
      },
      cancel(c) {
        return readable.cancel?.(c);
      },
    }),
  );
=======
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
>>>>>>> theirs
};
