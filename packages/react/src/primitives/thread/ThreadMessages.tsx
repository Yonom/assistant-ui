"use client";

import { type ComponentType, type FC, memo } from "react";
import { useThreadContext } from "../../context/react/ThreadContext";
import { MessageProvider } from "../../context/providers/MessageProvider";
import { useMessageContext } from "../../context";
import { ThreadMessage as ThreadMessageType } from "../../types";

export type ThreadPrimitiveMessagesProps = {
  components:
    | {
        Message: ComponentType;
        EditComposer?: ComponentType | undefined;
        UserEditComposer?: ComponentType | undefined;
        AssistantEditComposer?: ComponentType | undefined;
        SystemEditComposer?: ComponentType | undefined;
        UserMessage?: ComponentType | undefined;
        AssistantMessage?: ComponentType | undefined;
        SystemMessage?: ComponentType | undefined;
      }
    | {
        Message?: ComponentType | undefined;
        EditComposer?: ComponentType | undefined;
        UserEditComposer?: ComponentType | undefined;
        AssistantEditComposer?: ComponentType | undefined;
        SystemEditComposer?: ComponentType | undefined;
        UserMessage: ComponentType;
        AssistantMessage: ComponentType;
        SystemMessage?: ComponentType | undefined;
      };
};

const DEFAULT_SYSTEM_MESSAGE = () => null;

const getComponent = (
  components: ThreadPrimitiveMessagesProps["components"],
  role: ThreadMessageType["role"],
  isEditing: boolean,
) => {
  switch (role) {
    case "user":
      if (isEditing) {
        return (
          components.UserEditComposer ??
          components.EditComposer ??
          components.UserMessage ??
          (components.Message as ComponentType)
        );
      } else {
        return components.UserMessage ?? (components.Message as ComponentType);
      }
    case "assistant":
      if (isEditing) {
        return (
          components.AssistantEditComposer ??
          components.EditComposer ??
          components.AssistantMessage ??
          (components.Message as ComponentType)
        );
      } else {
        return (
          components.AssistantMessage ?? (components.Message as ComponentType)
        );
      }
    case "system":
      if (isEditing) {
        return (
          components.SystemEditComposer ??
          components.EditComposer ??
          components.SystemMessage ??
          (components.Message as ComponentType)
        );
      } else {
        return components.SystemMessage ?? DEFAULT_SYSTEM_MESSAGE;
      }
    default:
      const _exhaustiveCheck: never = role;
      throw new Error(`Unknown message role: ${_exhaustiveCheck}`);
  }
};

type ThreadMessageProps = {
  messageIndex: number;
  components: ThreadPrimitiveMessagesProps["components"];
};

const ThreadMessageImpl: FC<ThreadMessageProps> = ({
  messageIndex,
  components,
}) => {
  const { useMessage, useEditComposer } = useMessageContext();
  const role = useMessage((m) => m.message.role);
  const isEditing = useEditComposer((c) => c.isEditing);
  const Component = getComponent(components, role, isEditing);

  return (
    <MessageProvider messageIndex={messageIndex}>
      <Component />
    </MessageProvider>
  );
};

const ThreadMessage = memo(
  ThreadMessageImpl,
  (prev, next) =>
    prev.messageIndex === next.messageIndex &&
    prev.components.Message === next.components.Message &&
    prev.components.UserMessage === next.components.UserMessage &&
    prev.components.EditComposer === next.components.EditComposer &&
    prev.components.AssistantMessage === next.components.AssistantMessage &&
    prev.components.SystemMessage === next.components.SystemMessage,
);

export const ThreadPrimitiveMessagesImpl: FC<ThreadPrimitiveMessagesProps> = ({
  components,
}) => {
  const { useThreadMessages } = useThreadContext();

  const messagesLength = useThreadMessages((t) => t.length);
  if (messagesLength === 0) return null;

  return Array.from({ length: messagesLength }, (_, index) => (
    <ThreadMessage key={index} messageIndex={index} components={components} />
  ));
};

ThreadPrimitiveMessagesImpl.displayName = "ThreadPrimitive.Messages";

export const ThreadPrimitiveMessages = memo(
  ThreadPrimitiveMessagesImpl,
  (prev, next) =>
    prev.components?.Message === next.components?.Message &&
    prev.components?.UserMessage === next.components?.UserMessage &&
    prev.components?.EditComposer === next.components?.EditComposer &&
    prev.components?.AssistantMessage === next.components?.AssistantMessage &&
    prev.components?.SystemMessage === next.components?.SystemMessage,
);
