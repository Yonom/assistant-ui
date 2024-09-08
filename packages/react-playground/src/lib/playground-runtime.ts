import {
  AddToolResultOptions,
  AppendMessage,
  EdgeChatAdapter,
  EdgeRuntimeOptions,
  EdgeRuntimeRequestOptions,
  fromCoreMessages,
  fromLanguageModelTools,
  ModelConfig,
  ModelConfigProvider,
  ReactThreadRuntime,
  TextContentPart,
  ThreadAssistantContentPart,
  ThreadUserContentPart,
  Tool,
  ToolCallContentPart,
  ThreadMessage,
  ThreadAssistantMessage,
  ChatModelAdapter,
  Unsubscribe,
  AssistantRuntime,
  ChatModelRunResult,
  CoreMessage,
  fromCoreMessage,
  INTERNAL,
} from "@assistant-ui/react";
import { LanguageModelV1FunctionTool } from "@ai-sdk/provider";
import { useState } from "react";
import { create } from "zustand";

const {
  BaseAssistantRuntime,
  ProxyConfigProvider,
  generateId,
  ThreadRuntimeComposer,
} = INTERNAL;

const makeModelConfigStore = () =>
  create<ModelConfig>(() => ({
    system: "",
    tools: {},
    callSettings: {
      temperature: 1,
      maxTokens: 256,
    },
    config: {},
  }));

class PlaygroundRuntime
  extends BaseAssistantRuntime<PlaygroundThreadRuntime>
  implements AssistantRuntime
{
  private readonly _proxyConfigProvider: InstanceType<
    typeof ProxyConfigProvider
  >;

  constructor(initialMessages: CoreMessage[], adapter: ChatModelAdapter) {
    const cp = new ProxyConfigProvider();
    super(
      new PlaygroundThreadRuntime(
        cp,
        fromCoreMessages(initialMessages),
        adapter,
      ),
    );
    this._proxyConfigProvider = cp;
  }

  public switchToThread(threadId: string | null) {
    if (threadId)
      throw new Error("PlaygroundRuntime does not support switching threads");

    this.thread = new PlaygroundThreadRuntime(
      this._proxyConfigProvider,
      [],
      this.thread.adapter,
    );
  }

  public override registerModelConfigProvider(
    provider: ModelConfigProvider,
  ): Unsubscribe {
    return this._proxyConfigProvider.registerModelConfigProvider(provider);
  }
}

const CAPABILITIES = Object.freeze({
  switchToBranch: false,
  edit: false,
  reload: false,
  cancel: true,
  unstable_copy: false,
  speak: false,
  attachments: false,
});

const EMPTY_BRANCHES: readonly string[] = Object.freeze([]);

export class PlaygroundThreadRuntime implements ReactThreadRuntime {
  private _subscriptions = new Set<() => void>();

  private abortController: AbortController | null = null;

  public tools: Record<string, Tool<any, any>> = {};

  public readonly threadId = generateId();
  public readonly isDisabled = false;
  public readonly capabilities = CAPABILITIES;

  private configProvider = new ProxyConfigProvider();

  public readonly composer = new ThreadRuntimeComposer(
    this,
    this.notifySubscribers.bind(this),
  );

  constructor(
    configProvider: ModelConfigProvider,
    private _messages: ThreadMessage[],
    public readonly adapter: ChatModelAdapter,
  ) {
    this.configProvider.registerModelConfigProvider(configProvider);
    this.configProvider.registerModelConfigProvider({
      getModelConfig: () => this.useModelConfig.getState(),
    });
  }

  public setRequestData({
    apiKey,
    baseUrl,
    modelName,
    messages,
    system,
    tools,
    ...callSettings
  }: EdgeRuntimeRequestOptions) {
    this.setMessages(fromCoreMessages(messages));
    const config: ModelConfig = {
      system,
      tools: tools
        ? fromLanguageModelTools(tools as LanguageModelV1FunctionTool[])
        : undefined,
      callSettings,
      config: {
        apiKey,
        baseUrl,
        modelName,
      },
    };
    this.useModelConfig.setState(config);
  }

  public readonly useModelConfig = makeModelConfigStore();

  public get messages() {
    return this._messages;
  }

  private setMessages(messages: ThreadMessage[]) {
    this._messages = messages;
    this.notifySubscribers();
  }

  public getBranches(): readonly string[] {
    // no need to implement this for the playground
    return EMPTY_BRANCHES;
  }

  public switchToBranch(): void {
    // no need to implement this for the playground
    throw new Error("Branch switching is not supported.");
  }

  public async append({ parentId, ...message }: AppendMessage): Promise<void> {
    if (parentId !== (this.messages.at(-1)?.id ?? null))
      throw new Error("Message editing is not supported..");

    this.setMessages([...this.messages, fromCoreMessage(message)]);
  }

  public async startRun(): Promise<void> {
    let message: ThreadAssistantMessage = {
      id: generateId(),
      role: "assistant",
      status: { type: "running" },
      content: [],
      createdAt: new Date(),
    };

    this.abortController?.abort();
    this.abortController = new AbortController();

    const messages = this.messages;
    this.setMessages([...this.messages, message]);

    const updateMessage = (m: Partial<ChatModelRunResult>) => {
      message = {
        ...message,
        ...m,
      };
      this.setMessages([...this.messages.slice(0, -1), message]);
    };

    try {
      const promiseOrGenerator = this.adapter.run({
        messages,
        abortSignal: this.abortController.signal,
        config: this.configProvider.getModelConfig(),
        onUpdate: updateMessage,
      });

      if (Symbol.asyncIterator in promiseOrGenerator) {
        for await (const r of promiseOrGenerator) {
          updateMessage(r);
        }
      } else {
        updateMessage(await promiseOrGenerator);
      }

      this.abortController = null;

      if (message.status.type === "running") {
        updateMessage({
          status: { type: "complete", reason: "unknown" },
        });
      }
    } catch (e) {
      this.abortController = null;

      // TODO this should be handled by the run result stream
      if (e instanceof Error && e.name === "AbortError") {
        updateMessage({
          status: { type: "incomplete", reason: "cancelled" },
        });
      } else {
        updateMessage({
          status: { type: "incomplete", reason: "error", error: e },
        });

        throw e;
      }
    }
  }

  public subscribe(callback: () => void): Unsubscribe {
    this._subscriptions.add(callback);
    return () => this._subscriptions.delete(callback);
  }

  private notifySubscribers() {
    for (const callback of this._subscriptions) callback();
  }

  public cancelRun(): void {
    if (!this.abortController) return;

    this.abortController.abort();
    this.abortController = null;
  }

  public speak(): never {
    throw new Error("PlaygroundRuntime does not support speaking.");
  }

  public deleteMessage(messageId: string) {
    this.setMessages(this.messages.filter((m) => m.id !== messageId));
  }

  public setMessageText({
    messageId,
    contentPart,
    text,
  }: {
    messageId: string;
    contentPart: TextContentPart;
    text: string;
  }) {
    this.setMessages(
      this.messages.map((m) => {
        if (m.id === messageId) {
          let found = false;
          const newContent = m.content.map((part) => {
            if (part === contentPart) {
              if (part.type !== "text")
                throw new Error("Tried to set text for non-text content part.");
              found = true;
              return { ...part, text };
            }
            return part;
          });

          if (!found)
            throw new Error(
              "Tried to set text for content part that does not exist.",
            );

          return {
            ...m,
            content: newContent,
          } as ThreadMessage;
        }
        return m;
      }),
    );
  }

  public deleteContentPart(
    messageId: string,
    part: ThreadUserContentPart | ThreadAssistantContentPart,
  ) {
    this.setMessages(
      this.messages.map((m) => {
        if (m.id === messageId) {
          const newContent = m.content.filter((p) => p !== part);

          return {
            ...m,
            content: newContent,
          } as ThreadMessage;
        }
        return m;
      }),
    );
  }

  public addTool({
    messageId,
    toolName,
  }: {
    messageId: string;
    toolName: string;
  }) {
    this.setMessages(
      this.messages.map((m) => {
        if (m.id === messageId) {
          const newContent = [
            ...m.content,
            {
              type: "tool-call",
              toolCallId: generateId(),
              toolName,
              argsText: "",
              args: {},
            } satisfies ToolCallContentPart,
          ];

          return {
            ...m,
            content: newContent,
          } as ThreadMessage;
        }
        return m;
      }),
    );
  }

  public addToolResult({
    messageId,
    toolCallId,
    result,
  }: AddToolResultOptions) {
    this.setMessages(
      this.messages.map((m) => {
        if (m.id === messageId) {
          let found = false;
          const newContent = m.content.map((part) => {
            if (part.type !== "tool-call") return part;
            if (part.toolCallId === toolCallId) {
              found = true;
              return {
                ...part,
                result,
              };
            }
            return part;
          });
          if (!found)
            throw new Error(
              "Tried to add tool result for tool call that does not exist.",
            );

          return {
            ...m,
            content: newContent,
          } as ThreadMessage;
        }
        return m;
      }),
    );
  }

  public setToolArgs({
    messageId,
    toolCallId,
    args,
  }: {
    messageId: string;
    toolCallId: string;
    args: any;
  }) {
    this.setMessages(
      this.messages.map((m) => {
        if (m.id === messageId) {
          let found = false;
          const newContent = m.content.map((part) => {
            if (part.type !== "tool-call") return part;
            if (part.toolCallId === toolCallId) {
              found = true;
              return {
                ...part,
                args,
              };
            }
            return part;
          });
          if (!found)
            throw new Error(
              "Tried to set tool args for tool call that does not exist.",
            );

          return {
            ...m,
            content: newContent,
          } as ThreadMessage;
        }
        return m;
      }),
    );
  }

  public setRole({
    messageId,
    role,
  }: {
    messageId: string;
    role: "user" | "assistant" | "system";
  }) {
    this.setMessages(
      this.messages.map((m) => {
        if (m.id === messageId) {
          return {
            ...m,
            role,
            content: m.content
              .filter((part) => {
                const assistantAllowed =
                  role === "assistant" || part.type !== "tool-call"; // tool call parts are only allowed in assistant messages
                const userAllowed = role === "user" || part.type !== "image"; // image parts are only allowed in user messages
                const systemAllowed = role === "system" || part.type === "text"; // system messages only allow text parts

                return assistantAllowed && userAllowed && systemAllowed;
              })
              .filter((_, idx) => role !== "system" || idx === 0), // system messages only allow one part
          } as ThreadMessage;
        }
        return m;
      }),
    );
  }

  public addImage({ image, messageId }: { image: string; messageId: string }) {
    this.setMessages(
      this.messages.map((m) => {
        if (m.id === messageId) {
          if (m.role !== "user")
            throw new Error(
              "Tried to add image to a non-user message. This is likely an internal bug in assistant-ui.",
            );

          return {
            ...m,
            content: [
              ...m.content,
              { type: "image", image } satisfies ThreadUserContentPart,
            ],
          };
        }
        return m;
      }),
    );
  }
}

export const usePlaygroundRuntime = ({
  initialMessages,
  maxToolRoundtrips,
  ...runtimeOptions
}: EdgeRuntimeOptions & {
  initialMessages: CoreMessage[];
}) => {
  const [runtime] = useState(
    () =>
      new PlaygroundRuntime(
        initialMessages,
        new EdgeChatAdapter(runtimeOptions),
      ),
  );

  return runtime;
};
