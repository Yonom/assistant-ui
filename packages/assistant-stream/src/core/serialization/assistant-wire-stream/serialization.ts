import { AssistantWireStreamChunk } from "./chunk-types";

export class SSEEncoder extends TransformStream<
  AssistantWireStreamChunk,
  string
> {
  constructor() {
    super({
      transform: (chunk, controller) => {
        controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
      },
    });
  }
}

export class SSEDecoder extends TransformStream<
  string,
  AssistantWireStreamChunk
> {
  constructor() {
    let expectEmptyLine = false;
    super({
      transform: (chunk, controller) => {
        if (chunk === "") {
          if (expectEmptyLine) {
            throw new Error("Invalid stream part, expected data line");
          }

          expectEmptyLine = false;
          return;
        } else {
          if (expectEmptyLine) {
            throw new Error("Invalid stream part, expected empty line");
          }
          expectEmptyLine = true;

          const PREFIX = "data: ";
          if (!chunk.startsWith(PREFIX))
            throw new Error(
              `Invalid stream part, expected line to start with ${PREFIX}`,
            );

          controller.enqueue(JSON.parse(chunk.slice(PREFIX.length)));
        }
      },
    });
  }
}
