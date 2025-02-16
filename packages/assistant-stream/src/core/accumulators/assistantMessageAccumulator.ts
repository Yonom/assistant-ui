import { AssistantStreamChunk } from "../AssistantStream";
import { parsePartialJson } from "./partial-json/parse-partial-json";
import {
  AssistantMessage,
  TextContentPart,
  ToolCallContentPart,
} from "../utils/types";
import { SpanContainerSplitter } from "../utils/stream/container-stream-utils";

class TextAccumulator extends WritableStream<AssistantStreamChunk> {
  constructor(
    setState: (
      callback: (prevState: TextContentPart) => TextContentPart,
    ) => void,
  ) {
    super({
      start() {
        setState((prevState) => ({
          ...prevState,
          status: { type: "running" },
        }));
      },
      write(chunk) {
        const { type, parentId } = chunk;
        if (parentId !== 0) throw new Error("Invalid parent id for text part");

        switch (type) {
          case "text-delta": {
            setState((prevState) => ({
              ...prevState,
              text: prevState.text + chunk.textDelta,
            }));
            break;
          }

          case "finish": {
            setState((prevState) => ({
              ...prevState,
              status: chunk.status as TextContentPart["status"],
            }));
            break;
          }

          default: {
            throw new Error(`Unsupported chunk type: ${type}`);
          }
        }
      },
    });
  }
}

class ToolCallAccumulator extends WritableStream<AssistantStreamChunk> {
  constructor(
    setState: (
      callback: (prevState: ToolCallContentPart) => ToolCallContentPart,
    ) => void,
  ) {
    super({
      start() {
        setState((prevState) => ({
          ...prevState,
          status: { type: "running", isArgsComplete: false },
        }));
      },
      write(chunk) {
        const { type, parentId } = chunk;
        if (parentId !== 0) throw new Error("Invalid parent id for text part");

        switch (type) {
          case "tool-call-args-text-delta": {
            setState((prevState) => ({
              ...prevState,
              argsText: prevState.argsText + chunk.argsTextDelta,
              args: parsePartialJson(prevState.argsText),
            }));
            break;
          }

          case "tool-result": {
            setState((prevState) => ({
              ...prevState,
              result: chunk.result,
            }));
            break;
          }

          case "finish": {
            setState((prevState) => ({
              ...prevState,
              status: chunk.status as ToolCallContentPart["status"],
            }));
            break;
          }

          default: {
            throw new Error(`Unsupported chunk type: ${type}`);
          }
        }
      },
    });
  }
}

const withMutationAtPath = <T>(
  obj: T,
  path: readonly (string | number)[],
  value: unknown,
): T => {
  const [key, ...rest] = path;
  if (key === undefined) throw new Error("Empty path not allowed");

  const clone: any = Array.isArray(obj) ? [...obj] : { ...obj };
  if (rest.length === 0) {
    clone[key] = value;
  } else {
    clone[key] = withMutationAtPath(clone[key], rest, value);
  }

  return clone;
};

const getAtPath = (obj: any, path: readonly string[]) => {
  if (path.length === 0) return obj;
  const [key, ...rest] = path;
  return getAtPath(obj[key!], rest);
};

const refPathDispatch = <T1, T2>(
  path: readonly string[],
  get: () => T1,
  set: (value: T1) => void,
) => {
  return (callback: (value: T2) => T2) => {
    const value = get();
    set(withMutationAtPath(value, path, callback(getAtPath(value, path))));
  };
};

export const assistantMessageAccumulator = () => {
  let message: AssistantMessage = {
    role: "assistant",
    content: [],
    status: { type: "running" },
    metadata: {
      steps: [],
      custom: {},
    },
  };
  const splitter = new SpanContainerSplitter();
  const writer = splitter.writable.getWriter();
  const transformer = new TransformStream<
    AssistantStreamChunk,
    AssistantMessage
  >({
    transform(chunk, controller) {
      const getMessage = () => message;
      const setMessage = (value: AssistantMessage) => {
        message = value;
        controller.enqueue(value);
      };

      const { type, parentId } = chunk;
      if (parentId === 0) {
        switch (type) {
          case "span": {
            const { span: init, path } = chunk;
            switch (init.type) {
              case "text": {
                if (path.length === 0)
                  throw new Error("Invalid path for text part");

                message = withMutationAtPath(message, path, () => ({
                  type: "text",
                  text: "",
                  status: { type: "running" },
                }));

                splitter.add(
                  new TextAccumulator(
                    refPathDispatch(path, getMessage, setMessage),
                  ),
                );
                break;
              }

              case "tool-call": {
                if (path.length === 0)
                  throw new Error("Invalid path for text part");

                const { toolCallId, toolName } = init;
                message = withMutationAtPath(message, path, () => ({
                  type: "tool-call",
                  toolCallId,
                  toolName,
                  argsText: "",
                  args: {},
                  status: { type: "running", isArgsComplete: false },
                }));

                splitter.add(
                  new ToolCallAccumulator(
                    refPathDispatch(path, getMessage, setMessage),
                  ),
                );
                break;
              }

              default: {
                throw new Error(`Unsupported span type: ${init.type}`);
              }
            }
            break;
          }

          case "finish": {
            message = withMutationAtPath(message, ["status"], () => ({
              type: "finish",
              parentId: 0,
              status: chunk.status,
            }));
            break;
          }

          default: {
            throw new Error(`Unsupported chunk type: ${type}`);
          }
        }
      } else {
        writer.write(chunk);
      }
    },

    flush() {
      writer.close();
    },
  });

  return transformer;
};
