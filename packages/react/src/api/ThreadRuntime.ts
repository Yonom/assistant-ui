import {
  ThreadSuggestion,
  RuntimeCapabilities,
  ThreadRuntimeCore,
  SpeechState,
  ThreadRuntimeEventType,
  StartRunConfig,
} from "../runtimes/core/ThreadRuntimeCore";
import { ExportedMessageRepository } from "../runtimes/utils/MessageRepository";
import {
  AppendMessage,
  ModelConfig,
  ThreadMessage,
  Unsubscribe,
} from "../types";
import {
  MessageRuntime,
  MessageRuntimeImpl,
  MessageState,
} from "./MessageRuntime";
import { NestedSubscriptionSubject } from "./subscribable/NestedSubscriptionSubject";
import { ShallowMemoizeSubject } from "./subscribable/ShallowMemoizeSubject";
import { SubscribableWithState } from "./subscribable/Subscribable";
import {
  ThreadComposerRuntime,
  ThreadComposerRuntimeImpl,
} from "./ComposerRuntime";
import { LazyMemoizeSubject } from "./subscribable/LazyMemoizeSubject";
import { SKIP_UPDATE } from "./subscribable/SKIP_UPDATE";
import {
  MessageRuntimePath,
  ThreadListItemRuntimePath,
  ThreadRuntimePath,
} from "./RuntimePathTypes";
import { ThreadListItemState } from "./ThreadListItemRuntime";
import { RunConfig } from "../types/AssistantTypes";
import { EventSubscriptionSubject } from "./subscribable/EventSubscriptionSubject";

export type CreateStartRunConfig = {
  parentId: string | null;
  sourceId?: string | null | undefined;
  runConfig?: RunConfig | undefined;
};

const toStartRunConfig = (message: CreateStartRunConfig): StartRunConfig => {
  return {
    parentId: message.parentId ?? null,
    sourceId: message.sourceId ?? null,
    runConfig: message.runConfig ?? {},
  };
};

export type CreateAppendMessage =
  | string
  | {
      parentId?: string | null | undefined;
      sourceId?: string | null | undefined;
      role?: AppendMessage["role"] | undefined;
      content: AppendMessage["content"];
      attachments?: AppendMessage["attachments"] | undefined;
      startRun?: boolean | undefined;
    };

const toAppendMessage = (
  messages: readonly ThreadMessage[],
  message: CreateAppendMessage,
): AppendMessage => {
  if (typeof message === "string") {
    return {
      parentId: messages.at(-1)?.id ?? null,
      sourceId: null,
      runConfig: {},
      role: "user",
      content: [{ type: "text", text: message }],
      attachments: [],
    };
  }

  if (message.role && message.parentId && message.attachments) {
    return message as AppendMessage;
  }

  return {
    ...message,
    parentId: message.parentId ?? messages.at(-1)?.id ?? null,
    sourceId: message.sourceId ?? null,
    role: message.role ?? "user",
    attachments: message.attachments ?? [],
  } as AppendMessage;
};

export type ThreadRuntimeCoreBinding = SubscribableWithState<
  ThreadRuntimeCore,
  ThreadRuntimePath
> & {
  outerSubscribe(callback: () => void): Unsubscribe;
};

export type ThreadListItemRuntimeBinding = SubscribableWithState<
  ThreadListItemState,
  ThreadListItemRuntimePath
>;

export type ThreadState = {
  /**
   * The thread ID.
   * @deprecated This field is deprecated and will be removed in 0.8.0. Use `useThreadListItem().id` instead.
   */
  readonly threadId: string;

  /**
   * The thread metadata.
   *
   * @deprecated Use `useThreadListItem()` instead. This field is deprecated and will be removed in 0.8.0.
   */
  readonly metadata: ThreadListItemState;

  /**
   * Whether the thread is disabled. Disabled threads cannot receive new messages.
   */
  readonly isDisabled: boolean;

  /**
   * Whether the thread is running. A thread is considered running when there is an active stream connection to the backend.
   */
  readonly isRunning: boolean;

  /**
   * The capabilities of the thread, such as whether the thread supports editing, branch switching, etc.
   */
  readonly capabilities: RuntimeCapabilities;

  /**
   * The messages in the currently selected branch of the thread.
   */
  readonly messages: readonly ThreadMessage[];

  /**
   * Follow up message suggestions to show the user.
   */
  readonly suggestions: readonly ThreadSuggestion[];

  /**
   * Custom extra information provided by the runtime.
   */
  readonly extras: unknown;

  /**
   * @deprecated This API is still under active development and might change without notice.
   */
  readonly speech: SpeechState | undefined;
};

export const getThreadState = (
  runtime: ThreadRuntimeCore,
  threadListItemState: ThreadListItemState,
): ThreadState => {
  const lastMessage = runtime.messages.at(-1);
  return Object.freeze({
    threadId: threadListItemState.id,
    metadata: threadListItemState,
    capabilities: runtime.capabilities,
    isDisabled: runtime.isDisabled,
    isRunning:
      lastMessage?.role !== "assistant"
        ? false
        : lastMessage.status.type === "running",
    messages: runtime.messages,
    suggestions: runtime.suggestions,
    extras: runtime.extras,
    speech: runtime.speech,
  });
};

export type ThreadRuntime = {
  /**
   * The selector for the thread runtime.
   */
  readonly path: ThreadRuntimePath;

  /**
   * The thread composer runtime.
   */
  readonly composer: ThreadComposerRuntime;

  /**
   * Gets a snapshot of the thread state.
   */
  getState(): ThreadState;

  /**
   * Append a new message to the thread.
   *
   * @example ```ts
   * // append a new user message with the text "Hello, world!"
   * threadRuntime.append("Hello, world!");
   * ```
   *
   * @example ```ts
   * // append a new assistant message with the text "Hello, world!"
   * threadRuntime.append({
   *   role: "assistant",
   *   content: [{ type: "text", text: "Hello, world!" }],
   * });
   * ```
   */
  append(message: CreateAppendMessage): void;

  /**
   * @deprecated pass an object with `parentId` instead. This will be removed in 0.8.0.
   */
  startRun(parentId: string | null): void;
  /**
   * Start a new run with the given configuration.
   * @param config The configuration for starting the run
   */
  startRun(config: CreateStartRunConfig): void;
  subscribe(callback: () => void): Unsubscribe;
  cancelRun(): void;
  getModelConfig(): ModelConfig;
  export(): ExportedMessageRepository;
  import(repository: ExportedMessageRepository): void;
  getMesssageByIndex(idx: number): MessageRuntime;
  getMesssageById(messageId: string): MessageRuntime;

  /**
   * @deprecated This API is still under active development and might change without notice.
   */
  stopSpeaking: () => void;

  unstable_on(event: ThreadRuntimeEventType, callback: () => void): Unsubscribe;
};

export class ThreadRuntimeImpl implements ThreadRuntime {
  public get path() {
    return this._threadBinding.path;
  }

  public get __internal_threadBinding() {
    return this._threadBinding;
  }

  private readonly _threadBinding: ThreadRuntimeCoreBinding & {
    getStateState(): ThreadState;
  };

  constructor(
    threadBinding: ThreadRuntimeCoreBinding,
    threadListItemBinding: ThreadListItemRuntimeBinding,
  ) {
    const stateBinding = new LazyMemoizeSubject({
      path: threadBinding.path,
      getState: () =>
        getThreadState(
          threadBinding.getState(),
          threadListItemBinding.getState(),
        ),
      subscribe: (callback) => {
        const sub1 = threadBinding.subscribe(callback);
        const sub2 = threadListItemBinding.subscribe(callback);
        return () => {
          sub1();
          sub2();
        };
      },
    });

    this._threadBinding = {
      path: threadBinding.path,
      getState: () => threadBinding.getState(),
      getStateState: () => stateBinding.getState(),
      outerSubscribe: (callback) => threadBinding.outerSubscribe(callback),
      subscribe: (callback) => threadBinding.subscribe(callback),
    };

    this.composer = new ThreadComposerRuntimeImpl(
      new NestedSubscriptionSubject({
        path: {
          ...this.path,
          ref: this.path.ref + `${this.path.ref}.composer`,
          composerSource: "thread",
        },
        getState: () => this._threadBinding.getState().composer,
        subscribe: (callback) => this._threadBinding.subscribe(callback),
      }),
    );
  }

  public __internal_bindMethods() {
    this.append = this.append.bind(this);
    this.startRun = this.startRun.bind(this);
    this.cancelRun = this.cancelRun.bind(this);
    this.stopSpeaking = this.stopSpeaking.bind(this);
    this.getSubmittedFeedback = this.getSubmittedFeedback.bind(this);
    this.export = this.export.bind(this);
    this.import = this.import.bind(this);
    this.getMesssageByIndex = this.getMesssageByIndex.bind(this);
    this.getMesssageById = this.getMesssageById.bind(this);
    this.subscribe = this.subscribe.bind(this);
    this.unstable_on = this.unstable_on.bind(this);
    this.getModelConfig = this.getModelConfig.bind(this);
    this.getState = this.getState.bind(this);
  }

  public readonly composer;

  public getState() {
    return this._threadBinding.getStateState();
  }

  public append(message: CreateAppendMessage) {
    this._threadBinding
      .getState()
      .append(
        toAppendMessage(this._threadBinding.getState().messages, message),
      );
  }

  public subscribe(callback: () => void) {
    return this._threadBinding.subscribe(callback);
  }

  public getModelConfig() {
    return this._threadBinding.getState().getModelConfig();
  }

  public startRun(configOrParentId: string | null | CreateStartRunConfig) {
    const config =
      configOrParentId === null || typeof configOrParentId === "string"
        ? { parentId: configOrParentId }
        : configOrParentId;
    return this._threadBinding.getState().startRun(toStartRunConfig(config));
  }

  public cancelRun() {
    this._threadBinding.getState().cancelRun();
  }

  public stopSpeaking() {
    return this._threadBinding.getState().stopSpeaking();
  }

  public getSubmittedFeedback(messageId: string) {
    return this._threadBinding.getState().getSubmittedFeedback(messageId);
  }

  public export() {
    return this._threadBinding.getState().export();
  }

  public import(data: ExportedMessageRepository) {
    this._threadBinding.getState().import(data);
  }

  public getMesssageByIndex(idx: number) {
    if (idx < 0) throw new Error("Message index must be >= 0");

    return this._getMessageRuntime(
      {
        ...this.path,
        ref: this.path.ref + `${this.path.ref}.messages[${idx}]`,
        messageSelector: { type: "index", index: idx },
      },
      () => {
        const messages = this._threadBinding.getState().messages;
        const message = messages[idx];
        if (!message) return undefined;
        return {
          message,
          parentId: messages[idx - 1]?.id ?? null,
        };
      },
    );
  }

  public getMesssageById(messageId: string) {
    return this._getMessageRuntime(
      {
        ...this.path,
        ref:
          this.path.ref +
          `${this.path.ref}.messages[messageId=${JSON.stringify(messageId)}]`,
        messageSelector: { type: "messageId", messageId: messageId },
      },
      () => this._threadBinding.getState().getMessageById(messageId),
    );
  }

  private _getMessageRuntime(
    path: MessageRuntimePath,
    callback: () =>
      | { parentId: string | null; message: ThreadMessage }
      | undefined,
  ) {
    return new MessageRuntimeImpl(
      new ShallowMemoizeSubject({
        path,
        getState: () => {
          const { message, parentId } = callback() ?? {};

          const { messages, speech: speechState } =
            this._threadBinding.getState();

          if (!message || parentId === undefined) return SKIP_UPDATE;

          const thread = this._threadBinding.getState();

          const branches = thread.getBranches(message.id);
          const submittedFeedback = thread.getSubmittedFeedback(message.id);

          return {
            ...message,

            isLast: messages.at(-1)?.id === message.id,
            parentId,

            branchNumber: branches.indexOf(message.id) + 1,
            branchCount: branches.length,

            speech:
              speechState?.messageId === message.id ? speechState : undefined,

            submittedFeedback,
          } satisfies MessageState;
        },
        subscribe: (callback) => this._threadBinding.subscribe(callback),
      }),
      this._threadBinding,
    );
  }

  private _eventSubscriptionSubjects = new Map<
    string,
    EventSubscriptionSubject<ThreadRuntimeEventType>
  >();

  public unstable_on(
    event: ThreadRuntimeEventType,
    callback: () => void,
  ): Unsubscribe {
    let subject = this._eventSubscriptionSubjects.get(event);
    if (!subject) {
      subject = new EventSubscriptionSubject({
        event: event,
        binding: this._threadBinding,
      });
      this._eventSubscriptionSubjects.set(event, subject);
    }
    return subject.subscribe(callback);
  }
}
