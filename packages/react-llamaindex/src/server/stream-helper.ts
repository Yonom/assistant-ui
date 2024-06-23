import { StreamData } from "ai";
import {
  CallbackManager,
  Metadata,
  NodeWithScore,
  ToolCall,
  ToolOutput,
} from "llamaindex";

function getNodeUrl(metadata: Metadata) {
  const url = metadata["URL"];
  if (url) return url;
  const fileName = metadata["file_name"];
  if (!process.env["FILESERVER_URL_PREFIX"]) {
    console.warn(
      "FILESERVER_URL_PREFIX is not set. File URLs will not be generated.",
    );
    return undefined;
  }
  if (fileName) {
    return `${process.env["FILESERVER_URL_PREFIX"]}/data/${fileName}`;
  }
  return undefined;
}

export function appendSourceData(
  data: StreamData,
  sourceNodes?: NodeWithScore<Metadata>[],
) {
  if (!sourceNodes?.length) return;
  data.appendMessageAnnotation({
    type: "sources",
    data: {
      nodes: sourceNodes.map((node) => ({
        ...node.node.toMutableJSON(),
        id: node.node.id_,
        score: node.score ?? null,
        url: getNodeUrl(node.node.metadata),
      })),
    },
  });
}

export function appendEventData(data: StreamData, title?: string) {
  if (!title) return;
  data.appendMessageAnnotation({
    type: "events",
    data: {
      title,
    },
  });
}

export function appendToolData(
  data: StreamData,
  toolCall: ToolCall,
  toolOutput: ToolOutput,
) {
  data.appendMessageAnnotation({
    type: "tools",
    data: {
      toolCall: {
        id: toolCall.id,
        name: toolCall.name,
        input: toolCall.input,
      },
      toolOutput: {
        output: toolOutput.output,
        isError: toolOutput.isError,
      },
    },
  });
}

export function createStreamTimeout(stream: StreamData) {
  const timeout = Number(process.env["STREAM_TIMEOUT"] ?? 1000 * 60 * 5); // default to 5 minutes
  const t = setTimeout(() => {
    appendEventData(stream, `Stream timed out after ${timeout / 1000} seconds`);
    stream.close();
  }, timeout);
  return t;
}

export function createCallbackManager(stream: StreamData) {
  const callbackManager = new CallbackManager();

  callbackManager.on("retrieve", (data) => {
    const { nodes, query } = data.detail;
    appendEventData(stream, `Retrieving context for query: '${query}'`);
    appendEventData(
      stream,
      `Retrieved ${nodes.length} sources to use as context for the query`,
    );
  });

  callbackManager.on("llm-tool-call", (event) => {
    const { name, input } = event.detail.payload.toolCall;
    const inputString = Object.entries(input)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
    appendEventData(
      stream,
      `Using tool: '${name}' with inputs: '${inputString}'`,
    );
  });

  callbackManager.on("llm-tool-result", (event) => {
    const { toolCall, toolResult } = event.detail.payload;
    appendToolData(stream, toolCall, toolResult);
  });

  return callbackManager;
}

export type CsvFile = {
  content: string;
  filename: string;
  filesize: number;
  id: string;
};
