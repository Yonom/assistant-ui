"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useMediaQuery } from "@react-hook/media-query";
import type { FC, PropsWithChildren } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../tabs";
import { Thread } from "./thread";

export const AssistantSidebar: FC<PropsWithChildren> = ({ children }) => {
  const isSmall = useMediaQuery("(max-width: 768px)");

  if (isSmall) {
    return (
      <Tabs
        defaultValue="app"
        className="mx-auto h-full max-w-[480px] pt-4 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2 ">
          <TabsTrigger value="app">Form</TabsTrigger>
          <TabsTrigger value="thread">Chat</TabsTrigger>
        </TabsList>
        <TabsContent value="app">{children}</TabsContent>
        <TabsContent value="thread">
          <Thread />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel>{children}</ResizablePanel>
      <ResizableHandle />
      <ResizablePanel>
        <Thread />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
