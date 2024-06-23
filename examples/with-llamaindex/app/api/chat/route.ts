import { getLlamaIndexStream } from "@assistant-ui/react-llamaindex/server";
import { createChatEngine } from "./engine/chat";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const chatEngine = await createChatEngine();

  return getLlamaIndexStream({ messages, chatEngine });
}
