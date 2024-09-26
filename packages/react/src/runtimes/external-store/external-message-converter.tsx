import { useMemo } from "react";
import { ThreadMessageConverter } from "./ThreadMessageConverter";
import {
  getExternalStoreMessage,
  symbolInnerMessage,
} from "./getExternalStoreMessage";
import { fromThreadMessageLike, ThreadMessageLike } from "./ThreadMessageLike";
import { getAutoStatus, isAutoStatus } from "./auto-status";
import { ToolCallContentPart } from "../../types";

export namespace useExternalMessageConverter {
  export type Message =
    | ThreadMessageLike
    | {
        role: "tool";
        toolCallId: string;
        toolName?: string | undefined;
        result: any;
      };

  export type Callback<T> = (message: T) => Message | Message[];
}

type CallbackResult<T> = {
  input: T;
  outputs: useExternalMessageConverter.Message[];
};

type ChunkResult<T> = {
  inputs: T[];
  outputs: useExternalMessageConverter.Message[];
};

const joinExternalMessages = (
  messages: useExternalMessageConverter.Message[],
): ThreadMessageLike => {
  const assistantMessage: ThreadMessageLike & { content: any[] } = {
    role: "assistant",
    content: [],
  };
  for (const output of messages) {
    if (output.role === "tool") {
      const toolCallIdx = assistantMessage.content.findIndex(
        (c) => c.type === "tool-call" && c.toolCallId === output.toolCallId,
      );
      if (toolCallIdx !== -1) {
        const toolCall = assistantMessage.content[
          toolCallIdx
        ]! as ToolCallContentPart;
        if (output.toolName) {
          if (toolCall.toolName !== output.toolName)
            throw new Error(
              `Tool call name ${output.toolCallId} ${output.toolName} does not match existing tool call ${toolCall.toolName}`,
            );
        }
        assistantMessage.content[toolCallIdx] = {
          ...toolCall,
          result: output.result,
        };
      } else {
        throw new Error(
          `Tool call ${output.toolCallId} ${output.toolName} not found in assistant message`,
        );
      }
    } else {
      const role = output.role;
      switch (role) {
        case "system":
        case "user":
          return output;
        case "assistant":
          if (assistantMessage.content.length === 0) {
            assistantMessage.id = output.id;
            assistantMessage.createdAt ??= output.createdAt;
            assistantMessage.status ??= output.status;
            // TODO keep this in sync
          }
          assistantMessage.content.push(...output.content);
          break;
        default: {
          const unsupportedRole: never = role;
          throw new Error(`Unknown message role: ${unsupportedRole}`);
        }
      }
    }
  }
  return assistantMessage;
};

const chunkExternalMessages = <T,>(callbackResults: CallbackResult<T>[]) => {
  const results: ChunkResult<T>[] = [];
  let isAssistant = false;
  let inputs: T[] = [];
  let outputs: useExternalMessageConverter.Message[] = [];

  const flush = () => {
    if (outputs.length) {
      results.push({
        inputs,
        outputs,
      });
    }
    inputs = [];
    outputs = [];
  };

  for (const callbackResult of callbackResults) {
    for (const output of callbackResult.outputs) {
      if (!isAssistant || output.role === "user" || output.role === "system") {
        flush();
      }
      isAssistant = output.role === "assistant" || output.role === "tool";

      if (inputs.at(-1) !== callbackResult.input) {
        inputs.push(callbackResult.input);
      }
      outputs.push(output);
    }
  }
  flush();
  return results;
};

export const useExternalMessageConverter = <T extends WeakKey>({
  callback,
  messages,
  isRunning,
}: {
  callback: useExternalMessageConverter.Callback<T>;
  messages: T[];
  isRunning: boolean;
}) => {
  const state = useMemo(
    () => ({
      callback,
      callbackCache: new WeakMap<T, CallbackResult<T>>(),
      chunkCache: new WeakMap<
        useExternalMessageConverter.Message,
        ChunkResult<T>
      >(),
      converterCache: new ThreadMessageConverter(),
    }),
    [callback],
  );

  return useMemo(() => {
    const callbackResults: CallbackResult<T>[] = [];
    for (const message of messages) {
      let result = state.callbackCache.get(message);
      if (!result) {
        const output = state.callback(message);
        const outputs = Array.isArray(output) ? output : [output];
        result = { input: message, outputs };
        state.callbackCache.set(message, result);
      }
      callbackResults.push(result);
    }

    const chunks = chunkExternalMessages(callbackResults).map((m) => {
      const key = m.outputs[0];
      if (!key) return m;

      const cached = state.chunkCache.get(key);
      if (cached && shallowArrayEqual(cached.outputs, m.outputs)) return cached;
      state.chunkCache.set(key, m);
      return m;
    });

    return state.converterCache.convertMessages(
      chunks,
      (cache, message, idx) => {
        const isLast = idx === chunks.length - 1;
        const autoStatus = getAutoStatus(isLast, isRunning);

        if (
          cache &&
          (cache.role !== "assistant" ||
            !isAutoStatus(cache.status) ||
            cache.status === autoStatus)
        ) {
          const inputs = getExternalStoreMessage(cache) as T[];
          if (shallowArrayEqual(inputs, message.inputs)) {
            return cache;
          }
        }

        const newMessage = fromThreadMessageLike(
          joinExternalMessages(message.outputs),
          idx.toString(),
          autoStatus,
        );
        (newMessage as any)[symbolInnerMessage] = message.inputs;
        return newMessage;
      },
    );
  }, [state, messages, isRunning]);
};

const shallowArrayEqual = (a: unknown[], b: unknown[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};
