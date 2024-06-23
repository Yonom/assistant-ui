// @ts-nocheck

import {
  Anthropic,
  GEMINI_EMBEDDING_MODEL,
  GEMINI_MODEL,
  Gemini,
  GeminiEmbedding,
  Groq,
  OpenAI,
  OpenAIEmbedding,
  Settings,
} from "llamaindex";
import { HuggingFaceEmbedding } from "llamaindex/embeddings/HuggingFaceEmbedding";
import { OllamaEmbedding } from "llamaindex/embeddings/OllamaEmbedding";
import { ALL_AVAILABLE_ANTHROPIC_MODELS } from "llamaindex/llm/anthropic";
import { Ollama } from "llamaindex/llm/ollama";

const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 20;

export const initSettings = async () => {
  // HINT: you can delete the initialization code for unused model providers
  console.log(`Using '${process.env.MODEL_PROVIDER}' model provider`);

  if (!process.env.MODEL || !process.env.EMBEDDING_MODEL) {
    throw new Error("'MODEL' and 'EMBEDDING_MODEL' env variables must be set.");
  }

  switch (process.env.MODEL_PROVIDER) {
    case "ollama":
      initOllama();
      break;
    case "groq":
      initGroq();
      break;
    case "anthropic":
      initAnthropic();
      break;
    case "gemini":
      initGemini();
      break;
    default:
      initOpenAI();
      break;
  }
  Settings.chunkSize = CHUNK_SIZE;
  Settings.chunkOverlap = CHUNK_OVERLAP;
};

function initOpenAI() {
  Settings.llm = new OpenAI({
    model: process.env.MODEL ?? "gpt-3.5-turbo",
    maxTokens: process.env.LLM_MAX_TOKENS
      ? Number(process.env.LLM_MAX_TOKENS)
      : undefined,
  });
  Settings.embedModel = new OpenAIEmbedding({
    model: process.env.EMBEDDING_MODEL,
    dimensions: process.env.EMBEDDING_DIM
      ? parseInt(process.env.EMBEDDING_DIM)
      : undefined,
  });
}

function initOllama() {
  const config = {
    host: process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  };
  Settings.llm = new Ollama({
    model: process.env.MODEL ?? "",
    config,
  });
  Settings.embedModel = new OllamaEmbedding({
    model: process.env.EMBEDDING_MODEL ?? "",
    config,
  });
}

function initGroq() {
  const embedModelMap: Record<string, string> = {
    "all-MiniLM-L6-v2": "Xenova/all-MiniLM-L6-v2",
    "all-mpnet-base-v2": "Xenova/all-mpnet-base-v2",
  };

  const modelMap: Record<string, string> = {
    "llama3-8b": "llama3-8b-8192",
    "llama3-70b": "llama3-70b-8192",
    "mixtral-8x7b": "mixtral-8x7b-32768",
  };

  Settings.llm = new Groq({
    model: modelMap[process.env.MODEL!],
  });

  Settings.embedModel = new HuggingFaceEmbedding({
    modelType: embedModelMap[process.env.EMBEDDING_MODEL!],
  });
}

function initAnthropic() {
  const embedModelMap: Record<string, string> = {
    "all-MiniLM-L6-v2": "Xenova/all-MiniLM-L6-v2",
    "all-mpnet-base-v2": "Xenova/all-mpnet-base-v2",
  };
  Settings.llm = new Anthropic({
    model: process.env.MODEL as keyof typeof ALL_AVAILABLE_ANTHROPIC_MODELS,
  });
  Settings.embedModel = new HuggingFaceEmbedding({
    modelType: embedModelMap[process.env.EMBEDDING_MODEL!],
  });
}

function initGemini() {
  Settings.llm = new Gemini({
    model: process.env.MODEL as GEMINI_MODEL,
  });
  Settings.embedModel = new GeminiEmbedding({
    model: process.env.EMBEDDING_MODEL as GEMINI_EMBEDDING_MODEL,
  });
}
