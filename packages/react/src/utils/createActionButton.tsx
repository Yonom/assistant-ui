"use client";

import { composeEventHandlers } from "@radix-ui/primitive";
import { Primitive } from "@radix-ui/react-primitive";
import { type ElementRef, forwardRef, ComponentPropsWithoutRef } from "react";

type ActionButtonCallback<TProps> = (props: TProps) => null | (() => void);

type PrimitiveButtonElement = ElementRef<typeof Primitive.button>;
type PrimitiveButtonProps = ComponentPropsWithoutRef<typeof Primitive.button>;

export type ActionButtonProps<THook> = PrimitiveButtonProps &
  (THook extends (props: infer TProps) => unknown ? TProps : never);

export const createActionButton = <TProps,>(
  displayName: string,
  useActionButton: ActionButtonCallback<TProps>,
) => {
  const ActionButton = forwardRef<
    PrimitiveButtonElement,
    PrimitiveButtonProps & TProps
  >((props, forwardedRef) => {
    const callback = useActionButton(props);

    return (
      <Primitive.button
        type="button"
        disabled={!callback}
        {...props}
        ref={forwardedRef}
        onClick={composeEventHandlers(props.onClick, () => {
          callback?.();
        })}
      />
    );
  });

  ActionButton.displayName = displayName;

  return ActionButton;
};
