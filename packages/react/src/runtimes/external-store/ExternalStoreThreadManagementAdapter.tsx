import type { Unsubscribe } from "../../types";
import { ExternalStoreThreadRuntimeCore } from "./ExternalStoreThreadRuntimeCore";
import { ThreadManagerRuntimeCore } from "../core/ThreadManagerRuntimeCore";
import { ExternalStoreThreadManagerAdapter } from "./ExternalStoreAdapter";

export type ExternalStoreThreadFactory = (
  threadId: string,
) => ExternalStoreThreadRuntimeCore;

const EMPTY_ARRAY = Object.freeze([]);
const DEFAULT_THREAD_ID = "DEFAULT_THREAD_ID";

export class ExternalStoreThreadManagerRuntimeCore
  implements ThreadManagerRuntimeCore
{
  public get threads() {
    return this.adapter.threads ?? EMPTY_ARRAY;
  }

  public get archivedThreads() {
    return this.adapter.archivedThreads ?? EMPTY_ARRAY;
  }

  private _mainThread: ExternalStoreThreadRuntimeCore;

  public get mainThread() {
    return this._mainThread;
  }

  constructor(
    private adapter: ExternalStoreThreadManagerAdapter = {},
    private threadFactory: ExternalStoreThreadFactory,
  ) {
    this._mainThread = this.threadFactory(DEFAULT_THREAD_ID);
  }

  public setAdapter(adapter: ExternalStoreThreadManagerAdapter) {
    const previousAdapter = this.adapter;
    this.adapter = adapter;

    const newThreadId = adapter.threadId ?? DEFAULT_THREAD_ID;
    const newThreads = adapter.threads ?? EMPTY_ARRAY;
    const newArchivedThreads = adapter.archivedThreads ?? EMPTY_ARRAY;

    if (
      previousAdapter.threadId === newThreadId &&
      previousAdapter.threads === newThreads &&
      previousAdapter.archivedThreads === newArchivedThreads
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

  public switchToThread(threadId: string): void {
    if (this._mainThread?.threadId === threadId) return;
    const onSwitchToThread = this.adapter.onSwitchToThread;
    if (!onSwitchToThread)
      throw new Error(
        "External store adapter does not support switching to thread",
      );
    onSwitchToThread(threadId);
  }

  public switchToNewThread(): void {
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
