import { ComponentType, useContext, useMemo } from "react";
import { CodeComponent, PreComponent } from "./types";
import { Slot } from "@radix-ui/react-slot";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { CodeHeaderProps } from "./code-header";
import {
  SyntaxHighlighterProps,
  DefaultSyntaxHighlighter,
} from "./syntax-highlighter";
import { PreContext } from "./pre";

type MakeMarkdownCodeProps = {
  components: {
    pre: PreComponent;
    code: CodeComponent;
    CodeHeader: ComponentType<CodeHeaderProps>;
    SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  };
};

export const makeMarkdownCode = ({
  components: {
    pre: PreComponent,
    code: CodeComponent,
    SyntaxHighlighter,
    CodeHeader,
  },
}: MakeMarkdownCodeProps): CodeComponent => {
  const MarkdownCodeBlock: CodeComponent = ({ children, ...codeProps }) => {
    const preProps = useContext(PreContext);
    const Pre = useCallbackRef((props) => (
      <Slot {...(preProps as any)}>
        <PreComponent {...props} />
      </Slot>
    ));
    const Code = useCallbackRef((props) => (
      <Slot {...(codeProps as any)}>
        <CodeComponent {...props} />
      </Slot>
    ));

    const components = useMemo(() => ({ Pre, Code }), [Pre, Code]);

    const language = /language-(\w+)/.exec(codeProps.className || "")?.[1];
    const code = children as string;
    const SH = language ? SyntaxHighlighter : DefaultSyntaxHighlighter;

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

  const MarkdownCode: CodeComponent = (props) => {
    const preProps = useContext(PreContext);
    if (!preProps) return <CodeComponent {...(props as any)} />;
    return <MarkdownCodeBlock {...props} />;
  };

  return MarkdownCode;
};
