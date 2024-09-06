import { LangChainEvent, LangChainMessage } from "./types";

export const handleStreamEvent = (
  prevMessages: LangChainMessage[],
  event: LangChainEvent,
) => {
  if (
    event.event === "messages/partial" ||
    event.event === "messages/complete"
  ) {
    const newMessages = [...prevMessages];
    for (const message of event.data) {
      if (message.type === "human") continue; // ignore human messages

      const idx =
        message.type === "ai"
          ? prevMessages.findIndex(
              (m) => m.type === "ai" && m.id === message.id,
            )
          : message.type === "tool"
            ? prevMessages.findIndex(
                (m) =>
                  m.type === "tool" && m.tool_call_id === message.tool_call_id,
              )
            : -1;

      if (idx === -1) {
        newMessages.push(message);
      } else {
        newMessages[idx] = message;
      }
    }
    return newMessages;
  }
  return prevMessages;
};
