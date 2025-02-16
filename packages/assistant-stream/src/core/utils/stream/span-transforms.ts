import { AssistantStreamChunk } from "../../AssistantStream";
import { Counter } from "../Counter";

export class SpanParentEncoder extends TransformStream<
  AssistantStreamChunk,
  AssistantStreamChunk
> {
  constructor(parentAllocator: Counter) {
    const allocator = new Counter();
    const allocatedIds = new Map<number, number>([
      [allocator.up(), parentAllocator.up()],
    ]);

    super({
      transform(chunk, controller) {
        const { type, parentId } = chunk;

        const tParentId = allocatedIds.get(parentId);
        if (tParentId === undefined) throw new Error("Parent id not found");

        if (type === "span") {
          allocatedIds.set(allocator.up(), parentAllocator.up());
        } else if (type === "finish") {
          allocatedIds.delete(parentId);

          if (parentId === 0) {
            if (allocatedIds.size > 0) {
              throw new Error("A sub-span was not closed before its parent");
            }
          }
        }

        controller.enqueue({
          ...chunk,
          parentId: tParentId,
        });
      },
      flush() {
        if (allocatedIds.size > 0) {
          throw new Error("Missing span-finish");
        }
      },
    });
  }
}

export class SpanParentDecoder extends TransformStream<
  AssistantStreamChunk,
  AssistantStreamChunk
> {
  constructor(parentAllocator: Counter) {
    const allocator = new Counter();
    const allocatedIds = new Map<number, number>([
      [parentAllocator.up(), allocator.up()],
    ]);

    super({
      transform(chunk, controller) {
        const { type, parentId } = chunk;

        const tParentId = allocatedIds.get(parentId);
        if (tParentId === undefined)
          throw new Error(
            "Parent id not found" +
              parentId +
              JSON.stringify([...allocatedIds.keys()]),
          );

        if (type === "span") {
          allocatedIds.set(parentAllocator.up(), allocator.up());
        } else if (type === "finish") {
          allocatedIds.delete(parentId);
        }

        controller.enqueue({
          ...chunk,
          parentId: tParentId,
        });
      },
      flush() {
        if (allocatedIds.size > 0) {
          throw new Error("Missing span-finish");
        }
      },
    });
  }
}
