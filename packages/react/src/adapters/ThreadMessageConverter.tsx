"use client";
import type { ThreadMessage } from "../utils/context/stores/AssistantTypes";

export type ConverterCallback<TIn extends WeakKey> = (
  message: TIn,
  cache: ThreadMessage | undefined,
) => ThreadMessage;

export class ThreadMessageConverter<TIn extends WeakKey> {
  private readonly cache = new WeakMap<TIn, ThreadMessage>();

  constructor(private readonly converter: ConverterCallback<TIn>) {}

  convertMessages(messages: TIn[]): ThreadMessage[] {
    return messages.map((m) => {
      const cached = this.cache.get(m);
      const newMessage = this.converter(m, cached);
      this.cache.set(m, newMessage);
      return newMessage;
    });
  }
}
