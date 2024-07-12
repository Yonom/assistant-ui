"use client";

import { type FC, forwardRef } from "react";
import { BotIcon, ChevronDownIcon } from "lucide-react";

import {
  AssistantModalPrimitive,
  AssistantModalPrimitiveRootProps,
} from "../primitives";
import Thread from "./thread";
import { withDefaults } from "./utils/withDefaults";
import {
  TooltipIconButton,
  TooltipIconButtonProps,
} from "./base/tooltip-icon-button";
import {
  ThreadConfig,
  ThreadConfigProvider,
  ThreadConfigProviderProps,
  useThreadConfig,
} from "./thread-config";

const AssistantModal: FC<ThreadConfig> = (config) => {
  return (
    <AssistantModalRoot config={config}>
      <AssistantModalTrigger />
      <AssistantModalContent>
        <Thread />
      </AssistantModalContent>
    </AssistantModalRoot>
  );
};

AssistantModal.displayName = "AssistantModal";

const AssistantModalRoot: FC<
  AssistantModalPrimitiveRootProps & ThreadConfigProviderProps
> = ({ config, ...props }) => {
  return (
    <ThreadConfigProvider config={config}>
      <AssistantModalPrimitive.Root {...props} />
    </ThreadConfigProvider>
  );
};

AssistantModalRoot.displayName = "AssistantModalRoot";

const AssistantModalTrigger = forwardRef<
  HTMLButtonElement,
  Partial<TooltipIconButtonProps>
>((props, ref) => {
  return (
    <AssistantModalAnchor>
      <AssistantModalPrimitive.Trigger asChild>
        <AssistantModalButton {...props} ref={ref} />
      </AssistantModalPrimitive.Trigger>
    </AssistantModalAnchor>
  );
});

AssistantModalTrigger.displayName = "AssistantModalTrigger";

const AssistantModalAnchor = withDefaults(AssistantModalPrimitive.Anchor, {
  className: "aui-root aui-modal-anchor",
});

AssistantModalAnchor.displayName = "AssistantModalAnchor";

const ModalButtonStyled = withDefaults(TooltipIconButton, {
  variant: "default",
  className: "aui-modal-button",
});

type AssistantModalButtonProps = TooltipIconButtonProps & {
  "data-state"?: "open" | "closed";
};

const AssistantModalButton = forwardRef<
  HTMLButtonElement,
  Partial<AssistantModalButtonProps>
>(({ "data-state": state, ...rest }, ref) => {
  const {
    strings: {
      assistantModal: {
        open: {
          button: { tooltip: openTooltip = "Close Assistant" } = {},
        } = {},
        closed: {
          button: { tooltip: closedTooltip = "Open Assistant" } = {},
        } = {},
      } = {},
    } = {},
  } = useThreadConfig();
  const tooltip = state === "open" ? openTooltip : closedTooltip;

  return (
    <ModalButtonStyled
      side="left"
      tooltip={tooltip}
      data-state={state}
      {...rest}
      ref={ref}
    >
      {rest.children ?? (
        <>
          <BotIcon
            data-state={state}
            className="aui-modal-button-closed-icon"
          />
          <ChevronDownIcon
            data-state={state}
            className="aui-modal-button-open-icon"
          />
        </>
      )}
    </ModalButtonStyled>
  );
});

AssistantModalButton.displayName = "AssistantModalButton";

const AssistantModalContent = withDefaults(AssistantModalPrimitive.Content, {
  className: "aui-root aui-modal-content",
  sideOffset: 16,
});

AssistantModalContent.displayName = "AssistantModalContent";

const exports = {
  Root: AssistantModalRoot,
  Trigger: AssistantModalTrigger,
  Content: AssistantModalContent,
};

export default Object.assign(AssistantModal, exports) as typeof AssistantModal &
  typeof exports;
