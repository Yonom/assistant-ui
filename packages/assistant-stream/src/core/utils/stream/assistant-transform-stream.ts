import { AssistantStreamChunk } from "../../AssistantStream";
import {
  createAssistantStream,
  AssistantStreamController,
} from "../../modules/assistant-stream";

interface AssistantTransformStreamController extends AssistantStreamController {
  readonly desiredSize: number | null;

  error(reason?: any): void;
  terminate(): void;
}

interface AssistantTransformerFlushCallback {
  (controller: AssistantTransformStreamController): void | PromiseLike<void>;
}

interface AssistantTransformerStartCallback {
  (controller: AssistantTransformStreamController): void | PromiseLike<void>;
}

interface AssistantTransformerTransformCallback<I> {
  (
    chunk: I,
    controller: AssistantTransformStreamController,
  ): void | PromiseLike<void>;
}

type AssistantTransformer<I> = {
  flush?: AssistantTransformerFlushCallback;
  start?: AssistantTransformerStartCallback;
  transform?: AssistantTransformerTransformCallback<I>;
};

const promiseWithResolvers = function <T>() {
  let resolve: ((value: T | PromiseLike<T>) => void) | undefined;
  let reject: ((reason?: any) => void) | undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  if (!resolve || !reject) throw new Error("Failed to create promise");
  return { promise, resolve, reject };
};

export class AssistantTransformStream<I> extends TransformStream<
  I,
  AssistantStreamChunk
> {
  constructor(
    transformer: AssistantTransformer<I>,
    writableStrategy?: QueuingStrategy<I>,
    readableStrategy?: QueuingStrategy<AssistantStreamChunk>,
  ) {
    let runController: AssistantStreamController;
    let innerController: AssistantTransformStreamController;
    const { resolve, reject, promise } = promiseWithResolvers<void>();
    const stream = createAssistantStream((c) => {
      runController = c;
      return promise;
    });

    super(
      {
        start(controller) {
          innerController = {
            ...runController,
            get desiredSize() {
              return controller.desiredSize;
            },
            error(reason?: any) {
              reject(reason);
            },
            terminate() {
              resolve();
            },
          };

          stream.pipeTo(
            new WritableStream({
              write(chunk) {
                controller.enqueue(chunk);
              },
              abort(reason?: any) {
                controller.error(reason);
              },
              close() {
                controller.terminate();
              },
            }),
          );

          transformer.start?.(innerController);
        },
        transform(chunk) {
          transformer.transform?.(chunk, innerController);
        },
        flush() {
          transformer.flush?.(innerController);
        },
      },
      writableStrategy,
      readableStrategy,
    );
  }
}
