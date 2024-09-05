export type Message = {
  id: string;
  text: string;
  sender: string;
  toolCalls?: ToolCall[];
};

export interface ToolCall {
  id: string;
  name: string;
  args: string;
  result?: any;
}

export type Model = "openai" | string; // Add other model options as needed
