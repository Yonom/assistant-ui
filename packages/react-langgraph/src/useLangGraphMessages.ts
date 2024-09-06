import { useState, useCallback } from "react";

export const useLangGraphMessages = <TMessage>({
  stream,
}: {
  stream: (message: TMessage) => Promise<
    AsyncGenerator<{
      event: string;
      data: any;
    }>
  >;
}) => {
  const [messages, setMessages] = useState<TMessage[]>([]);

  const sendMessage = useCallback(
    async (message: TMessage) => {
      if (message !== null) {
        setMessages((currentMessages) => [...currentMessages, message]);
      }

      const response = await stream(message);

      const completeMessages: TMessage[] = [];
      let partialMessages: Map<string, TMessage> = new Map();
      for await (const chunk of response) {
        if (chunk.event === "messages/partial") {
          for (const message of chunk.data) {
            if (!message.id) throw new Error("Partial message missing id");

            partialMessages.set(message.id, message);
          }
        } else if (chunk.event === "messages/complete") {
          for (const message of chunk.data) {
            if (!message.id) continue;
            partialMessages.delete(message.id);
          }

          completeMessages.push(...chunk.data);
        } else {
          continue;
        }

        setMessages([...completeMessages, ...partialMessages.values()]);
      }
      if (partialMessages.size > 0) {
        throw new Error("A partial message was not marked as complete");
      }
    },
    [stream],
  );

  return { messages, sendMessage };
};
