"use client";

import { ComponentPropsWithoutRef, forwardRef, type FC } from "react";

import { PaperclipIcon, SendHorizontalIcon } from "lucide-react";
import { withDefaults } from "./utils/withDefaults";
import { useThreadConfig } from "./thread-config";
import {
  TooltipIconButton,
  TooltipIconButtonProps,
} from "./base/tooltip-icon-button";
import { CircleStopIcon } from "./base/CircleStopIcon";
import { ComposerPrimitive, ThreadPrimitive } from "../primitives";
import { useThread } from "../context/react/ThreadContext";
import ComposerAttachment from "./composer-attachment";
import { ComposerPrimitiveAttachmentsProps } from "../primitives/composer/ComposerAttachments";

const useAllowAttachments = (ensureCapability = false) => {
  const { composer: { allowAttachments = true } = {} } = useThreadConfig();
  const attachmentsSupported = useThread((t) => t.capabilities.attachments);
  return allowAttachments && (!ensureCapability || attachmentsSupported);
};

const Composer: FC = () => {
  const allowAttachments = useAllowAttachments(true);
  return (
    <ComposerRoot>
      {allowAttachments && <ComposerAttachments />}
      {allowAttachments && <ComposerAddAttachment />}
      <ComposerInput autoFocus />
      <ComposerAction />
    </ComposerRoot>
  );
};

Composer.displayName = "Composer";

const ComposerRoot = withDefaults(ComposerPrimitive.Root, {
  className: "aui-composer-root",
});

ComposerRoot.displayName = "ComposerRoot";

const ComposerInputStyled = withDefaults(ComposerPrimitive.Input, {
  rows: 1,
  autoFocus: true,
  className: "aui-composer-input",
});

export type ComposerInputProps = ComponentPropsWithoutRef<
  typeof ComposerInputStyled
>;
const ComposerInput = forwardRef<HTMLTextAreaElement, ComposerInputProps>(
  (props, ref) => {
    const {
      strings: {
        composer: { input: { placeholder = "Write a message..." } = {} } = {},
      } = {},
    } = useThreadConfig();
    return (
      <ComposerInputStyled placeholder={placeholder} {...props} ref={ref} />
    );
  },
);

ComposerInput.displayName = "ComposerInput";

const ComposerAttachmentsContainer = withDefaults("div", {
  className: "aui-composer-attachments",
});

type ComposerAttachmentsProps = Partial<ComposerPrimitiveAttachmentsProps>;

const ComposerAttachments: FC<ComposerAttachmentsProps> = ({ components }) => {
  return (
    <ComposerAttachmentsContainer>
      <ComposerPrimitive.Attachments
        components={{
          ...components,
          Attachment: components?.Attachment ?? ComposerAttachment,
        }}
      />
    </ComposerAttachmentsContainer>
  );
};

const ComposerAttachButton = withDefaults(TooltipIconButton, {
  variant: "default",
  className: "aui-composer-attach",
});

const ComposerAddAttachment = forwardRef<
  HTMLButtonElement,
  Partial<TooltipIconButtonProps>
>((props, ref) => {
  const {
    strings: {
      composer: { addAttachment: { tooltip = "Attach file" } = {} } = {},
    } = {},
  } = useThreadConfig();
  const allowAttachments = useAllowAttachments();
  return (
    <ComposerPrimitive.AddAttachment disabled={!allowAttachments} asChild>
      <ComposerAttachButton
        tooltip={tooltip}
        variant={"ghost"}
        {...props}
        ref={ref}
      >
        {props.children ?? <PaperclipIcon />}
      </ComposerAttachButton>
    </ComposerPrimitive.AddAttachment>
  );
});

ComposerAddAttachment.displayName = "ComposerAddAttachment";

const useAllowCancel = () => {
  const cancelSupported = useThread((t) => t.capabilities.cancel);
  return cancelSupported;
};

const ComposerAction: FC = () => {
  const allowCancel = useAllowCancel();
  if (!allowCancel) return <ComposerSend />;
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerSend />
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerCancel />
      </ThreadPrimitive.If>
    </>
  );
};

ComposerAction.displayName = "ComposerAction";

const ComposerSendButton = withDefaults(TooltipIconButton, {
  variant: "default",
  className: "aui-composer-send",
});

const ComposerSend = forwardRef<
  HTMLButtonElement,
  Partial<TooltipIconButtonProps>
>((props, ref) => {
  const {
    strings: { composer: { send: { tooltip = "Send" } = {} } = {} } = {},
  } = useThreadConfig();
  return (
    <ComposerPrimitive.Send asChild>
      <ComposerSendButton tooltip={tooltip} {...props} ref={ref}>
        {props.children ?? <SendHorizontalIcon />}
      </ComposerSendButton>
    </ComposerPrimitive.Send>
  );
});

ComposerSend.displayName = "ComposerSend";

const ComposerCancelButton = withDefaults(TooltipIconButton, {
  variant: "default",
  className: "aui-composer-cancel",
});

const ComposerCancel = forwardRef<
  HTMLButtonElement,
  Partial<TooltipIconButtonProps>
>((props, ref) => {
  const {
    strings: { composer: { cancel: { tooltip = "Cancel" } = {} } = {} } = {},
  } = useThreadConfig();
  return (
    <ComposerPrimitive.Cancel asChild>
      <ComposerCancelButton tooltip={tooltip} {...props} ref={ref}>
        {props.children ?? <CircleStopIcon />}
      </ComposerCancelButton>
    </ComposerPrimitive.Cancel>
  );
});

ComposerCancel.displayName = "ComposerCancel";

const exports = {
  Root: ComposerRoot,
  Input: ComposerInput,
  Action: ComposerAction,
  Send: ComposerSend,
  Cancel: ComposerCancel,
  AddAttachment: ComposerAddAttachment,
  Attachments: ComposerAttachments,
};

export default Object.assign(Composer, exports) as typeof Composer &
  typeof exports;
