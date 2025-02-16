import {
  AppendContentChunk,
  TextDeltaChunk,
  ToolResultChunk,
  StateUpdateChunk,
  FinishChunk,
} from "./assistant-stream-chunks";

export type AssistantStream = ReadableStream<AssistantStreamChunk>;

export const AssistantStream = {
  toResponse(
<<<<<<< ours
    stream: AssistantStream,
||||||| ancestor
=======
    readable: ReadableStream<AssistantStreamChunk>,
>>>>>>> theirs
    transformer: ReadableWritablePair<Uint8Array, AssistantStreamChunk>,
  ) {
<<<<<<< ours
    return new Response(AssistantStream.toByteStream(stream, transformer));
  },

  fromResponse(
||||||| ancestor
    return new Response(this.toByteStream(transformer));
  }

  static fromResponse(
=======
    return new Response(AssistantStream.toByteStream(readable, transformer));
  },
  fromResponse(
>>>>>>> theirs
    response: Response,
    transformer: ReadableWritablePair<AssistantStreamChunk, Uint8Array>,
  ) {
    return AssistantStream.fromByteStream(response.body!, transformer);
<<<<<<< ours
  },

||||||| ancestor
  }

=======
  },
>>>>>>> theirs
  toByteStream(
<<<<<<< ours
    stream: AssistantStream,
||||||| ancestor
=======
    readable: ReadableStream<AssistantStreamChunk>,
>>>>>>> theirs
    transformer: ReadableWritablePair<Uint8Array, AssistantStreamChunk>,
  ) {
<<<<<<< ours
    return stream.pipeThrough(transformer);
  },

  fromByteStream(
||||||| ancestor
    return this.readable.pipeThrough(transformer);
  }

  static fromByteStream(
=======
    return readable.pipeThrough(transformer);
  },
  fromByteStream(
>>>>>>> theirs
    readable: ReadableStream<Uint8Array>,
    transformer: ReadableWritablePair<AssistantStreamChunk, Uint8Array>,
  ) {
    return readable.pipeThrough(transformer);
  },
};
