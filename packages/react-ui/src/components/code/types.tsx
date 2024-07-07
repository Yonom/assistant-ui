import { MarkdownTextPrimitiveProps } from "../../../../react-markdown/src";

export type PreComponent = NonNullable<
  NonNullable<MarkdownTextPrimitiveProps["components"]>["pre"]
>;
export type CodeComponent = NonNullable<
  NonNullable<MarkdownTextPrimitiveProps["components"]>["code"]
>;
