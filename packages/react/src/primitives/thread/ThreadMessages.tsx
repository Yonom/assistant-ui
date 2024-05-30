"use client";

import type { FC } from "react";
import { UPCOMING_MESSAGE_ID } from "../../adapters/vercel/useVercelAIBranches";
import { hasUpcomingMessage } from "../../adapters/vercel/useVercelAIBranches";
import { useAssistantContext } from "../../utils/context/AssistantContext";
import { ROOT_PARENT_ID } from "../../utils/context/stores/AssistantTypes";
import { ComposerIf } from "../composer/ComposerIf";
import { Provider } from "../message";
import { MessageIf } from "../message/MessageIf";

type ThreadMessagesProps = {
  components:
    | {
        Message: React.ComponentType;
        UserMessage?: React.ComponentType;
        EditComposer?: React.ComponentType;
        AssistantMessage?: React.ComponentType;
      }
    | {
        Message?: React.ComponentType;
        UserMessage: React.ComponentType;
        EditComposer?: React.ComponentType;
        AssistantMessage: React.ComponentType;
      };
};

const getComponents = (components: ThreadMessagesProps["components"]) => {
  return {
    EditComposer:
      components.EditComposer ??
      components.UserMessage ??
      (components.Message as React.ComponentType),
    UserMessage:
      components.UserMessage ?? (components.Message as React.ComponentType),
    AssistantMessage:
      components.AssistantMessage ??
      (components.Message as React.ComponentType),
  };
};

export const ThreadMessages: FC<ThreadMessagesProps> = ({ components }) => {
  const { useThread } = useAssistantContext();
  const thread = useThread();

  const messages = thread.messages;

  const { UserMessage, EditComposer, AssistantMessage } =
    getComponents(components);

  if (messages.length === 0) return null;

  return (
    <>
      {messages.map((message, idx) => {
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: fixes a11y issues with branch navigation
          <Provider key={idx} message={message}>
            <MessageIf user>
              <ComposerIf editing={false}>
                <UserMessage />
              </ComposerIf>
              <ComposerIf editing>
                <EditComposer />
              </ComposerIf>
            </MessageIf>
            <MessageIf assistant>
              <AssistantMessage />
            </MessageIf>
          </Provider>
        );
      })}
      {hasUpcomingMessage(thread) && (
        <Provider
          message={{
            id: UPCOMING_MESSAGE_ID,
            role: "assistant",
            content: [{ type: "text", text: "..." }],
            parentId: messages.at(-1)?.id ?? ROOT_PARENT_ID,
            // TODO fix these (move upcoming message to AssistantContext)
            branches: [UPCOMING_MESSAGE_ID],
            createdAt: new Date(),
          }}
        >
          <AssistantMessage />
        </Provider>
      )}
    </>
  );
};
