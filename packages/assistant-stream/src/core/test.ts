// span = assistant-stream
// you can nest assistant-streams (inside spans that accept nesting)
// 1 content part = 1 assistant-stream / span

// root container span
// spans have controllers to emit events
// assistant-stream === span  (span: start, events, finish, errors?)

<<<<<<< ours
import { createAssistantStreamResponse } from "./modules/runs";
||||||| ancestor
import { createAssistantRun } from "./modules/runs";
=======
import { createAssistantStreamResponse } from "./modules/assistant-stream";
>>>>>>> theirs
import { AssistantStream } from "./AssistantStream";
<<<<<<< ours
import { DataStreamDecoder } from "./serialization/DataStream";
||||||| ancestor
import {
  DataStreamDecoder,
  DataStreamEncoder,
} from "./serialization/DataStream";
=======
import { DataStreamDecoder } from "./serialization/data-stream/DataStream";
>>>>>>> theirs

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const POST = () => {
<<<<<<< ours
  return createAssistantStreamResponse(async (controller) => {
||||||| ancestor
  const stream = createAssistantRun(async (controller) => {
=======
  const stream = createAssistantStreamResponse(async (controller) => {
>>>>>>> theirs
    controller.appendText("hello ");
    await sleep(1000);
    controller.appendText("world!");
  });
<<<<<<< ours
||||||| ancestor
  return stream.toResponse(new DataStreamEncoder());
=======
  return stream;
>>>>>>> theirs
};

const stream = AssistantStream.fromResponse(POST(), new DataStreamDecoder());
const reader = stream.getReader();
console.log(await reader.read());
console.log(await reader.read());
console.log(await reader.read());
