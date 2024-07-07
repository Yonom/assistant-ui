import { MarkdownTextPrimitive } from "@assistant-ui/react-markdown";
import { ComponentType, FC, memo } from "react";
import { MarkdownTextPrimitiveProps } from "@assistant-ui/react-markdown";
import { TextContentPartProps } from "@assistant-ui/react";
import { PreComponent, CodeComponent } from "./code/types";
import { makeMarkdownCode } from "./code/code";
import { MarkdownPre } from "./code/pre";
import {
  DefaultSyntaxHighlighter,
  SyntaxHighlighterProps,
} from "./code/syntax-highlighter";
import {
  CodeHeaderProps,
  CodeHeader as DefaultCodeHeader,
} from "./code/code-header";

type MakeMarkdownTextProps = Omit<
  Partial<MarkdownTextPrimitiveProps>,
  "components"
> & {
  components?: NonNullable<MarkdownTextPrimitiveProps["components"]> & {
    SyntaxHighlighter?: ComponentType<SyntaxHighlighterProps>;
    CodeHeader?: ComponentType<CodeHeaderProps>;
  };
};

const DefaultPre: PreComponent = ({ node, ...rest }) => <pre {...rest} />;
const DefaultCode: CodeComponent = ({ node, ...rest }) => <code {...rest} />;

export const makeMarkdownText = ({
  className,
  components: userComponents,
  ...rest
}: MakeMarkdownTextProps = {}) => {
  const {
    pre = DefaultPre,
    code = DefaultCode,
    SyntaxHighlighter = DefaultSyntaxHighlighter,
    CodeHeader = DefaultCodeHeader,
    ...componentsRest
  } = userComponents ?? {};
  const components: typeof userComponents = {
    ...componentsRest,
    pre: MarkdownPre,
    code: makeMarkdownCode({
      components: { pre, code, SyntaxHighlighter, CodeHeader },
    }) as any,
  };

  const MarkdownTextImpl: FC<TextContentPartProps> = ({ status }) => {
    return (
      <div
        className={
          "aui-md-root" +
          (status === "in_progress" ? " aui-md-in-progress" : "") +
          (!!className ? " " + className : "")
        }
      >
        <MarkdownTextPrimitive components={components} {...rest} />
      </div>
    );
  };
  MarkdownTextImpl.displayName = "MarkdownText";

  return memo(MarkdownTextImpl, (prev, next) => prev.status === next.status);
};
