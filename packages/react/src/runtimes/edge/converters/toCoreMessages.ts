import { ThreadMessage, CoreMessage } from "../../../types";

type ToCoreMessageOptions = {
  includeId?: boolean | undefined;
};

type CoreMessageWithConditionalId<T extends boolean> = T extends true
  ? CoreMessage & { id?: string }
  : CoreMessage;

export const toCoreMessages = <T extends boolean = false>(
  messages: ThreadMessage[],
  options: ToCoreMessageOptions & { includeId?: T | undefined } = {},
): CoreMessageWithConditionalId<T>[] => {
  return messages.map((message) => toCoreMessage(message, options));
};

export const toCoreMessage = <T extends boolean = false>(
  message: ThreadMessage,
  options: ToCoreMessageOptions & { includeId?: T | undefined } = {},
): CoreMessageWithConditionalId<T> => {
  const includeId = options.includeId ?? false;
  const role = message.role;
  switch (role) {
    case "assistant":
      return {
        role,
        content: message.content.map((part) => {
          if (part.type === "ui") throw new Error("UI parts are not supported");
          if (part.type === "tool-call") {
            const { argsText, ...rest } = part;
            return rest;
          }
          return part;
        }),
        ...(includeId ? { id: message.id } : {}),
      };

    case "user":
      return {
        role,
        content: [
          ...message.content.map((part) => {
            if (part.type === "ui")
              throw new Error("UI parts are not supported");
            return part;
          }),
          ...message.attachments.map((a) => a.content).flat(),
        ],
        ...(includeId ? { id: message.id } : {}),
      };

    case "system":
      return {
        role,
        content: message.content,
        ...(includeId ? { id: message.id } : {}),
      };

    default: {
      const unsupportedRole: never = role;
      throw new Error(`Unknown message role: ${unsupportedRole}`);
    }
  }
};
