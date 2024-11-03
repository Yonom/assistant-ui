import type { Unsubscribe } from "../../types";
import { ExternalStoreThreadRuntimeCore } from "./ExternalStoreThreadRuntimeCore";
import { ThreadListRuntimeCore } from "../core/ThreadListRuntimeCore";
import { ExternalStoreThreadListAdapter } from "./ExternalStoreAdapter";

export type ExternalStoreThreadFactory = (
  threadId: string,
) => ExternalStoreThreadRuntimeCore;

const EMPTY_ARRAY = Object.freeze([]);
const DEFAULT_THREAD_ID = "DEFAULT_THREAD_ID";

export class ExternalStoreThreadListRuntimeCore
  implements ThreadListRuntimeCore
{
  public get newThread() {
    return undefined;
  }

  public get threads() {
    return this.adapter.threads?.map((t) => t.threadId) ?? EMPTY_ARRAY;
  }

  public get archivedThreads() {
    return this.adapter.archivedThreads?.map((t) => t.threadId) ?? EMPTY_ARRAY;
  }

  private _mainThread: ExternalStoreThreadRuntimeCore;

  public get mainThread() {
    return this._mainThread;
  }

  constructor(
    private adapter: ExternalStoreThreadListAdapter = {},
    private threadFactory: ExternalStoreThreadFactory,
  ) {
    this._mainThread = this.threadFactory(DEFAULT_THREAD_ID);
  }

  public getThreadMetadataById(threadId: string) {
    for (const thread of this.adapter.threads ?? []) {
      if (thread.threadId === threadId) return thread;
    }
    for (const thread of this.adapter.archivedThreads ?? []) {
      if (thread.threadId === threadId) return thread;
    }
    return undefined;
  }

  public setAdapter(adapter: ExternalStoreThreadListAdapter) {
    const previousAdapter = this.adapter;
    this.adapter = adapter;

    const newThreadId = adapter.threadId ?? DEFAULT_THREAD_ID;
    const newThreads = adapter.threads ?? EMPTY_ARRAY;
    const newArchivedThreads = adapter.archivedThreads ?? EMPTY_ARRAY;

    const previousThreadId = previousAdapter.threadId ?? DEFAULT_THREAD_ID;
    const previousThreads = previousAdapter.threads ?? EMPTY_ARRAY;
    const previousArchivedThreads =
      previousAdapter.archivedThreads ?? EMPTY_ARRAY;

    if (
      previousThreadId === newThreadId &&
      previousThreads === newThreads &&
      previousArchivedThreads === newArchivedThreads
    ) {
      return;
    }

    if (previousAdapter.threadId !== newThreadId) {
      this._mainThread._notifyEventSubscribers("switched-away");
      this._mainThread = this.threadFactory(newThreadId);
      this._mainThread._notifyEventSubscribers("switched-to");
    }

    this._notifySubscribers();
  }

  public async switchToThread(threadId: string): Promise<void> {
    if (this._mainThread?.threadId === threadId) return;
    const onSwitchToThread = this.adapter.onSwitchToThread;
    if (!onSwitchToThread)
      throw new Error(
        "External store adapter does not support switching to thread",
      );
    onSwitchToThread(threadId);
  }

  public async switchToNewThread(): Promise<void> {
    const onSwitchToNewThread = this.adapter.onSwitchToNewThread;
    if (!onSwitchToNewThread)
      throw new Error(
        "External store adapter does not support switching to new thread",
      );

    onSwitchToNewThread();
  }

  public async rename(threadId: string, newTitle: string): Promise<void> {
    const onRename = this.adapter.onRename;
    if (!onRename)
      throw new Error("External store adapter does not support renaming");

    onRename(threadId, newTitle);
  }

  public async archive(threadId: string): Promise<void> {
    const onArchive = this.adapter.onArchive;
    if (!onArchive)
      throw new Error("External store adapter does not support archiving");

    onArchive(threadId);
  }

  public async unarchive(threadId: string): Promise<void> {
    const onUnarchive = this.adapter.onUnarchive;
    if (!onUnarchive)
      throw new Error("External store adapter does not support unarchiving");

    onUnarchive(threadId);
  }

  public async delete(threadId: string): Promise<void> {
    const onDelete = this.adapter.onDelete;
    if (!onDelete)
      throw new Error("External store adapter does not support deleting");

    onDelete(threadId);
  }

  private _subscriptions = new Set<() => void>();

  public subscribe(callback: () => void): Unsubscribe {
    this._subscriptions.add(callback);
    return () => this._subscriptions.delete(callback);
  }

  private _notifySubscribers() {
    for (const callback of this._subscriptions) callback();
  }
}
