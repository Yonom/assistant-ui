"use client";
import { Fragment, forwardRef } from "react";
import {
  useChatContext,
  useIsEditingContext,
  useMessageContext,
} from "assistant-ui/src/utils/Context";
import { ComponentPropsWithoutRef, Primitive } from "@radix-ui/react-primitive";

type MessageActionBarPrimitiveElement = React.ElementRef<typeof Primitive.div>;
type PrimitiveButtonProps = ComponentPropsWithoutRef<typeof Primitive.div> & {
  components: {
    Branch?: React.ComponentType<{}>;
    Reload?: React.ComponentType<{}>;
    Copy?: React.ComponentType<{}>;
    EditBegin?: React.ComponentType<{}>;
    EditConfirm?: React.ComponentType<{}>;
    EditCancel?: React.ComponentType<{}>;
  };
};

export const MessageActionBarPrimitive = forwardRef<
  MessageActionBarPrimitiveElement,
  PrimitiveButtonProps
>(
  ({
    components: {
      Branch = Fragment,
      Reload = Fragment,
      Copy = Fragment,
      EditBegin = Fragment,
      EditConfirm = Fragment,
      EditCancel = Fragment,
    },
    ...rest
  }) => {
    const chat = useChatContext();
    const message = useMessageContext();
    const [isEditing] = useIsEditingContext();
    const { branchCount } = chat.getBranchState(message);

    if (isEditing)
      return (
        <Primitive.div {...rest}>
          <EditConfirm />
          <EditCancel />
        </Primitive.div>
      );

    return (
      <Primitive.div {...rest}>
        {branchCount > 1 && <Branch />}
        {message.role === "user" && <EditBegin />}
        {message.role === "assistant" && (
          <>
            <Copy />
            <Reload />
          </>
        )}
      </Primitive.div>
    );
  },
);
