import { Unsubscribe } from "../../types";
import { ThreadRuntimeCore } from "./ThreadRuntimeCore";

type ThreadListItemCoreState = {
  readonly threadId: string;
  readonly remoteId?: string | undefined;
  readonly externalId?: string | undefined;

  readonly status: "archived" | "regular" | "new" | "deleted";
  readonly title?: string | undefined;

  readonly runtime?: ThreadRuntimeCore | undefined;
};

export type ThreadListRuntimeCore = {
  mainThreadId: string;
  newThreadId: string | undefined;

  threadIds: readonly string[];
  archivedThreadIds: readonly string[];

  getMainThreadRuntimeCore(): ThreadRuntimeCore;
  getItemById(threadId: string): ThreadListItemCoreState | undefined;

  switchToThread(threadId: string): Promise<void>;
  switchToNewThread(): Promise<void>;

  getLoadThreadsPromise(): Promise<void>;
  // getLoadArchivedThreadsPromise(): Promise<void>;

  rename(threadId: string, newTitle: string): Promise<void>;
  archive(threadId: string): Promise<void>;
  unarchive(threadId: string): Promise<void>;
  delete(threadId: string): Promise<void>;

  subscribe(callback: () => void): Unsubscribe;
};
