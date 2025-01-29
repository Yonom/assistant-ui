import { RefObject, useState } from "react";
import { useThreadListItemRuntime } from "../context";
import { ThreadHistoryAdapter } from "../runtimes/adapters/thread-history/ThreadHistoryAdapter";
import { ExportedMessageRepositoryItem } from "../runtimes/utils/MessageRepository";
import { AssistantCloud } from "./AssistantCloud";
import { auiV0Decode, auiV0Encode } from "./auiV0";

class AssistantCloudThreadHistoryAdapter implements ThreadHistoryAdapter {
  constructor(
    private cloudRef: RefObject<AssistantCloud>,
    private readonly threadId: string | undefined,
    private readonly initialize: () => Promise<{ remoteId: string }>,
  ) {}

  private _getIdForLocalId: Record<string, Promise<string>> = {};

  async append({ parentId, message }: ExportedMessageRepositoryItem) {
    const { remoteId } = await this.initialize();
    const task = this.cloudRef.current.threads.messages.create(remoteId, {
      parent_id: parentId
        ? ((await this._getIdForLocalId[parentId]) ?? parentId)
        : null,
      format: "aui/v0",
      content: auiV0Encode(message),
    });
    this._getIdForLocalId[message.id] = task.then(({ message_id }) => {
      this._getIdForLocalId[message.id] = Promise.resolve(message_id);
      return message_id;
    });
  }

  async load() {
    if (!this.threadId) return { messages: [] };
    const { messages } = await this.cloudRef.current.threads.messages.list(
      this.threadId,
    );
    const payload = {
      messages: messages
        .filter(
          (m): m is typeof m & { format: "aui/v0" } => m.format === "aui/v0",
        )
        .map(auiV0Decode)
        .reverse(),
    };
    return payload;
  }
}

export const useAssistantCloudThreadHistoryAdapter = (
  cloudRef: RefObject<AssistantCloud>,
): ThreadHistoryAdapter => {
  const threadListItemRuntime = useThreadListItemRuntime();
  const [adapter] = useState(
    () =>
      new AssistantCloudThreadHistoryAdapter(
        cloudRef,
        threadListItemRuntime.getState().remoteId,
        () => threadListItemRuntime.initialize(),
      ),
  );

  return adapter;
};
