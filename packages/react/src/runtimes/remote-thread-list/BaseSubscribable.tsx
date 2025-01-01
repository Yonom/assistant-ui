import { Unsubscribe } from "../../types";

export class BaseSubscribable {
  private _subscribers = new Set<() => void>();

  public subscribe(callback: () => void): Unsubscribe {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  public waitForUpdate() {
    return new Promise<void>((resolve) => {
      const unsubscribe = this.subscribe(() => {
        unsubscribe();
        resolve();
      });
    });
  }

  protected _notifySubscribers() {
    for (const callback of this._subscribers) callback();
  }
}
