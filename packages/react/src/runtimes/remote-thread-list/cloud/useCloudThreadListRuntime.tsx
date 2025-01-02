"use client";

import { AssistantRuntime } from "@assistant-ui/react";
import { PropsWithChildren, useEffect, useMemo, useRef } from "react";
import { useRemoteThreadListRuntime } from "../useRemoteThreadListRuntime";
import { AssistantCloud } from "./AssistantCloud";
import { CloudContext, CloudInitializeResponse } from "./CloudContext";

type ThreadData = {
  externalId: string;
};

type CloudThreadListAdapter = {
  cloud: AssistantCloud;

  runtimeHook: () => AssistantRuntime;

  create(): Promise<ThreadData>;
  delete(threadId: string): Promise<void>;
};

export const useCloudThreadListRuntime = (adapter: CloudThreadListAdapter) => {
  const adapterRef = useRef(adapter);
  useEffect(() => {
    adapterRef.current = adapter;
  }, [adapter]);

  const cloudContextValue = useMemo(() => {
    const subscribers = new Set<
      (result: Promise<CloudInitializeResponse>) => void
    >();
    return {
      initialize: async () => {
        const task = adapterRef.current.create().then(async (t) => {
          const { thread_id } = await adapterRef.current.cloud.threads.create({
            title: "New Thread",
            last_message_at: new Date(),
            metadata: {},
            external_id: t.externalId,
          });
          return { externalId: t.externalId, remoteId: thread_id };
        });
        for (const subscriber of subscribers) {
          subscriber(task);
        }
        return task;
      },
      subscribe: (
        callback: (result: Promise<CloudInitializeResponse>) => void,
      ) => {
        subscribers.add(callback);
        return () => {
          subscribers.delete(callback);
        };
      },
    };
  }, []);

  const runtime = useRemoteThreadListRuntime({
    runtimeHook: adapter.runtimeHook,
    list: async () => {
      const { threads } = await adapter.cloud.threads.list();
      return {
        threads: threads.map((t) => ({
          status: t.is_archived ? "archived" : "regular",
          remoteId: t.id,
          title: t.title,
          externalId: t.external_id,
        })),
      };
    },
    rename: async (threadId, newTitle) => {
      return adapter.cloud.threads.update(threadId, { title: newTitle });
    },
    archive: async (threadId) => {
      return adapter.cloud.threads.update(threadId, { is_archived: true });
    },
    unarchive: async (threadId) => {
      return adapter.cloud.threads.update(threadId, { is_archived: false });
    },
    delete: async (threadId) => {
      await adapter.delete(threadId);
      return adapter.cloud.threads.delete(threadId);
    },
    onInitialize: (callback) => {
      return cloudContextValue.subscribe(callback);
    },
    __internal_RenderComponent: ({ children }: PropsWithChildren) => {
      return (
        <CloudContext.Provider value={cloudContextValue}>
          {children}
        </CloudContext.Provider>
      );
    },
  });

  return runtime;
};
