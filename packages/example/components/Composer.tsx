"use client";
import { FC } from "react";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import { useChatContext } from "assistant-ui/src/utils/Context";

export const Composer: FC = () => {
  const chat = useChatContext();
  return (
    <form
      onSubmit={chat.handleSubmit}
      className="flex rounded-xl border border-white/15 p-0.5"
    >
      <textarea
        placeholder="Message ChatGPT..."
        value={chat.input}
        onChange={chat.handleInputChange}
        className="h-12 flex-grow resize-none bg-transparent p-3.5 text-sm text-white outline-none placeholder:text-white/50"
      />
      <button
        type="submit"
        className="m-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-2xl font-bold disabled:opacity-10"
        disabled={chat.input.length === 0}
      >
        <ArrowUpIcon
          width={20}
          height={20}
          className="[&_path]:stroke-black [&_path]:stroke-[0.5]"
        />
      </button>
    </form>
  );
};
