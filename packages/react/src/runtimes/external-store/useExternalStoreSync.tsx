import { useEffect, useMemo } from "react";
import { ExternalStoreAdapter } from "./ExternalStoreAdapter";
import {
  ConverterCallback,
  ThreadMessageConverter,
} from "./ThreadMessageConverter";
import { ThreadMessage } from "../../types";

type UpdateDataCallback = (
  isRunning: boolean,
  messages: ThreadMessage[],
) => void;

export const useExternalStoreSync = <T extends WeakKey>(
  adapter: ExternalStoreAdapter<T>,
  updateData: UpdateDataCallback,
) => {
  // flush the converter cache when the convertMessage prop changes
  const [converter, convertCallback] = useMemo(() => {
    const converter = adapter.convertMessage ?? ((m: T) => m as ThreadMessage);
    const convertCallback: ConverterCallback<T> = (cache, m, idx) => {
      if (cache) return cache;
      return converter(m, idx);
    };
    return [new ThreadMessageConverter(), convertCallback];
  }, [adapter.convertMessage]);

  useEffect(() => {
    updateData(
      adapter.isRunning ?? false,
      converter.convertMessages(adapter.messages, convertCallback),
    );
  }, [
    updateData,
    converter,
    convertCallback,
    adapter.messages,
    adapter.isRunning,
  ]);
};
