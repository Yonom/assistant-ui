import { INTERNAL, useContentPartText } from "@assistant-ui/react";
import type { FC } from "react";
import ReactMarkdown, { type Options } from "react-markdown";

const { useSmooth } = INTERNAL;

export type MarkdownTextPrimitiveProps = Omit<Options, "children"> & {
  smooth?: boolean;
};

export const MarkdownTextPrimitive: FC<MarkdownTextPrimitiveProps> = ({
  smooth = true,
  ...rest
}) => {
  const {
    part: { text },
  } = useContentPartText();
  const smoothText = useSmooth(text, smooth);
  return <ReactMarkdown {...rest}>{smoothText}</ReactMarkdown>;
};
