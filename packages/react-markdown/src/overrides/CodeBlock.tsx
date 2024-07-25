import { ComponentType, FC, useMemo } from "react";

import {
  CodeComponent,
  CodeHeaderProps,
  PreComponent,
  SyntaxHighlighterProps,
} from "./types";
import { DefaultCodeBlockContent } from "./defaultComponents";

export type CodeBlockProps = {
  language: string;
  code: string;
  components: {
    Pre: PreComponent;
    Code: CodeComponent;
    CodeHeader: ComponentType<CodeHeaderProps>;
    SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  };
};

export const DefaultCodeBlock: FC<CodeBlockProps> = ({
  components: { Pre, Code, SyntaxHighlighter, CodeHeader },
  language,
  code,
}) => {
  const components = useMemo(() => ({ Pre, Code }), [Pre, Code]);

  const SH = !!language ? SyntaxHighlighter : DefaultCodeBlockContent;

  return (
    <>
      <CodeHeader language={language} code={code} />
      <SH
        components={components}
        language={language ?? "unknown"}
        code={code}
      />
    </>
  );
};
