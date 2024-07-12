import { ThreadMessage, CoreMessage } from "../../../types";

export const toCoreMessages = (message: ThreadMessage[]): CoreMessage[] => {
  return message.map((message) => {
    return {
      role: message.role,
      content: message.content.map((part) => {
        if (part.type === "ui") throw new Error("UI parts are not supported");
        return part;
      }),
    } as CoreMessage;
  });
};
