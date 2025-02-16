import { expect, it } from "vitest";
import { AssistantStreamChunk } from "../../AssistantStream";
import { SpanParentDecoder, SpanParentEncoder } from "./span-transforms";
import { Counter } from "../Counter";

const span = (parentId: number) =>
  ({
    type: "span",
    parentId,
    path: [],
    init: { type: "run" },
  }) as const;

const finish = (parentId: number) =>
  ({
    type: "finish",
    parentId,
    status: { type: "complete", reason: "unknown" },
  }) as const;

const fromArray = (chunks: AssistantStreamChunk[]) => {
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    },
  });
  return stream;
};

const toArray = async (stream: ReadableStream<AssistantStreamChunk>) => {
  const chunks: AssistantStreamChunk[] = [];
  await stream.pipeTo(
    new WritableStream({
      write(chunk) {
        chunks.push(chunk);
      },
    }),
  );
  return chunks;
};

it("span parent encode & decode", async () => {
  const chunks: AssistantStreamChunk[] = [
    span(0), // 1
    span(1), // 2
    span(1), // 3
    span(3), // 4
    finish(2),
    finish(4),
    finish(3),
    finish(1),
    finish(0),
  ];
  const streamFromArray = fromArray(chunks);

  const allocator = new Counter();
  allocator.up();

  const stream = streamFromArray.pipeThrough(new SpanParentEncoder(allocator));

  const decodeAllocator = new Counter();
  decodeAllocator.up();
  const decoded = stream.pipeThrough(new SpanParentDecoder(decodeAllocator));

  const result = await toArray(decoded);
  expect(result).toEqual(chunks);
});

it("warns about unfinished spans", async () => {
  const chunks: AssistantStreamChunk[] = [];
  const streamFromArray = fromArray(chunks);

  const allocator = new Counter();
  allocator.up();

  const stream = streamFromArray.pipeThrough(new SpanParentEncoder(allocator));
  await expect(
    async () => await toArray(stream),
  ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Missing span-finish]`);
});

it("warns about unclosed nested spans", async () => {
  const chunks: AssistantStreamChunk[] = [
    span(0), // 1
    finish(0),
  ];
  const streamFromArray = fromArray(chunks);

  const allocator = new Counter();
  allocator.up();

  const stream = streamFromArray.pipeThrough(new SpanParentEncoder(allocator));
  await expect(
    async () => await toArray(stream),
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `[Error: A sub-span was not closed before its parent]`,
  );
});
