import {
  getExternalStoreMessage,
  type ThreadMessage,
} from "@assistant-ui/react";

/**
 * @deprecated Use `getExternalStoreMessage` instead.
 */
export const getVercelRSCMessage = (message: ThreadMessage) => {
  return getExternalStoreMessage(message);
};
