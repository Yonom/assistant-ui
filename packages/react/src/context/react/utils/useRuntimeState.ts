import { useDebugValue, useSyncExternalStore } from "react";
import { Unsubscribe } from "../../../types";

export type SubscribableRuntime<TState> = {
  getState: () => TState;
  subscribe: (callback: () => void) => Unsubscribe;
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
  const slice = useSyncExternalStore(
    runtime.subscribe,
    () => selector(runtime.getState()),
    () => selector(runtime.getState()),
  );
  useDebugValue(slice);
  return slice;
}
