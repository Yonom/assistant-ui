import { ComponentPropsWithoutRef, ComponentType, FC, useContext } from "react";
import { PreContext } from "./PreOverride";
import {
  CodeComponent,
  CodeHeaderProps,
  PreComponent,
  SyntaxHighlighterProps,
} from "./types";
import { DefaultCodeBlock } from "./CodeBlock";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { withDefaultProps } from "./withDefaults";
import { DefaultCodeBlockContent } from "./defaultComponents";

const CodeBlockOverride: FC<CodeOverrideProps> = ({
  components: {
    Pre,
    Code,
    SyntaxHighlighter: FallbackSyntaxHighlighter,
    CodeHeader: FallbackCodeHeader,
  },
  componentsByLanguage = {},
  children,
  node,
  ...codeProps
}) => {
  const preProps = useContext(PreContext)!;
  const getPreProps = withDefaultProps<any>(preProps);
  const WrappedPre: PreComponent = useCallbackRef((props) => (
    <Pre {...getPreProps(props)} />
  ));

  const getCodeProps = withDefaultProps<any>(codeProps);
  const WrappedCode: CodeComponent = useCallbackRef((props) => (
    <Code {...getCodeProps(props)} />
  ));

  const language = /language-(\w+)/.exec(codeProps.className || "")?.[1] ?? "";

  // if the code content is not string (due to rehype plugins), return a default code block
  if (typeof children !== "string") {
    return (
      <DefaultCodeBlockContent
        components={{ Pre: WrappedPre, Code: WrappedCode }}
        code={children}
        node={node}
      />
    );
  }

  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps> =
    componentsByLanguage[language]?.SyntaxHighlighter ??
    FallbackSyntaxHighlighter;

  const CodeHeader: ComponentType<CodeHeaderProps> =
    componentsByLanguage[language]?.CodeHeader ?? FallbackCodeHeader;

  return (
    <DefaultCodeBlock
      components={{
        Pre: WrappedPre,
        Code: WrappedCode,
        SyntaxHighlighter,
        CodeHeader,
      }}
      language={language || "unknown"}
      code={children}
      node={node}
    />
  );
};

export type CodeOverrideProps = ComponentPropsWithoutRef<CodeComponent> & {
  components: {
    Pre: PreComponent;
    Code: CodeComponent;
    CodeHeader: ComponentType<CodeHeaderProps>;
    SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  };
  componentsByLanguage?:
    | Record<
        string,
        {
          CodeHeader?: ComponentType<CodeHeaderProps>;
          SyntaxHighlighter?: ComponentType<SyntaxHighlighterProps>;
        }
      >
    | undefined;
};

export const CodeOverride: FC<CodeOverrideProps> = ({
  components,
  componentsByLanguage,
  ...props
}) => {
  const preProps = useContext(PreContext);
  if (!preProps) return <components.Code {...props} />;
  return (
    <CodeBlockOverride
      components={components}
      componentsByLanguage={componentsByLanguage}
      {...props}
    />
  );
};
