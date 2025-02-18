"use client";

import { INTERNAL, useContentPartText } from "@assistant-ui/react";
import {
  ComponentRef,
  ElementType,
  FC,
  forwardRef,
  ForwardRefExoticComponent,
  RefAttributes,
  useMemo,
  type ComponentPropsWithoutRef,
  type ComponentType,
} from "react";
import ReactMarkdown, { type Options } from "react-markdown";
import { SyntaxHighlighterProps, CodeHeaderProps } from "../overrides/types";
import { PreOverride } from "../overrides/PreOverride";
import {
  DefaultPre,
  DefaultCode,
  DefaultCodeBlockContent,
  DefaultCodeHeader,
} from "../overrides/defaultComponents";
import { useCallbackRef } from "@radix-ui/react-use-callback-ref";
import { CodeOverride } from "../overrides/CodeOverride";
import { Primitive } from "@radix-ui/react-primitive";
import classNames from "classnames";

const { useSmooth, useSmoothStatus, withSmoothContextProvider } = INTERNAL;

type MarkdownTextPrimitiveElement = ComponentRef<typeof Primitive.div>;
type PrimitiveDivProps = ComponentPropsWithoutRef<typeof Primitive.div>;

export type MarkdownTextPrimitiveProps = Omit<
  Options,
  "components" | "children"
> & {
  containerProps?: Omit<PrimitiveDivProps, "children" | "asChild"> | undefined;
  containerComponent?: ElementType | undefined;
  components?:
    | (NonNullable<Options["components"]> & {
        SyntaxHighlighter?: ComponentType<SyntaxHighlighterProps> | undefined;
        CodeHeader?: ComponentType<CodeHeaderProps> | undefined;
        /**
         * @deprecated Use `componentsByLanguage` instead of `components.by_language`. This will be removed in the next major version.
         **/
        by_language?: undefined;
      })
    | undefined;
  componentsByLanguage?:
    | Record<
        string,
        {
          CodeHeader?: ComponentType<CodeHeaderProps> | undefined;
          SyntaxHighlighter?: ComponentType<SyntaxHighlighterProps> | undefined;
        }
      >
    | undefined;
  smooth?: boolean | undefined;
};

const MarkdownTextInner: FC<MarkdownTextPrimitiveProps> = ({
  components: userComponents,
  componentsByLanguage = userComponents?.by_language,
  smooth = true,
  ...rest
}) => {
  const { text } = useSmooth(useContentPartText(), smooth);

  const {
    pre = DefaultPre,
    code = DefaultCode,
    SyntaxHighlighter = DefaultCodeBlockContent,
    CodeHeader = DefaultCodeHeader,
  } = userComponents ?? {};
  const useCodeOverrideComponents = useMemo(() => {
    return {
      Pre: pre,
      Code: code,
      SyntaxHighlighter,
      CodeHeader,
    };
  }, [pre, code, SyntaxHighlighter, CodeHeader]);
  const CodeComponent = useCallbackRef((props) => (
    <CodeOverride
      components={useCodeOverrideComponents}
      componentsByLanguage={componentsByLanguage}
      {...props}
    />
  ));

  const components: Options["components"] = useMemo(() => {
    const {
      pre = DefaultPre,
      code = DefaultCode,
      SyntaxHighlighter = DefaultCodeBlockContent,
      CodeHeader = DefaultCodeHeader,
      by_language,
      ...componentsRest
    } = userComponents ?? {};
    return {
      ...componentsRest,
      pre: PreOverride,
      code: CodeComponent,
    };
  }, [CodeComponent, userComponents, componentsByLanguage]);

  return (
    <ReactMarkdown components={components} {...rest}>
      {text}
    </ReactMarkdown>
  );
};

const MarkdownTextPrimitiveImpl: ForwardRefExoticComponent<MarkdownTextPrimitiveProps> &
  RefAttributes<MarkdownTextPrimitiveElement> = forwardRef<
  MarkdownTextPrimitiveElement,
  MarkdownTextPrimitiveProps
>(
  (
    {
      className,
      containerProps,
      containerComponent: Container = "div",
      ...rest
    },
    forwardedRef,
  ) => {
    const status = useSmoothStatus();
    return (
      <Container
        data-status={status.type}
        {...containerProps}
        className={classNames(className, containerProps?.className)}
        ref={forwardedRef}
      >
        <MarkdownTextInner {...rest}></MarkdownTextInner>
      </Container>
    );
  },
);

MarkdownTextPrimitiveImpl.displayName = "MarkdownTextPrimitive";

export const MarkdownTextPrimitive = withSmoothContextProvider(
  MarkdownTextPrimitiveImpl,
);
