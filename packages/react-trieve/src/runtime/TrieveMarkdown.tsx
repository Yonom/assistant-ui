"use client";

import {
  getExternalStoreMessage,
  TextContentPartProvider,
  useContentPartText,
  useMessage,
} from "@assistant-ui/react";
import {
  makeMarkdownText,
  MarkdownTextPrimitiveProps,
} from "@assistant-ui/react-markdown";
import { visit, SKIP } from "unist-util-visit";
import remarkGfm from "remark-gfm";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { TrieveMessage } from "../trieve/TrieveMessage";
import { Root } from "mdast";

function removeFootnoteDefinitions() {
  return (tree: Root) => {
    visit(tree, "footnoteDefinition", (_, index, parent) => {
      if (parent && index !== undefined) {
        parent.children.splice(index, 1);
        return [SKIP, index];
      }
      return undefined;
    });
  };
}

const Citation = ({ node, ...rest }: { node?: any }) => {
  const assistantUiMessage = useMessage();

  const indexString = node.children[0].children[0].value;
  let index;
  try {
    index = parseInt(indexString.replace(/[^0-9]/g, ""), 10);
  } catch {
    return <sup {...rest} />;
  }

  const message = getExternalStoreMessage<TrieveMessage>(assistantUiMessage);
  const citation = message?.citations?.[index];

  if (citation === undefined) return <sup {...rest} />;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <sup {...rest} />
      </HoverCardTrigger>
      <HoverCardContent>
        <h3 className="font-bold">
          <a href={citation.link ?? undefined}>
            {(citation.metadata as any)?.title ??
              (citation.metadata as any)?.parent_title}
          </a>
        </h3>
        <p className="font-sm pb-4 italic">
          by {(citation.metadata as any)?.by}
        </p>
        <p>{citation.chunk_html}</p>
      </HoverCardContent>
    </HoverCard>
  );
};

function generateDummyCitations(citationCount: number) {
  return Array.from(
    { length: citationCount },
    (_, i) => `\n[^${i}]: dummy`,
  ).join("");
}

export const makeTrieveMarkdownText = (
  options?: MarkdownTextPrimitiveProps,
) => {
  const MarkdownText = makeMarkdownText({
    ...options,
    remarkPlugins: [
      remarkGfm,
      removeFootnoteDefinitions,
      {
        plugins: options?.remarkPlugins ?? [],
      },
    ],

    components: {
      sup: Citation,
      ...options?.components,
    },
  });

  const MarkdownTextWithFootnotes = () => {
    const message = useMessage();
    const citationCount =
      getExternalStoreMessage<TrieveMessage>(message)?.citations?.length ?? 0;

    const { text, status } = useContentPartText();
    const appendText = "\n\n" + generateDummyCitations(citationCount);
    return (
      <TextContentPartProvider
        text={text + appendText}
        isRunning={status.type === "running"}
      >
        <MarkdownText />
      </TextContentPartProvider>
    );
  };

  return MarkdownTextWithFootnotes;
};
