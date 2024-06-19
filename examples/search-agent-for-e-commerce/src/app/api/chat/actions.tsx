"use server";

import React, { useEffect } from 'react';
import { openai } from "@ai-sdk/openai";
import { createAI, getMutableAIState, streamUI } from "ai/rsc";
import { nanoid } from "nanoid";
import type { ReactNode } from "react";
import { z } from "zod";
import {CarouselPlugin} from '../../../components/ui/productcarousel'; 
import fs from 'fs';
import path from 'path';
import { streamText } from 'ai';

export interface ServerMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}

export async function continueConversation(
  input: string, indexId: string,
): Promise<ClientMessage> {
  "use server";

  const history = getMutableAIState();

  const result = await streamUI({
    model: openai("gpt-3.5-turbo"),
    temperature: 0,
    system: `\
    You are a friendly assistant that helps the user with shopping on a ecommerce website ('uncle-reco'). You help users with end-to-end shopping experience
    starting from general information about the brands and products, and helping with product discovery, search, and product details, as well as
    product purchase, customer support, fitting questions, technical questions.
    Your responses are solely based on the provided context about the store and its products.
    Right now, the user clicked on the AI assistant widget and your job is to determine their intent.
    The user intent migth not be clear, in this case you ask clarifications questions.
    The user quesiton might not be complete, in this case you ask for follow up questions.
      
    Here's a list of user intents to pick from: 
    - Product search
    - Guideline for clothes fitting
    - Product specific questions
    - Customer support questions (e.g. track purchase, payment issues, order issues)
    - Escalate to human agent
    - Ask a clarification/follow up question
    - Product comparison
    - Promotions, hot deals
    `,
    messages: [...history.get(), { role: "user", content: input, indexId }],
    text: ({ content, done }) => {
      if (done) {
        history.done((messages: ServerMessage[]) => [
          ...messages,
          { role: "assistant", content },
        ]);
      }
      return <div>{content}</div>;
    },
    // toolChoice: 'required', // force the model to call a tool
    // maxToolRoundtrips: 5, // allow up to 5 tool roundtrips
    tools: {
      product_search: {
        description:
          "Search for products on this website using pre-built indeces",
        parameters: z.object({
          query: z.string().describe("A clear factual product query, potentially including type, name, qualities, characteristics of the product"),
        }),
        generate: async ({ query }) => {
          const controller = new AbortController();
          history.done((messages: ServerMessage[]) => [
            ...messages,
            {
              role: "assistant",
              content: `Searcing for ${query}`,
            },
          ]);
          try {
            console.log('Fetching session ID...');
            const controller = new AbortController();
            const sessionResponse = await fetch(`${process.env.NEXT_PUBLIC_VITE_CLIENT_URL}/sessions/getSession?indexID=${indexId}`, {
              method: 'GET',
              headers: { 'accept': 'application/json' },
              signal: controller.signal
            });
            console.log('Session response status:', sessionResponse.status);
            if (!sessionResponse.ok) {
              throw new Error(`Failed to fetch session ID: ${sessionResponse.statusText}`);
            }
            const sessionData = await sessionResponse.json();
            const sessionID = sessionData.sessionID;
            console.log('Session ID:', sessionID);

            const timeout = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
            console.log('Starting product search, ID: ', indexId);
            const searchResponse = await Promise.race([
              fetch(`${process.env.NEXT_PUBLIC_VITE_CLIENT_URL}/search`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'accept': 'application/json'
                },
                body: JSON.stringify({
                  query: query,
                  indexID: indexId,
                  sessionID: sessionID,
                  top_k: 12,
                  loc: 0
                })
              }),
              timeout(25000)
            ]);
    
            if (searchResponse instanceof Response) {
              const data = await searchResponse.json();
              console.log('Search results:', data);
              if (data.results && data.results.length > 0) {
                return <CarouselPlugin products={data.results} />;
              } else {
                return <p>No products found.</p>;
              }
            } else {
              throw new Error('Unexpected response type');
            }
            } catch (error) {
              if (error instanceof Error && error.message === 'Request timed out') {
                return <p>Sorry, we are experiencing some technical difficulties, please try again later.</p>;
              } else {
                return <p>Sorry, we are experiencing some error. Please refresh the chat and try again.</p>;
              }
            }
        },
      },
      general_question: {
        description: "User questions not related to products directly",
        parameters: z.object({
          user_question: z.string().describe('User questions not related to products directly'),
        }),
        generate: async function* ({ user_question }) {
          const filePath = path.resolve(process.cwd(), 'public/unclereco_info.txt');
          const generalInfo = fs.readFileSync(filePath, 'utf-8');    
          const result = await streamText({
            model: openai('gpt-3.5-turbo'),
            temperature: 0,
            prompt: `Generate response to user question ${user_question} based on the context ${generalInfo}`,
          });
          let textContent = '';

          for await (const textPart of result.textStream) {
            textContent += textPart;
            yield textContent;
          }
          return textContent;
        },
      },
      clothes_fitting: {
        description:
          "Send to user link to guidelines for clothes fitting https://www.unclereco.com/catalog/size_chart.php",
        parameters: z.object({}),
        generate: async ({}) => {
          const fittingGuidelinesLink = "https://www.unclereco.com/catalog/size_chart.php";
          const formattedLink = `<a href="${fittingGuidelinesLink}" target="_blank">Guidelines for clothes fitting</a>`;
          const linkStyle = {
            color: 'blue',
            textDecoration: 'underline'
          };
          history.done((messages: ServerMessage[]) => [
            ...messages,
            {
              role: "assistant",
              content: formattedLink,
            },
          ]);
    
          return (
            <a href={fittingGuidelinesLink} target="_blank" style={linkStyle}>
              Guidelines for clothes fitting
            </a>
          );        },
      },
      escalate: {
        description:
          "Escalate to human agent if none of the other tools seem relevant or the interaction is repetative, or if the user is getting upset",
        parameters: z.object({
          identifiable_info: z.string().describe("Email, full name, or order number to make the request identifiable"),
          summary: z.string().describe("Summarize user request concisely"),
        }),
        generate: async function* ({ identifiable_info, summary }) {
          let textContent = 'I am escalating your question to the human assistant\n\n';
          yield textContent;
          console.log('generating answer while escalating, ', identifiable_info);
          const filePath = path.resolve(process.cwd(), 'public/unclereco_info.txt');
          const generalInfo = fs.readFileSync(filePath, 'utf-8');    
          const result = await streamText({
            model: openai('gpt-3.5-turbo'),
            temperature: 0,
            system: `Generate response to user question ${summary} based on the context ${generalInfo}. Your answer begins with: "While we wait for the human assistant,`,
            messages: [
              {
                role: "user",
                content: summary
              },
              {
                role: "assistant",
                content: textContent
              },
            ]
          });
          

          for await (const textPart of result.textStream) {
            textContent += textPart;
            yield textContent;
          }
          return textContent;

        },
      },
      // product_questions: {
      //   description:
      //     "Product specific questions",
      //   parameters: z.object({
      //     product_id: z.string().describe("A clear unique product code based of an given ID or extracted from a product link"),
      //   }),
      //   generate: async ({ product_id }) => {
      //     history.done((messages: ServerMessage[]) => [
      //       ...messages,
      //       {
      //         role: "assistant",
      //         content: `Conversation about a specific product ${product_id}`,
      //       },
      //     ]);
      //     return <p className="font-bold">Here are some details about product {product_id}</p>;
      //   },
      // },
      // customer_support: {
      //   description:
      //     "Customer support questions (e.g. track purchase, payment issues, order issues)",
      //   parameters: z.object({
      //     order_id: z.string().describe("A clear order code if known to the user or if relevant to the prompt, otherwise leave it as NA"),
      //     email: z.string().describe("User email address if they are registered  or if relevant to the prompt, otherwise leave it as NA"),
      //     purchase_date: z.string().describe("Purchase date if known to the user  or if relevant to the prompt, otherwise leave it as NA"),
      //     order_total: z.string().describe("Total order value if known to the user or if relevant to the prompt, otherwise leave"),
      //     FAQ_query: z.string().describe("Extract a clear issue query to search within shop knowledge database")
      //   }),
      //   generate: async ({ order_id, email, purchase_date, order_total, FAQ_query }) => {
      //     history.done((messages: ServerMessage[]) => [
      //       ...messages,
      //       {
      //         role: "assistant",
      //         content: `Analyzing the user prompt`,
      //       },
      //     ]);
      //     return <p className="font-bold">Here the information I gathererd that will help me asnwer your prompt: {order_id}, {email}, {purchase_date}, {order_total}, {FAQ_query}</p>;
      //   },
      // },
      // follow_up: {
      //   description:
      //     "Ask a clarification/follow up question",
      //   parameters: z.object({
      //     user_prompt: z.string().describe("Try to understand what is missing or unclear about user prompt, and ask a clarification or a follow up question"),
      //   }),
      //   generate: async ({ user_prompt }) => {
      //     history.done((messages: ServerMessage[]) => [
      //       ...messages,
      //       {
      //         role: "assistant",
      //         content: `Trying to understand ${user_prompt}`,
      //       },
      //     ]);
      //     return <p className="font-bold">Let me see if I understand your question correctly: {user_prompt}</p>;
      //   },
      // },
      // comparison: {
      //   description:
      //     "Product comparison",
      //   parameters: z.object({
      //     product_1: z.string().describe("Identify first product to compare to second"),
      //     product_2: z.string().describe("Identify second product to compare to first"),
      //   }),
      //   generate: async ({ product_1, product_2 }) => {
      //     history.done((messages: ServerMessage[]) => [
      //       ...messages,
      //       {
      //         role: "assistant",
      //         content: `Comparing ${product_1} and ${product_2}`,
      //       },
      //     ]);
      //     return <p className="font-bold">Here is comparison for products: {product_1}, {product_2}</p>;
      //   },
      // },
      // promo: {
      //   description:
      //     "Product promotions, hot deals, trending products",
      //   parameters: z.object({
      //     type: z.string().describe("Understand type of the product the user is looking for to send to the relevant promotion page"),
      //   }),
      //   generate: async ({ type }) => {
      //     history.done((messages: ServerMessage[]) => [
      //       ...messages,
      //       {
      //         role: "assistant",
      //         content: `Interested in ${type}`,
      //       },
      //     ]);
      //     return <p className="font-bold">Here is a link to our trending products and promotions for: {type}</p>;
      //   },
      // },
    },
  });

  return {
    id: nanoid(),
    role: "assistant",
    display: result.value,
  };
}

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});