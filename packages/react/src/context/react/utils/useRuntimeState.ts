import { useDebugValue, useSyncExternalStore } from "react";
import { Unsubscribe } from "../../../types";

export type SubscribableRuntime<TState> = {
  getState: () => TState;
  subscribe: (callback: () => void) => Unsubscribe;
};

type Bindable = {
  __internal_bindMethods?: () => void;
  __isBound?: boolean;
};

const debugVerifyPrototype = (runtime: object, prototype: any) => {
  const unboundMethods = Object.getOwnPropertyNames(prototype).filter(
    (methodStr) => {
      const method = methodStr as keyof typeof runtime | "constructor";
      return (
        !method.startsWith("_") &&
        typeof runtime[method] === "function" &&
        method !== "constructor" &&
        prototype[method] === runtime[method]
      );
    },
  );

  if (unboundMethods.length > 0) {
    throw new Error(
      "The following methods are not bound: " + JSON.stringify(unboundMethods),
    );
  }

  const prototypePrototype = Object.getPrototypeOf(prototype);
  if (prototypePrototype && prototypePrototype !== Object.prototype) {
    debugVerifyPrototype(runtime, prototypePrototype);
  }
};

const ensureBinding = (r: SubscribableRuntime<any>) => {
  const runtime = r as unknown as Bindable;
  if (runtime.__isBound) return;

  runtime.__internal_bindMethods?.();
  runtime.__isBound = true;

  // @ts-ignore - strip this out in production build
  DEV: debugVerifyPrototype(runtime, Object.getPrototypeOf(runtime));
};

const identity = <T>(arg: T): T => arg;
export function useRuntimeState<TState>(
  runtime: SubscribableRuntime<TState>,
): TState;
export function useRuntimeState<TState, TSelected>(
  runtime: SubscribableRuntime<TState>,
  selector: (state: TState) => TSelected,
): TSelected;
export function useRuntimeState<TState, TSelected>(
  runtime: SubscribableRuntime<TState>,
  selector: ((state: TState) => TSelected) | undefined,
): TSelected | TState;
export function useRuntimeState<TState, TSelected>(
  runtime: SubscribableRuntime<TState>,
  selector: ((state: TState) => TSelected) | undefined = identity as any,
): TSelected | TState {
  ensureBinding(runtime);

  const slice = useSyncExternalStore(
    runtime.subscribe,
    () => selector(runtime.getState()),
    () => selector(runtime.getState()),
  );
  useDebugValue(slice);
  return slice;
}
