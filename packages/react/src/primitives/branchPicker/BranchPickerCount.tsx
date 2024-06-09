"use client";

import type { FC } from "react";
import { useMessageContext } from "../../utils/context/MessageContext";

export const BranchPickerCount: FC = () => {
  const { useMessage } = useMessageContext();
  const branchCount = useMessage((s) => s.branches.length);
  return <>{branchCount}</>;
};
