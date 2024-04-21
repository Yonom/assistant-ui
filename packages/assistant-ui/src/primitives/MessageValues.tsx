"use client";
import {
  useChatContext,
  useMessageContext,
} from "assistant-ui/src/utils/Context";

export const BranchNumberValue = () => {
  const chat = useChatContext();
  const message = useMessageContext();
  const { branchId } = chat.getBranchState(message);
  return <>{branchId + 1}</>;
};
export const BranchCountValue = () => {
  const chat = useChatContext();
  const message = useMessageContext();
  const { branchCount } = chat.getBranchState(message);
  return <>{branchCount}</>;
};
export const MessageContentValue = () => {
  const message = useMessageContext();
  return <>{message.content}</>;
};
