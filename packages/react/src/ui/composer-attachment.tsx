"use client";

import { forwardRef, type FC } from "react";

import { CircleXIcon } from "lucide-react";
import { withDefaults } from "./utils/withDefaults";
import { useThreadConfig } from "./thread-config";
import {
  TooltipIconButton,
  TooltipIconButtonProps,
} from "./base/tooltip-icon-button";
import { useThreadComposerStore } from "../context/react/ThreadContext";
import {
  useAttachmentStore,
  useComposerAttachment,
} from "../context/react/AttachmentContext";

const ComposerAttachmentRoot = withDefaults("div", {
  className: "aui-composer-attachment-root",
});

ComposerAttachmentRoot.displayName = "ComposerAttachmentRoot";

const ComposerAttachment: FC = () => {
  const attachment = useComposerAttachment((a) => a.attachment);

  return (
    <ComposerAttachmentRoot>
      .{attachment.name.split(".").pop()}
      <ComposerAttachmentRemove />
    </ComposerAttachmentRoot>
  );
};

ComposerAttachment.displayName = "ComposerAttachment";

const ComposerAttachmentRemove = forwardRef<
  HTMLButtonElement,
  Partial<TooltipIconButtonProps>
>((props, ref) => {
  const {
    strings: {
      composer: { removeAttachment: { tooltip = "Remove file" } = {} } = {},
    } = {},
  } = useThreadConfig();

  const composerStore = useThreadComposerStore();
  const attachmentStore = useAttachmentStore();
  const handleRemoveAttachment = () => {
    composerStore
      .getState()
      .removeAttachment(attachmentStore.getState().attachment.id);
  };

  return (
    <TooltipIconButton
      tooltip={tooltip}
      className="aui-composer-attachment-remove"
      side="top"
      {...props}
      onClick={handleRemoveAttachment}
      ref={ref}
    >
      {props.children ?? <CircleXIcon />}
    </TooltipIconButton>
  );
});

ComposerAttachmentRemove.displayName = "ComposerAttachmentRemove";

const exports = {
  Root: ComposerAttachmentRoot,
  Remove: ComposerAttachmentRemove,
};

export default Object.assign(
  ComposerAttachment,
  exports,
) as typeof ComposerAttachment & typeof exports;
