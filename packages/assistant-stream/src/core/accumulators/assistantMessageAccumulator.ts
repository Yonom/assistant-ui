import { AssistantStreamChunk } from "../AssistantStream";
import { parsePartialJson } from "../utils/json/parse-partial-json";
import {
  AssistantMessage,
  AssistantMessageStatus,
  TextPart,
  ToolCallPart,
  SourcePart,
} from "../utils/types";

/**
 * Creates an initial AssistantMessage.
 */
const createInitialMessage = (): AssistantMessage => ({
  role: "assistant",
  status: { type: "running" },
  parts: [],
  metadata: {
    unstable_data: [],
    unstable_annotations: [],
    steps: [],
    custom: {},
  },
});

/**
 * Helper to update the last part in the message.
 * If no parts exist, logs an error.
 */
const updateLastPart = (
  message: AssistantMessage,
  updater: (lastPart: any) => any,
): AssistantMessage => {
  if (message.parts.length === 0) {
    console.error("No parts available to update.");
    return message;
  }
  const lastIndex = message.parts.length - 1;
  const updatedPart = updater(message.parts[lastIndex]);
  return {
    ...message,
    parts: [...message.parts.slice(0, lastIndex), updatedPart],
  };
};

/**
 * Handles a "part" chunk by appending a new part to the message.
 */
const handlePart = (
  message: AssistantMessage,
  chunk: AssistantStreamChunk & { type: "part" },
): AssistantMessage => {
  const partInit = chunk.part;
  if (partInit.type === "text" || partInit.type === "reasoning") {
    const newTextPart: TextPart = {
      type: "text",
      text: "",
      status: { type: "running" },
    };
    return { ...message, parts: [...message.parts, newTextPart] };
  } else if (partInit.type === "tool-call") {
    const newToolCallPart: ToolCallPart = {
      type: "tool-call",
      status: { type: "running", isArgsComplete: false },
      toolCallId: partInit.toolCallId,
      toolName: partInit.toolName,
      argsText: "",
      args: {},
    };
    return { ...message, parts: [...message.parts, newToolCallPart] };
  } else if (partInit.type === "source") {
    const newSourcePart: SourcePart = {
      type: "source",
      sourceType: partInit.sourceType,
      id: partInit.id,
      url: partInit.url,
      ...(partInit.title ? { title: partInit.title } : undefined),
    };
    return { ...message, parts: [...message.parts, newSourcePart] };
  } else {
    console.warn("Ignoring unsupported part type:", partInit.type);
    return message;
  }
};

/**
 * Handles a "text-delta" chunk by appending the delta
 * to the most recent part.
 */
const handleTextDelta = (
  message: AssistantMessage,
  chunk: AssistantStreamChunk & { type: "text-delta" },
): AssistantMessage => {
  return updateLastPart(message, (lastPart) => {
    if (lastPart.type === "text") {
      return { ...lastPart, text: lastPart.text + chunk.textDelta };
    } else if (lastPart.type === "tool-call") {
      const newArgsText = lastPart.argsText + chunk.textDelta;
      let newArgs: Record<string, unknown>;
      try {
        newArgs = parsePartialJson(newArgsText);
      } catch (err) {
        newArgs = lastPart.args;
      }
      return { ...lastPart, argsText: newArgsText, args: newArgs };
    } else {
      console.error(
        "text-delta received but last part is neither text nor tool-call",
      );
      return lastPart;
    }
  });
};

/**
 * Handles a "result" chunk by updating the most recent tool-call part.
 */
const handleResult = (
  message: AssistantMessage,
  chunk: AssistantStreamChunk & { type: "result" },
): AssistantMessage => {
  return updateLastPart(message, (lastPart) => {
    if (lastPart.type === "tool-call") {
      return {
        ...lastPart,
        result: chunk.result,
        isError: chunk.isError ?? false,
        // Marking as complete; adjust the reason as needed.
        status: { type: "complete", reason: "stop" },
      };
    } else {
      console.error("Result chunk received but last part is not a tool-call");
      return lastPart;
    }
  });
};

/**
 * Handles a "finish" chunk by updating the overall message status.
 */
const handleFinish = (
  message: AssistantMessage,
  chunk: AssistantStreamChunk & { type: "finish" },
): AssistantMessage => {
  const finishReason = chunk.finishReason;
  let newStatus: AssistantMessageStatus;
  if (finishReason === "stop" || finishReason === "unknown") {
    newStatus = { type: "complete", reason: finishReason };
  } else {
    newStatus = {
      type: "incomplete",
      reason: finishReason,
    };
  }
  return { ...message, status: newStatus };
};

/**
 * The accumulator transform stream.
 */
export const assistantMessageAccumulator = (): TransformStream<
  AssistantStreamChunk,
  AssistantMessage
> => {
  let message: AssistantMessage = createInitialMessage();

  return new TransformStream<AssistantStreamChunk, AssistantMessage>({
    transform(chunk, controller) {
      const type = chunk.type;
      switch (type) {
        case "part":
          message = handlePart(message, chunk);
          break;
        case "text-delta":
          message = handleTextDelta(message, chunk);
          break;
        case "result":
          message = handleResult(message, chunk);
          break;
        case "finish":
          message = handleFinish(message, chunk);
          break;

        case "annotations":
        case "data":
        case "step-start":
        case "step-finish":
        case "error":
          break;

        default: {
          const unhandledType: never = type;
          throw new Error(`Unsupported chunk type: ${unhandledType}`);
        }
      }
      controller.enqueue(message);
    },
    flush(controller) {
      controller.enqueue(message);
    },
  });
};
