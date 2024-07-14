"use client";

import {
  ActionBarPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  ToolCallContentPartComponent,
  useAssistantContext,
  useMessageContext,
  useThreadContext,
} from "@assistant-ui/react";
import { useState, type FC, type KeyboardEvent, type MouseEvent } from "react";
import {
  CheckIcon,
  CircleXIcon,
  CopyIcon,
  CornerDownRightIcon,
  PlusIcon,
  SendHorizontalIcon,
  SquareFunction,
  TrashIcon,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectValue } from "../select";
import { Avatar, AvatarFallback } from "../avatar";
import { SelectTrigger } from "@radix-ui/react-select";
import { Button } from "../button";
import { TooltipIconButton } from "./tooltip-icon-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { useGetPlaygroundRuntime } from "./useGetPlaygroundRuntime";

export const Thread: FC = () => {
  return (
    <ThreadPrimitive.Root className="bg-aui-background h-full">
      <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-inherit px-4 pt-8">
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{ SystemMessage: Message, Message }}
        />

        <div className="sticky bottom-0 mt-4 flex w-full max-w-2xl flex-grow flex-col items-center justify-end rounded-t-lg bg-inherit pb-4">
          <Composer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
};

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex flex-grow basis-full flex-col items-center justify-center">
        <Avatar>
          <AvatarFallback>C</AvatarFallback>
        </Avatar>
        <p className="mt-4 font-medium">How can I help you today?</p>
      </div>
    </ThreadPrimitive.Empty>
  );
};

const Composer: FC = () => {
  const [role, setRole] = useState<"user" | "assistant" | "system">("user");
  const { useThread, useThreadActions, useComposer, useThreadMessages } =
    useThreadContext();
  const isRunning = useThread((t) => t.isRunning);
  const hasValue = useComposer((c) => c.value.length > 0);

  const performAdd = () => {
    const composer = useComposer.getState();
    const value = composer.value;
    if (!value) return;

    composer.setValue("");

    useThreadActions.getState().append({
      parentId: useThreadMessages.getState().at(-1)?.id ?? null,
      role,
      content: [{ type: "text", text: value }],
    });

    setRole("user");
  };

  const performSubmit = () => {
    performAdd();
    useThreadActions.getState().startRun(null);
  };

  const handleAdd = (e: MouseEvent) => {
    e.preventDefault();
    performAdd();
  };

  const handleSubmit = (e: MouseEvent) => {
    e.preventDefault();
    performSubmit();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // cmd+enter
    if (e.metaKey && e.key === "Enter") {
      e.preventDefault();
      performSubmit();
    } else if (e.key === "Enter") {
      e.preventDefault();
      performAdd();
    }
  };

  return (
    <ComposerPrimitive.Root className="flex w-full flex-col rounded-lg border transition-shadow focus-within:shadow-sm">
      <ComposerPrimitive.Input
        autoFocus
        placeholder="Write a message..."
        rows={1}
        className="placeholder:text-aui-muted-foreground size-full max-h-40 resize-none bg-transparent p-4 pr-24 text-sm outline-none"
        onKeyDown={handleKeyDown}
      />
      <div className="mx-3 mb-3 mt-0 flex items-end gap-2">
        <Select value={role} onValueChange={setRole as (v: string) => void}>
          <SelectTrigger asChild>
            <Button size="sm">
              <SelectValue placeholder="User" />
            </Button>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user" defaultChecked>
              User
            </SelectItem>
            <SelectItem value="assistant">Assistant</SelectItem>
            <SelectItem value="system">System</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-grow" />
        <Button
          onClick={handleAdd}
          disabled={isRunning || !hasValue}
          variant="default"
          size="sm"
          className="transition-opacity"
        >
          Add
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isRunning}
          variant="default"
          size="sm"
          className="transition-opacity"
        >
          Run
          <SendHorizontalIcon className="ml-2 size-4" />
        </Button>
      </div>
    </ComposerPrimitive.Root>
  );
};

const ToolList: FC = () => {
  const getPlaygroundRuntime = useGetPlaygroundRuntime();
  const { useMessage } = useMessageContext();
  const { useModelConfig } = useAssistantContext();
  const toolNames = useModelConfig((c) =>
    Object.keys(c.getModelConfig().tools ?? {}),
  );

  return (
    <>
      {toolNames.map((toolName, idx) => (
        <DropdownMenuItem
          key={idx}
          className="gap-2"
          onClick={() => {
            getPlaygroundRuntime().addTool({
              messageId: useMessage.getState().message.id,
              toolName,
            });
          }}
        >
          <SquareFunction className="size-4" />
          {toolName}
        </DropdownMenuItem>
      ))}
    </>
  );
};

const AddToolCallButton = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="mt-3 h-8">
          <PlusIcon className="size-4" />
          Add Tool Call
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem>Add a new tool</DropdownMenuItem>
        <DropdownMenuSeparator />
        <ToolList />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Message: FC = () => {
  const getPlaygroundRuntime = useGetPlaygroundRuntime();
  const { useMessage } = useMessageContext();
  const role = useMessage((m) => m.message.role);

  const handleDelete = () => {
    getPlaygroundRuntime().deleteMessage(useMessage.getState().message.id);
  };

  return (
    <MessagePrimitive.Root className="relative mb-4 flex w-full max-w-2xl flex-col rounded-lg border p-4">
      <div className="mb-1 flex">
        <p className="text-sm font-semibold uppercase">{role}</p>
        <div className="flex-grow" />
        <ActionBarPrimitive.Copy asChild>
          <TooltipIconButton tooltip="Copy" side="top">
            <MessagePrimitive.If copied={false}>
              <CopyIcon />
            </MessagePrimitive.If>
            <MessagePrimitive.If copied>
              <CheckIcon />
            </MessagePrimitive.If>
          </TooltipIconButton>
        </ActionBarPrimitive.Copy>
        <TooltipIconButton
          tooltip="Delete message"
          side="top"
          onClick={handleDelete}
        >
          <TrashIcon />
        </TooltipIconButton>
      </div>
      <div className="flex flex-col gap-2 break-words">
        <MessagePrimitive.Content components={{ tools: { Fallback } }} />
      </div>
      <div>
        {role === "user" && (
          <Button variant="outline" size="sm" className="mt-3 h-8">
            <PlusIcon className="mr-1.5 size-4" />
            Add Image
          </Button>
        )}
        {role === "assistant" && <AddToolCallButton />}
      </div>
    </MessagePrimitive.Root>
  );
};

const Fallback: ToolCallContentPartComponent = ({ part }) => {
  const { useMessage } = useMessageContext();
  const messageId = useMessage((m) => m.message.id);
  const getPlaygroundRuntime = useGetPlaygroundRuntime();
  const handleDelete = () => {
    getPlaygroundRuntime().deleteContentPart(messageId, part);
  };
  return (
    <div className="bg-aui-muted flex flex-col gap-2 rounded p-4 font-mono">
      <div className="flex gap-2">
        <p className="flex-grow whitespace-pre-wrap break-all">
          {part.toolName}({JSON.stringify(part.args, null, 2)})
        </p>
        <TooltipIconButton tooltip="Delete" side="top" onClick={handleDelete}>
          <CircleXIcon className="size-4" />
        </TooltipIconButton>
      </div>
      <div className="flex gap-2">
        <CornerDownRightIcon className="mt-0.5 size-4" />
        <p>{part.result ?? "<enter result>"}</p>
      </div>
    </div>
  );
};
