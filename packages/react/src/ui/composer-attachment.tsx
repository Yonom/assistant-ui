"use client";

import { forwardRef, type FC } from "react";
import { CircleXIcon } from "lucide-react";
import { withDefaults } from "./utils/withDefaults";
import { useThreadConfig } from "./thread-config";
import {
  TooltipIconButton,
  TooltipIconButtonProps,
} from "./base/tooltip-icon-button";
import { AttachmentPrimitive } from "../primitives";

const ComposerAttachmentRoot = withDefaults(AttachmentPrimitive.Root, {
  className: "aui-composer-attachment-root",
});

ComposerAttachmentRoot.displayName = "ComposerAttachmentRoot";

const ComposerAttachment: FC = () => {
  return (
    <ComposerAttachmentRoot>
      <AttachmentPrimitive.unstable_Thumb />
      <ComposerAttachmentRemove />
    </ComposerAttachmentRoot>
  );
};

ComposerAttachment.displayName = "ComposerAttachment";

namespace ComposerAttachmentRemove {
  export type Element = HTMLButtonElement;
  export type Props = Partial<TooltipIconButtonProps>;
}

const ComposerAttachmentRemove = forwardRef<
  ComposerAttachmentRemove.Element,
  ComposerAttachmentRemove.Props
>((props, ref) => {
  const {
    strings: {
      composer: { removeAttachment: { tooltip = "Remove file" } = {} } = {},
    } = {},
  } = useThreadConfig();

  return (
    <AttachmentPrimitive.Remove asChild>
      <TooltipIconButton
        tooltip={tooltip}
        className="aui-composer-attachment-remove"
        side="top"
        {...props}
        ref={ref}
      >
        {props.children ?? <CircleXIcon />}
      </TooltipIconButton>
    </AttachmentPrimitive.Remove>
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
