import { ComponentType, PropsWithChildren } from "react";

export type SyntaxHighlighterProps = {
  components: {
    Pre: ComponentType<PropsWithChildren>;
    Code: ComponentType<PropsWithChildren>;
  };
  language: string;
  code: string;
};

export const DefaultSyntaxHighlighter: ComponentType<
  SyntaxHighlighterProps
> = ({ components: { Pre, Code }, code }) => (
  <Pre>
    <Code>{code}</Code>
  </Pre>
);
