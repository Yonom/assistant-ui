"use client";

import { Shadcn } from "@/components/shadcn/Shadcn";
import { Button } from "@/components/ui/button";
import { useChat } from "ai/react";
import { AssistantRuntimeProvider, useEdgeRuntime } from "@assistant-ui/react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container mx-auto flex flex-col gap-6 self-stretch py-4">
      <div className="mt-12 flex flex-col gap-4 self-center">
        <h1 className="text-center text-4xl font-extrabold">
          shadcn-ui for AI chatbots
        </h1>
      </div>

      <div className="mb-8 flex justify-center gap-2">
        <Button asChild>
          <Link href="/docs">Get Started</Link>
        </Button>
      </div>
      <div className="mx-auto flex w-full max-w-screen-xl flex-col">
        <div className="mt-4 h-[650px] overflow-hidden rounded-lg border shadow">
          <MyRuntimeProvider>
            <Shadcn />
          </MyRuntimeProvider>
        </div>
      </div>
    </main>
  );
}

export type AssistantProps = {
  chat: ReturnType<typeof useChat>;
};

const MyRuntimeProvider = ({ children }: { children: React.ReactNode }) => {
  const runtime = useEdgeRuntime({ api: "/api/chat" });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
};
