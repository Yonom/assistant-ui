"use client";
import { FC, KeyboardEvent, useRef } from "react";
import { ArrowUpIcon } from "@radix-ui/react-icons";
import { useChatContext } from "assistant-ui/src/utils/Context";

export const Composer: FC = () => {
  const chat = useChatContext();

  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault();
      buttonRef.current?.click();
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={chat.handleSubmit}
      className="flex flex-col rounded-t-xl border border-[#6c6a6040] bg-[#393937] p-0.5"
    >
      <div className="flex">
        <textarea
          placeholder="Reply to Claude..."
          value={chat.input}
          onChange={chat.handleInputChange}
          className="h-12 flex-grow resize-none bg-transparent p-3.5 text-sm text-white outline-none placeholder:text-white/50"
          onKeyDown={handleKeyPress}
        />
        <button
          ref={buttonRef}
          type="submit"
          className="m-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#ae5630] text-2xl font-bold disabled:opacity-0"
          disabled={chat.input.length === 0}
        >
          <ArrowUpIcon
            width={16}
            height={16}
            className="text-[#ddd] [&_path]:stroke-white [&_path]:stroke-[0.5]"
          />
        </button>
      </div>
      <p className="-mt-1 mb-3 px-3.5 text-sm text-white/70">Claude 3 Sonnet</p>
    </form>
  );
};
