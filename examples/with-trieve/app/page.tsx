"use client";

import { AssistantRuntimeProvider, Thread } from "@assistant-ui/react";
import {
  makeTrieveMarkdownText,
  useTrieveExtras,
  useTrieveRuntime,
} from "@assistant-ui/react-trieve";
import { TrieveSDK } from "trieve-ts-sdk";

const TrieveMarkdownText = makeTrieveMarkdownText();

const trieve = new TrieveSDK({
  baseUrl: process.env["NEXT_PUBLIC_TRIEVE_API_URL"]!,
  apiKey: process.env["NEXT_PUBLIC_TRIEVE_API_KEY"]!,
  datasetId: process.env["NEXT_PUBLIC_TRIEVE_DATASET_ID"]!,
});

const RuntimeProvider = () => {
  const runtime = useTrieveRuntime({
    trieve,
    ownerId: "abcd",
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <MyAssistant />
    </AssistantRuntimeProvider>
  );
};

export default RuntimeProvider;

function MyAssistant() {
  const { title, suggestions } = useTrieveExtras();

  return (
    <div className="flex h-full flex-col pt-8">
      <p className="text-center text-xl font-bold">{title}</p>
      <Thread
        welcome={{
          suggestions: suggestions.slice(0, 3).map((s) => ({
            prompt: s,
          })),
        }}
        assistantMessage={{ components: { Text: TrieveMarkdownText } }}
      />
    </div>
  );
}
