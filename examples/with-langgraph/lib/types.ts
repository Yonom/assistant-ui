export type LangChainToolCallChunk = {
  id: string;
  name: string;
  args: string;
};

export type LangChainToolCall = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

export type LangChainMessage =
  | {
      id?: undefined;
      type: "human" | "system";
      content: string;
    }
  | {
      id?: undefined;
      type: "tool";
      content: string;
      tool_call_id: string;
      name: string;
    }
  | {
      id: string;
      type: "ai";
      content: string;
      tool_call_chunks?: LangChainToolCallChunk[];
      tool_calls?: LangChainToolCall[];
    };

export type LangChainEvent = {
  event: "messages/partial" | "messages/complete";
  data: LangChainMessage[];
};

export type Model = "openai" | string; // Add other model options as needed
