import { type FC } from "react";
import { useContentPartContext, useMessageContext } from "../../context";
import { OutPortal } from "../../utils/OutPortal";

export type ContentPartPrimitiveInProgressIndicatorProps = {};

export const ContentPartPrimitiveInProgressIndicator: FC<
  ContentPartPrimitiveInProgressIndicatorProps
> = () => {
  const { useMessageUtils } = useMessageContext();
  const { useContentPart } = useContentPartContext();

  const indicator = useMessageUtils((s) => s.inProgressIndicatorNode);
  const inProgress = useContentPart((c) => c.status === "in_progress");

  return <OutPortal node={indicator} />;
};

ContentPartPrimitiveInProgressIndicator.displayName =
  "ContentPartPrimitive.InProgressIndicator";
