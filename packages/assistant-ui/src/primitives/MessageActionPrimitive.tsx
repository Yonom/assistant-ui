"use client";
import { forwardRef } from "react";
import { Primitive, ComponentPropsWithoutRef } from "@radix-ui/react-primitive";
import { composeEventHandlers } from "@radix-ui/primitive";
import {
  useChatContext,
  useIsEditingContext,
  useMessageContext,
} from "../utils/Context";
import { Message } from "ai";
import { UseChatWithBranchesHelpers } from "../hooks/useChatWithBranches";

type ActionCalback = (
  message: Message,
  chat: UseChatWithBranchesHelpers,
  isEditing: ReturnType<typeof useIsEditingContext>,
) => void;
type ActionIsEnabledCallback = (
  message: Message,
  chat: UseChatWithBranchesHelpers,
  isEditing: ReturnType<typeof useIsEditingContext>,
) => boolean;
const createActionButtonPrimitive = (
  callback: ActionCalback,
  getEnabled: ActionIsEnabledCallback,
) => {
  type PrimitiveButtonElement = React.ElementRef<typeof Primitive.button>;
  type PrimitiveButtonProps = ComponentPropsWithoutRef<typeof Primitive.button>;

  return forwardRef<PrimitiveButtonElement, PrimitiveButtonProps>(
    (props, forwardedRef) => {
      const chat = useChatContext();
      const message = useMessageContext();
      const isEditing = useIsEditingContext();

      const disabled = !getEnabled(message, chat, isEditing);

      return (
        <Primitive.button
          type="button"
          disabled={disabled}
          {...props}
          ref={forwardedRef}
          onClick={composeEventHandlers(props.onClick, () => {
            if (disabled) return;
            callback(message, chat, isEditing);
          })}
        />
      );
    },
  );
};

export const EditBegin = createActionButtonPrimitive(
  (message, __, [, setIsEditing]) => {
    setIsEditing(message.content);
  },
  (_, __, [isEditing]) => isEditing === false,
);

export const EditCancel = createActionButtonPrimitive(
  (_, __, [, setIsEditing]) => {
    setIsEditing(false);
  },
  (_, __, [isEditing]) => isEditing !== false,
);

export const EditConfirm = createActionButtonPrimitive(
  (message, chat, [editValue, setIsEditing]) => {
    if (editValue !== false) {
      chat.editAt(message, {
        ...message,
        id: undefined,
        content: editValue,
      });
    }

    setIsEditing(false);
  },
  (_, __, [isEditing]) => isEditing !== false,
);

export const ReadAloud = createActionButtonPrimitive(
  (message) => {
    // TODO
  },
  (msg) => true,
);

export const Copy = createActionButtonPrimitive(
  (message) => {
    navigator.clipboard.writeText(message.content);
  },
  () => true,
);

export const Reload = createActionButtonPrimitive(
  (message, chat) => {
    chat.reloadAt(message);
  },
  (msg) => msg.role === "assistant",
);

export const BranchGoBack = createActionButtonPrimitive(
  (message, chat) => {
    const { branchId } = chat.getBranchState(message);
    chat.switchToBranch(message, branchId - 1);
  },
  (msg, chat) => {
    const { branchId, branchCount } = chat.getBranchState(msg);
    return branchCount > 1 && branchId > 0;
  },
);

export const BranchGoForward = createActionButtonPrimitive(
  (message, chat) => {
    const { branchId } = chat.getBranchState(message);
    chat.switchToBranch(message, branchId + 1);
  },
  (msg, chat) => {
    const { branchId, branchCount } = chat.getBranchState(msg);
    return branchCount > 1 && branchId + 1 < branchCount;
  },
);
