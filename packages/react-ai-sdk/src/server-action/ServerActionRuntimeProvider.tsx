import "server-only";

import {
  AssistantRuntimeProvider,
  type ChatModelAdapter,
  useLocalRuntime,
} from "@assistant-ui/react";
import {
  type CoreMessage,
  type CoreTool,
  type LanguageModel,
  type StreamTextResult,
  streamText,
} from "ai";
import { type StreamableValue, readStreamableValue } from "ai/rsc";
import type { FC, PropsWithChildren } from "react";
import { convertToCoreMessage } from "../core/convertToCoreMessage";

type ChatParameters = {
  messages: CoreMessage[];
  system?: string | undefined;
};

type ServerActionRuntimeProviderProps = PropsWithChildren<{
  model: LanguageModel;
}>;

const createServerActionRuntimeModelAdapter = (
  handleAction: (
    parameters: ChatParameters,
  ) => Promise<StreamTextResult<Record<string, CoreTool>>>,
): ChatModelAdapter => ({
  async run({ messages, config: { system }, onUpdate }) {
    const coreMessages = messages.flatMap(convertToCoreMessage);
    // TODO tool support
    // TODO cancellation
    const result = await handleAction({ messages: coreMessages, system });

    const content = [{ type: "text" as const, text: "" }];

    for await (const delta of result.textStream) {
      content[0]!.text = delta ?? "";
      onUpdate({ content });
    }

    return { content };
  },
});

export const ServerActionRuntimeProvider: FC<
  ServerActionRuntimeProviderProps
> = ({ children, model }) => {
  const handleAction = async ({ messages, system }: ChatParameters) => {
    "use server";

    const result = await streamText({
      model,
      ...(system ? { system } : undefined),
      messages,
    });

    return result;
  };

  const adapter = createServerActionRuntimeModelAdapter(handleAction);
  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};
