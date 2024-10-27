import type { CoreMessage } from "../../types/AssistantTypes";
import { BaseAssistantRuntimeCore } from "../core/BaseAssistantRuntimeCore";
import { LocalThreadRuntimeCore } from "./LocalThreadRuntimeCore";
import { LocalRuntimeOptionsBase } from "./LocalRuntimeOptions";
import { fromCoreMessages } from "../edge/converters/fromCoreMessage";
import { LocalThreadListRuntimeCore } from "./LocalThreadListRuntimeCore";
import { ExportedMessageRepository } from "../utils/MessageRepository";

const getExportFromInitialMessages = (
  initialMessages: readonly CoreMessage[],
): ExportedMessageRepository => {
  const messages = fromCoreMessages(initialMessages);
  return {
    messages: messages.map((m, idx) => ({
      parentId: messages[idx - 1]?.id ?? null,
      message: m,
    })),
  };
};

export class LocalRuntimeCore extends BaseAssistantRuntimeCore {
  public readonly threadList;

  private _options: LocalRuntimeOptionsBase;

  constructor(
    options: LocalRuntimeOptionsBase,
    initialMessages: readonly CoreMessage[] | undefined,
  ) {
    super();

    this._options = options;

    this.threadList = new LocalThreadListRuntimeCore((threadId, data) => {
      const thread = new LocalThreadRuntimeCore(
        this._proxyConfigProvider,
        threadId,
        this._options,
      );
      thread.import(data);
      return thread;
    });

    if (initialMessages) {
      this.threadList.mainThread.import(
        getExportFromInitialMessages(initialMessages),
      );
    }
  }

  public setOptions(options: LocalRuntimeOptionsBase) {
    this._options = options;

    this.threadList.mainThread.setOptions(options);
  }

  public reset({
    initialMessages,
  }: {
    initialMessages?: readonly CoreMessage[] | undefined;
  } = {}) {
    this.threadList.switchToNewThread();
    if (!initialMessages) return;

    this.threadList.mainThread.import(
      getExportFromInitialMessages(initialMessages),
    );
  }
}
