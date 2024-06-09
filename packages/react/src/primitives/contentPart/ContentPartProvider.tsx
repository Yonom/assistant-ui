"use client";

import { type FC, type PropsWithChildren, useMemo, useState } from "react";
import { create } from "zustand";
import { ContentPartContext } from "../../utils/context/ContentPartContext";
import type { ContentPartContextValue } from "../../utils/context/ContentPartContext";
import type { ThreadMessage } from "../../utils/context/stores/AssistantTypes";
import type { ContentPartState } from "../../utils/context/stores/ContentPartTypes";

type ContentPartProviderProps = PropsWithChildren<{
  part: ThreadMessage["content"][number];
  status: "in_progress" | "done" | "error";
}>;

const useContentPartContext = () => {
  const [context] = useState<ContentPartContextValue>(() => {
    const useContentPart = create<ContentPartState>(() => ({
      part: null as unknown as ThreadMessage["content"][number],
      status: "done",
    }));

    return { useContentPart };
  });
  return context;
};

export const ContentPartProvider: FC<ContentPartProviderProps> = ({
  part,
  status,
  children,
}) => {
  const context = useContentPartContext();

  // sync useContentPart
  useMemo(() => {
    context.useContentPart.setState(
      {
        part,
        status,
      },
      true,
    );
  }, [context, part, status]);

  return (
    <ContentPartContext.Provider value={context}>
      {children}
    </ContentPartContext.Provider>
  );
};
