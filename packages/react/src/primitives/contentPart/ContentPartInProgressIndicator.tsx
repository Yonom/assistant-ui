import type { FC } from "react";
import { useContentPartContext } from "../../utils/context/ContentPartContext";
import { useMessageContext } from "../../utils/context/MessageContext";
import { useCombinedStore } from "../../utils/context/combined/useCombinedStore";

export const ContentPartInProgressIndicator: FC = () => {
  const { useMessage } = useMessageContext();
  const { useContentPart } = useContentPartContext();

  const indicator = useCombinedStore([useMessage, useContentPart], (m, c) =>
    c.status === "in_progress" ? m.inProgressIndicator : null,
  );
  return indicator;
};
