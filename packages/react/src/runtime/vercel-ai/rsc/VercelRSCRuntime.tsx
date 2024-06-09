"use client";

import type {
  AppendMessage,
  ThreadMessage,
} from "../../../utils/AssistantTypes";
import type {
  AssistantRuntime,
  Unsubscribe,
} from "../../core/AssistantRuntime";
import type { VercelRSCAdapter } from "./VercelRSCAdapter";
import type { VercelRSCMessage } from "./VercelRSCMessage";

const EMPTY_BRANCHES: readonly never[] = Object.freeze([]);

export class VercelRSCRuntime<T extends WeakKey = VercelRSCMessage>
  implements AssistantRuntime
{
  private _subscriptions = new Set<() => void>();

  public isRunning = false;
  public messages: ThreadMessage[] = [];

  constructor(public adapter: VercelRSCAdapter<T>) {}

  private withRunning = (callback: Promise<unknown>) => {
    this.isRunning = true;
    return callback.finally(() => {
      this.isRunning = false;
    });
  };

  public getBranches(): readonly string[] {
    return EMPTY_BRANCHES;
  }

  public switchToBranch(): void {
    throw new Error(
      "Branch switching is not supported by VercelRSCAssistantProvider.",
    );
  }

  public async append(message: AppendMessage): Promise<void> {
    if (message.parentId !== (this.messages.at(-1)?.id ?? null)) {
      if (!this.adapter.edit)
        throw new Error(
          "Message editing is not enabled, please provide an edit callback to VercelRSCAssistantProvider.",
        );
      await this.withRunning(this.adapter.edit(message));
    } else {
      await this.withRunning(this.adapter.append(message));
    }
  }

  public async startRun(parentId: string | null): Promise<void> {
    if (!this.adapter.reload)
      throw new Error(
        "Message reloading is not enabled, please provide a reload callback to VercelRSCAssistantProvider.",
      );
    await this.withRunning(this.adapter.reload(parentId));
  }

  cancelRun(): void {
    // in dev mode, log a warning
    if (process.env["NODE_ENV"] === "development") {
      console.warn(
        "Run cancellation is not supported by VercelRSCAssistantProvider.",
      );
    }
  }

  public updateData(messages: ThreadMessage[]) {
    this.messages = messages;
    for (const callback of this._subscriptions) callback();
  }

  public subscribe(callback: () => void): Unsubscribe {
    this._subscriptions.add(callback);
    return () => this._subscriptions.delete(callback);
  }
}
