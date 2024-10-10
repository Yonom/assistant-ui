"use client";

import { type ComponentType, type FC, memo, useMemo } from "react";
import { useThread, useThreadRuntime } from "../../context/react/ThreadContext";
import { MessageRuntimeProvider } from "../../context/providers/MessageRuntimeProvider";
import { useEditComposer, useMessage } from "../../context";
import { ThreadMessage as ThreadMessageType } from "../../types";

/**
 * @deprecated Use `ThreadPrimitive.Messages.Props` instead. This will be removed in 0.6.
 */
export type ThreadPrimitiveMessagesProps = ThreadPrimitiveMessages.Props;

export namespace ThreadPrimitiveMessages {
  export type Props = {
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
}

const isComponentsSame = (
  prev: ThreadPrimitiveMessages.Props["components"],
  next: ThreadPrimitiveMessages.Props["components"],
) => {
  return (
    prev.Message === next.Message &&
    prev.EditComposer === next.EditComposer &&
    prev.UserEditComposer === next.UserEditComposer &&
    prev.AssistantEditComposer === next.AssistantEditComposer &&
    prev.SystemEditComposer === next.SystemEditComposer &&
    prev.UserMessage === next.UserMessage &&
    prev.AssistantMessage === next.AssistantMessage &&
    prev.SystemMessage === next.SystemMessage
  );
};

const DEFAULT_SYSTEM_MESSAGE = () => null;

const getComponent = (
  components: ThreadPrimitiveMessages.Props["components"],
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

type ThreadMessageComponentProps = {
  components: ThreadPrimitiveMessages.Props["components"];
};

const ThreadMessageComponent: FC<ThreadMessageComponentProps> = ({
  components,
}) => {
  const role = useMessage((m) => m.role);
  const isEditing = useEditComposer((c) => c.isEditing);
  const Component = getComponent(components, role, isEditing);

  return <Component />;
};

type ThreadMessageProps = {
  messageIndex: number;
  components: ThreadPrimitiveMessages.Props["components"];
};

const ThreadMessageImpl: FC<ThreadMessageProps> = ({
  messageIndex,
  components,
}) => {
  const threadRuntime = useThreadRuntime();
  const runtime = useMemo(
    () => threadRuntime.getMesssageByIndex(messageIndex),
    [threadRuntime, messageIndex],
  );

  return (
    <MessageRuntimeProvider runtime={runtime}>
      <ThreadMessageComponent components={components} />
    </MessageRuntimeProvider>
  );
};

const ThreadMessage = memo(
  ThreadMessageImpl,
  (prev, next) =>
    prev.messageIndex === next.messageIndex &&
    isComponentsSame(prev.components, next.components),
);

export const ThreadPrimitiveMessagesImpl: FC<ThreadPrimitiveMessages.Props> = ({
  components,
}) => {
  const messagesLength = useThread((t) => t.messages.length);
  if (messagesLength === 0) return null;

  return Array.from({ length: messagesLength }, (_, index) => (
    <ThreadMessage key={index} messageIndex={index} components={components} />
  ));
};

ThreadPrimitiveMessagesImpl.displayName = "ThreadPrimitive.Messages";

export const ThreadPrimitiveMessages = memo(
  ThreadPrimitiveMessagesImpl,
  (prev, next) => isComponentsSame(prev.components, next.components),
);
