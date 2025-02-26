import { generateId } from "../../internal";
import {
  CompleteAttachment,
  FileContentPart,
  ImageContentPart,
  MessageStatus,
  TextContentPart,
  ThreadAssistantContentPart,
  ThreadAssistantMessage,
  ThreadMessage,
  ThreadSystemMessage,
  ThreadUserContentPart,
  ThreadUserMessage,
  UIContentPart,
  Unstable_AudioContentPart,
} from "../../types";
import { ReasoningContentPart, ThreadStep } from "../../types/AssistantTypes";
import {
  ReadonlyJSONObject,
  ReadonlyJSONValue,
} from "../../utils/json/json-value";
import { parsePartialJson } from "../../utils/json/parse-partial-json";

export type ThreadMessageLike = {
  readonly role: "assistant" | "user" | "system" | "data";
  readonly content:
    | string
    | readonly (
        | TextContentPart
        | ReasoningContentPart
        | ImageContentPart
        | FileContentPart
        | Unstable_AudioContentPart
        | {
            readonly type: "tool-call";
            readonly toolCallId?: string;
            readonly toolName: string;
            readonly args?: ReadonlyJSONObject;
            readonly argsText?: string;
            readonly result?: any | undefined;
            readonly isError?: boolean | undefined;
          }
        | UIContentPart
      )[];
  readonly id?: string | undefined;
  readonly createdAt?: Date | undefined;
  readonly status?: MessageStatus | undefined;
  readonly attachments?: readonly CompleteAttachment[] | undefined;
  readonly metadata?:
    | {
        readonly unstable_annotations?:
          | readonly ReadonlyJSONValue[]
          | undefined;
        readonly unstable_data?: readonly ReadonlyJSONValue[] | undefined;
        readonly steps?: readonly ThreadStep[] | undefined;
        readonly custom?: Record<string, unknown> | undefined;
      }
    | undefined;
};

export const fromThreadMessageLike = (
  like: ThreadMessageLike,
  fallbackId: string,
  fallbackStatus: MessageStatus,
): ThreadMessage => {
  const { role, id, createdAt, attachments, status, metadata } = like;
  const common = {
    id: id ?? fallbackId,
    createdAt: createdAt ?? new Date(),
  };

  const content =
    typeof like.content === "string"
      ? [{ type: "text" as const, text: like.content }]
      : like.content;

  if (role !== "user" && attachments)
    throw new Error("attachments are only supported for user messages");

  if (role !== "assistant" && status)
    throw new Error("status is only supported for assistant messages");

  if (role !== "assistant" && metadata?.steps)
    throw new Error("metadata.steps is only supported for assistant messages");

  switch (role) {
    case "assistant":
      return {
        ...common,
        role,
        content: content
          .map((part): ThreadAssistantContentPart | null => {
            const type = part.type;
            switch (type) {
              case "text":
              case "reasoning":
                if (part.text.trim().length === 0) return null;
                return part;

              case "ui":
                return part;

              case "tool-call": {
                if (part.args) {
                  return {
                    ...part,
                    toolCallId: part.toolCallId ?? "tool-" + generateId(),
                    args: part.args,
                    argsText: JSON.stringify(part.args),
                  };
                }
                return {
                  ...part,
                  toolCallId: part.toolCallId ?? "tool-" + generateId(),
                  args: part.args ?? parsePartialJson(part.argsText ?? "{}"),
                  argsText: part.argsText ?? "",
                };
              }

              default: {
                const unhandledType: "image" | "audio" | "file" = type;
                throw new Error(
                  `Unsupported assistant content part type: ${unhandledType}`,
                );
              }
            }
          })
          .filter((c) => !!c),
        status: status ?? fallbackStatus,
        metadata: {
          unstable_annotations: metadata?.unstable_annotations ?? [],
          unstable_data: metadata?.unstable_data ?? [],
          custom: metadata?.custom ?? {},
          steps: metadata?.steps ?? [],
        },
      } satisfies ThreadAssistantMessage;

    case "user":
      return {
        ...common,
        role,
        content: content.map((part): ThreadUserContentPart => {
          const type = part.type;
          switch (type) {
            case "text":
            case "ui":
            case "image":
            case "audio":
            case "file":
              return part;

            default: {
              const unhandledType: "tool-call" | "reasoning" = type;
              throw new Error(
                `Unsupported user content part type: ${unhandledType}`,
              );
            }
          }
        }),
        attachments: attachments ?? [],
        metadata: {
          custom: metadata?.custom ?? {},
        },
      } satisfies ThreadUserMessage;

    case "system":
      if (content.length !== 1 || content[0]!.type !== "text")
        throw new Error(
          "System messages must have exactly one text content part.",
        );

      return {
        ...common,
        role,
        content: content as [TextContentPart],
        metadata: {
          custom: metadata?.custom ?? {},
        },
      } satisfies ThreadSystemMessage;

    default: {
      const unsupportedRole: never = role;
      throw new Error(`Unknown message role: ${unsupportedRole}`);
    }
  }
};
