"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLlamaIndexRuntime } from "@assistant-ui/react-llamaindex";

export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtime = useLlamaIndexRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
