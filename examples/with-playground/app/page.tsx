"use client";

import { AssistantPlayground } from "@assistant-ui/react-playground";
import { usePlaygroundRuntime } from "@assistant-ui/react-playground";
import { AssistantRuntimeProvider } from "@assistant-ui/react";

export default function Home() {
  const runtime = usePlaygroundRuntime({
    api: "/api/chat",
    initialMessages: [],
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <div className="mx-4 flex border-b py-4">
          <h1 className="text-3xl font-bold">Playground</h1>
          <div className="flex-grow" />
          <input
            placeholder="Enter request ID"
            className="w-[400px] rounded-md border p-2"
          />
        </div>
        <div className="flex-grow overflow-hidden">
          <div className="flex h-full flex-col overflow-scroll">
            <AssistantPlayground />
          </div>
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
