import {
  EdgeRuntimeRequestOptions,
  fromLanguageModelMessages,
} from "@assistant-ui/react";
import { fromOpenAIMessages } from "./openai/fromOpenAIMessages";
import { OpenAI } from "openai";

export const requestOptionsFromOpenAI = (
  params: OpenAI.ChatCompletionCreateParams,
): EdgeRuntimeRequestOptions => {
  const messages = threadMessagesFromOpenAI(params.messages);
  // TODO import remaining options
  return { messages, tools: [] };
};

export const threadMessagesFromOpenAI = (
  messages: OpenAI.ChatCompletionMessageParam[],
) => {
  const lms = fromOpenAIMessages(messages);
  return fromLanguageModelMessages(lms, { mergeRoundtrips: false });
};
