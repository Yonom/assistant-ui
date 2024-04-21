import { Slot } from "@radix-ui/react-slot";
import { FC } from "react";

type MessageContentProps = {
  children: React.ReactNode;
  asChild?: boolean;
};

const MessageContent: FC<MessageContentProps> = ({ asChild, children }) => {
  const Element = asChild ? Slot : "p";

  return <Element>{children}</Element>;
};

type MessageRoleProps = {
  role: "user" | "assistant";
  asChild?: boolean;
};

const MessageAvatar: FC<MessageRoleProps> = ({ asChild, role }) => {
  return "hi";
};
