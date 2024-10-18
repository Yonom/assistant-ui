import {
  SpeechState,
  SubmittedFeedback,
} from "../runtimes/core/ThreadRuntimeCore";
import {
  ThreadMessage,
  ThreadAssistantContentPart,
  ThreadUserContentPart,
  Unsubscribe,
} from "../types";
import {
  ContentPartStatus,
  ToolCallContentPartStatus,
} from "../types/AssistantTypes";
import { getThreadMessageText } from "../utils/getThreadMessageText";
import {
  AttachmentRuntime,
  AttachmentState,
  MessageAttachmentRuntimeImpl,
} from "./AttachmentRuntime";
import {
  EditComposerRuntime,
  EditComposerRuntimeImpl,
} from "./ComposerRuntime";
import {
  ContentPartRuntime,
  ContentPartRuntimeImpl,
  ContentPartState,
} from "./ContentPartRuntime";
import { MessageRuntimePath } from "./RuntimePathTypes";
import { ThreadRuntimeCoreBinding } from "./ThreadRuntime";
import { NestedSubscriptionSubject } from "./subscribable/NestedSubscriptionSubject";
import { SKIP_UPDATE } from "./subscribable/SKIP_UPDATE";
import { ShallowMemoizeSubject } from "./subscribable/ShallowMemoizeSubject";
import { SubscribableWithState } from "./subscribable/Subscribable";

const COMPLETE_STATUS: ContentPartStatus = {
  type: "complete",
};

export const toContentPartStatus = (
  message: ThreadMessage,
  partIndex: number,
  part: ThreadUserContentPart | ThreadAssistantContentPart,
): ToolCallContentPartStatus => {
  if (message.role !== "assistant") return COMPLETE_STATUS;

  const isLastPart = partIndex === Math.max(0, message.content.length - 1);
  if (part.type !== "tool-call") {
    if (
      "reason" in message.status &&
      message.status.reason === "tool-calls" &&
      isLastPart
    )
      throw new Error(
        "Encountered unexpected requires-action status. This is likely an internal bug in assistant-ui.",
      );

    return isLastPart ? (message.status as ContentPartStatus) : COMPLETE_STATUS;
  }

  if (!!part.result) {
    return COMPLETE_STATUS;
  }

  return message.status as ToolCallContentPartStatus;
};

export const EMPTY_CONTENT = Object.freeze({ type: "text", text: "" });

const getContentPartState = (
  message: MessageState,
  partIndex: number,
): ContentPartState | SKIP_UPDATE => {
  let part = message.content[partIndex];
  if (!part) {
    // for empty messages, show an empty text content part
    if (message.content.length === 0 && partIndex === 0) {
      part = EMPTY_CONTENT;
    } else {
      return SKIP_UPDATE;
    }
  } else if (
    message.content.length === 1 &&
    part.type === "text" &&
    part.text.length === 0
  ) {
    // ensure reference equality for equivalent empty text parts
    part = EMPTY_CONTENT;
  }

  // if the content part is the same, don't update
  const status = toContentPartStatus(message, partIndex, part);
  return Object.freeze({ ...part, part, status });
};

export type MessageState = ThreadMessage & {
  /**
   * @deprecated You can directly access message fields in the state. Replace `.message.content` with `.content` etc. This will be removed in 0.6.0.
   */
  message: ThreadMessage;
  parentId: string | null;
  isLast: boolean;
  /**
   * @deprecated Use `branchNumber` and `branchCount` instead. This will be removed in 0.6.0.
   */
  branches: readonly string[];

  branchNumber: number;
  branchCount: number;

  /**
   * @deprecated This API is still under active development and might change without notice.
   */
  speech: SpeechState | undefined;
  submittedFeedback: SubmittedFeedback | undefined;
};

export type MessageStateBinding = SubscribableWithState<
  MessageState,
  MessageRuntimePath
>;

export type MessageRuntime = {
  readonly path: MessageRuntimePath;

  readonly composer: EditComposerRuntime;

  getState(): MessageState;
  reload(): void;
  /**
   * @deprecated This API is still under active development and might change without notice.
   */
  speak(): void;
  /**
   * @deprecated This API is still under active development and might change without notice.
   */
  stopSpeaking(): void;
  submitFeedback({ type }: { type: "positive" | "negative" }): void;
  switchToBranch({
    position,
    branchId,
  }: {
    position?: "previous" | "next" | undefined;
    branchId?: string | undefined;
  }): void;
  unstable_getCopyText(): string;

  subscribe(callback: () => void): Unsubscribe;

  getContentPartByIndex(idx: number): ContentPartRuntime;
  getContentPartByToolCallId(toolCallId: string): ContentPartRuntime;

  getAttachmentByIndex(idx: number): AttachmentRuntime & { source: "message" };
};

export class MessageRuntimeImpl implements MessageRuntime {
  public get path() {
    return this._core.path;
  }

  constructor(
    private _core: MessageStateBinding,
    private _threadBinding: ThreadRuntimeCoreBinding,
  ) {
    this.composer = new EditComposerRuntimeImpl(
      new NestedSubscriptionSubject({
        path: {
          ...this.path,
          ref: this.path.ref + `${this.path.ref}.composer`,
          composerSource: "edit",
        },
        getState: () =>
          this._threadBinding
            .getState()
            .getEditComposer(this._core.getState().id),
        subscribe: (callback) => this._threadBinding.subscribe(callback),
      }),
      () => this._threadBinding.getState().beginEdit(this._core.getState().id),
    );
  }

  public composer;

  public getState() {
    return this._core.getState();
  }

  public reload() {
    const state = this._core.getState();
    if (!state) throw new Error("Message is not available");
    if (state.role !== "assistant")
      throw new Error("Can only reload assistant messages");

    this._threadBinding.getState().startRun(state.parentId);
  }

  public speak() {
    const state = this._core.getState();
    if (!state) throw new Error("Message is not available");

    return this._threadBinding.getState().speak(state.id);
  }

  public stopSpeaking() {
    const state = this._core.getState();
    if (!state) throw new Error("Message is not available");

    const thread = this._threadBinding.getState();
    if (thread.speech?.messageId === state.id) {
      this._threadBinding.getState().stopSpeaking();
    } else {
      throw new Error("Message is not being spoken");
    }
  }

  public submitFeedback({ type }: { type: "positive" | "negative" }) {
    const state = this._core.getState();
    if (!state) throw new Error("Message is not available");

    this._threadBinding.getState().submitFeedback({
      messageId: state.id,
      type,
    });
  }

  public switchToBranch({
    position,
    branchId,
  }: {
    position?: "previous" | "next" | undefined;
    branchId?: string | undefined;
  }) {
    const state = this._core.getState();
    if (!state) throw new Error("Message is not available");

    if (branchId && position) {
      throw new Error("May not specify both branchId and position");
    } else if (!branchId && !position) {
      throw new Error("Must specify either branchId or position");
    }

    const thread = this._threadBinding.getState();
    const branches = thread.getBranches(state.id);
    let targetBranch = branchId;
    if (position === "previous") {
      targetBranch = branches[state.branchNumber - 2];
    } else if (position === "next") {
      targetBranch = branches[state.branchNumber];
    }
    if (!targetBranch) throw new Error("Branch not found");

    this._threadBinding.getState().switchToBranch(targetBranch);
  }

  public unstable_getCopyText() {
    return getThreadMessageText(this.getState());
  }

  public subscribe(callback: () => void) {
    return this._core.subscribe(callback);
  }

  public getContentPartByIndex(idx: number) {
    if (idx < 0) throw new Error("Content part index must be >= 0");
    return new ContentPartRuntimeImpl(
      new ShallowMemoizeSubject({
        path: {
          ...this.path,
          ref: this.path.ref + `${this.path.ref}.content[${idx}]`,
          contentPartSelector: { type: "index", index: idx },
        },
        getState: () => {
          return getContentPartState(this.getState(), idx);
        },
        subscribe: (callback) => this._core.subscribe(callback),
      }),
      this._core,
      this._threadBinding,
    );
  }

  public getContentPartByToolCallId(toolCallId: string) {
    return new ContentPartRuntimeImpl(
      new ShallowMemoizeSubject({
        path: {
          ...this.path,
          ref:
            this.path.ref +
            `${this.path.ref}.content[toolCallId=${JSON.stringify(toolCallId)}]`,
          contentPartSelector: { type: "toolCallId", toolCallId },
        },
        getState: () => {
          const state = this._core.getState();
          const idx = state.content.findIndex(
            (part) =>
              part.type === "tool-call" && part.toolCallId === toolCallId,
          );
          if (idx === -1) return SKIP_UPDATE;
          return getContentPartState(state, idx);
        },
        subscribe: (callback) => this._core.subscribe(callback),
      }),
      this._core,
      this._threadBinding,
    );
  }

  public getAttachmentByIndex(idx: number) {
    return new MessageAttachmentRuntimeImpl(
      new ShallowMemoizeSubject({
        path: {
          ...this.path,
          ref: this.path.ref + `${this.path.ref}.attachments[${idx}]`,
          attachmentSource: "message",
          attachmentSelector: { type: "index", index: idx },
        },
        getState: () => {
          const attachments = this.getState().attachments;
          const attachment = attachments?.[idx];
          if (!attachment) return SKIP_UPDATE;

          return {
            ...attachment,
            attachment: attachment,
            source: "message",
          } satisfies AttachmentState & { source: "message" };
        },
        subscribe: (callback) => this._core.subscribe(callback),
      }),
    );
  }
}
