import { useChat } from "@ai-sdk/react";
import { useVercelUseChatRuntime } from "@assistant-ui/react-ai-sdk";

export const useLlamaIndexRuntime = ({
  api = "/api/chat",
}: { api?: string | undefined } = {}) => {
  const chat = useChat({ api });
  const runtime = useVercelUseChatRuntime(chat);
  return runtime;
};
