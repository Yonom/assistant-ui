import type { useAssistant } from "@ai-sdk/react";
import {
  useExternalMessageConverter,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { convertMessage } from "../utils/convertMessage";
import { useInputSync } from "../utils/useInputSync";
import { toCreateMessage } from "../utils/toCreateMessage";
import { vercelAttachmentAdapter } from "../utils/vercelAttachmentAdapter";
import { ExternalStoreAdapter } from "@assistant-ui/react";

export type VercelUseChatAdapter = {
  adapters?:
    | Omit<NonNullable<ExternalStoreAdapter["adapters"]>, "attachments">
    | undefined;
};

export const useVercelUseAssistantRuntime = (
  assistantHelpers: ReturnType<typeof useAssistant>,
  adapter: VercelUseChatAdapter = {},
) => {
  const messages = useExternalMessageConverter({
    callback: convertMessage,
    isRunning: assistantHelpers.status === "in_progress",
    messages: assistantHelpers.messages,
  });
  const runtime = useExternalStoreRuntime({
    isRunning: assistantHelpers.status === "in_progress",
    messages,
    onCancel: async () => assistantHelpers.stop(),
    onNew: async (message) => {
      await assistantHelpers.append(await toCreateMessage(message));
    },
    adapters: {
      attachments: vercelAttachmentAdapter,
      ...adapter.adapters,
      threadList: new Proxy(adapter.adapters?.threadList ?? {}, {
        get(target, prop, receiver) {
          if (prop === "onSwitchToNewThread") {
            return () => {
              assistantHelpers.messages = [];
              assistantHelpers.input = "";
              assistantHelpers.setMessages([]);
              assistantHelpers.setInput("");

              if (typeof target.onSwitchToNewThread === "function") {
                return target.onSwitchToNewThread.call(target);
              }
            };
          }

          return Reflect.get(target, prop, receiver);
        },
      }),
    },
  });

  useInputSync(assistantHelpers, runtime);

  return runtime;
};
