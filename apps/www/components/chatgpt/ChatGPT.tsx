"use client";

import { cn } from "@/lib/utils";
import {
  ActionBarPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react";
import * as Avatar from "@radix-ui/react-avatar";
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  Pencil1Icon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import React, { type FC } from "react";
import { Button, type ButtonProps } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const ChatGPT: FC = () => {
  return (
    <ThreadPrimitive.Root className="dark flex h-full flex-col items-stretch bg-[#212121] px-4 text-foreground">
      <ThreadPrimitive.Viewport className="flex flex-grow flex-col gap-8 overflow-y-scroll pt-16">
        <ThreadPrimitive.Empty>
          <div className="flex flex-grow flex-col items-center justify-center">
            <Avatar.Root className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-white">
              <Avatar.AvatarFallback>C</Avatar.AvatarFallback>
            </Avatar.Root>
            <p className="mt-4 text-white text-xl">How can I help you today?</p>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage,
            EditComposer,
            AssistantMessage,
          }}
        />
      </ThreadPrimitive.Viewport>

      <ComposerPrimitive.Root className="mx-auto flex w-full max-w-screen-md items-end rounded-3xl bg-white/5 pl-2">
        <ComposerPrimitive.Input
          placeholder="Message ChatGPT"
          className="h-12 max-h-40 flex-grow resize-none bg-transparent p-3.5 text-sm text-white outline-none placeholder:text-white/50"
        />
        <ThreadPrimitive.If running={false}>
          <ComposerPrimitive.Send className="m-2 flex size-8 items-center justify-center rounded-full bg-white transition-opacity disabled:opacity-10">
            <ArrowUpIcon className="size-5 text-black [&_path]:stroke-[1] [&_path]:stroke-black" />
          </ComposerPrimitive.Send>
        </ThreadPrimitive.If>
        <ThreadPrimitive.If running>
          <ComposerPrimitive.Cancel className="m-2 flex size-8 items-center justify-center rounded-full bg-white">
            <div className="size-2.5 bg-black" />
          </ComposerPrimitive.Cancel>
        </ThreadPrimitive.If>
      </ComposerPrimitive.Root>
      <p className="p-2 text-center text-[#cdcdcd] text-xs">
        ChatGPT can make mistakes. Check important info.
      </p>
    </ThreadPrimitive.Root>
  );
};

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative mx-auto flex w-full max-w-screen-md flex-col items-end gap-1">
      <div className="flex items-start gap-4">
        <ActionBarPrimitive.Root
          hideWhenRunning
          autohide="not-last"
          autohideFloat="single-branch"
          className="mt-2"
        >
          <ActionBarPrimitive.Edit asChild>
            <ActionButton tooltip="Edit">
              <Pencil1Icon />
            </ActionButton>
          </ActionBarPrimitive.Edit>
        </ActionBarPrimitive.Root>

        <p className="whitespace-pre-line rounded-3xl bg-white/5 px-5 py-2 text-[#eee]">
          <MessagePrimitive.Content />
        </p>
      </div>

      <BranchPicker className="mt-2 mr-3" />
    </MessagePrimitive.Root>
  );
};

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="mx-auto flex w-full max-w-screen-md flex-col justify-end gap-1 rounded-3xl bg-white/15">
      <ComposerPrimitive.Input className="flex h-8 w-full resize-none bg-transparent p-5 pb-0 text-white outline-none" />

      <div className="m-3 mt-2 flex items-center justify-center gap-2 self-end">
        <ComposerPrimitive.Cancel className="rounded-full bg-zinc-900 px-3 py-2 font-semibold text-sm text-white hover:bg-zinc-800">
          Cancel
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send className="rounded-full bg-white px-3 py-2 font-semibold text-black text-sm hover:bg-white/90">
          Send
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  );
};

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="relative mx-auto flex w-full max-w-screen-md gap-3">
      <Avatar.Root className="flex size-8 flex-shrink-0 items-center justify-center rounded-[24px] border border-white/15 shadow">
        <Avatar.AvatarFallback className="text-white text-xs">
          C
        </Avatar.AvatarFallback>
      </Avatar.Root>

      <div className="pt-1">
        <p className="whitespace-pre-line text-[#eee]">
          <MessagePrimitive.Content />
        </p>

        <div className="flex pt-2">
          <BranchPicker />

          <ActionBarPrimitive.Root
            hideWhenRunning
            autohide="not-last"
            autohideFloat="single-branch"
            className="flex items-center gap-1 rounded-lg data-[floating=true]:absolute data-[floating=true]:border-2 data-[floating=true]:p-1"
          >
            <ActionBarPrimitive.Reload asChild>
              <ActionButton tooltip="Reload">
                <ReloadIcon />
              </ActionButton>
            </ActionBarPrimitive.Reload>
            <ActionBarPrimitive.Copy asChild>
              <ActionButton tooltip="Copy">
                <MessagePrimitive.If copied>
                  <CheckIcon />
                </MessagePrimitive.If>
                <MessagePrimitive.If copied={false}>
                  <CopyIcon />
                </MessagePrimitive.If>
              </ActionButton>
            </ActionBarPrimitive.Copy>
          </ActionBarPrimitive.Root>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

const BranchPicker: FC<{ className?: string }> = ({ className }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "inline-flex items-center font-semibold text-[#b4b4b4] text-sm",
        className,
      )}
    >
      <BranchPickerPrimitive.Previous asChild>
        <ActionButton tooltip="Previous">
          <ChevronLeftIcon />
        </ActionButton>
      </BranchPickerPrimitive.Previous>
      <BranchPickerPrimitive.Number />/<BranchPickerPrimitive.Count />
      <BranchPickerPrimitive.Next asChild>
        <ActionButton tooltip="Next">
          <ChevronRightIcon />
        </ActionButton>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

type ActionButtonProps = ButtonProps & { tooltip: string };

const ActionButton: FC<ActionButtonProps> = ({
  tooltip,
  className,
  children,
  ...rest
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-auto p-1 text-[#b4b4b4]", className)}
          {...rest}
        >
          {children}
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
};
