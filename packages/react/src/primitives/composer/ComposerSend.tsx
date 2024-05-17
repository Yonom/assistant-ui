"use client";

import {
  type ComponentPropsWithoutRef,
  Primitive,
} from "@radix-ui/react-primitive";
import { forwardRef } from "react";
import { useUseComposer } from "../../utils/context/ComposerState";

type ComposerSendElement = React.ElementRef<typeof Primitive.button>;
type PrimitiveFormProps = ComponentPropsWithoutRef<typeof Primitive.button>;

type ComposerSendProps = PrimitiveFormProps;

export const ComposerSend = forwardRef<ComposerSendElement, ComposerSendProps>(
  ({ disabled, ...rest }, ref) => {
    const hasValue = useUseComposer()((c) => c.isEditing && c.value.length > 0);

    return (
      <Primitive.button
        type="submit"
        {...rest}
        ref={ref}
        disabled={disabled || !hasValue}
      />
    );
  },
);
