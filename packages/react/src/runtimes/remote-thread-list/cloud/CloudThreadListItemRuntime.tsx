"use client";

import { createContext, FC, useContext, useEffect, useState } from "react";
import { useThreadListItemRuntime } from "../../../context";
import { RemoteThreadInitializeResponse } from "../types";
import { ThreadListItemRuntime } from "../../../api";

type CloudInitializeResponse = {
  remoteId: string;
  externalId: string | undefined;
};

type CloudThreadListItemRuntime = {
  initialize: () => Promise<CloudInitializeResponse>;
};

export const useCloudThreadListItemRuntime = () => {
  const cloudThreadListItemRuntime = useContext(
    CloudThreadListItemRuntimeContext,
  );
  if (!cloudThreadListItemRuntime)
    throw new Error(
      "This component can only be used inside a useCloudThreadListRuntime's runtimeHook.",
    );
  return cloudThreadListItemRuntime;
};

type CloudThreadListItemRuntimeAdapter = {
  initialize: (threadId: string) => Promise<RemoteThreadInitializeResponse>;
};

class CloudThreadListItemRuntimeImpl implements CloudThreadListItemRuntime {
  public constructor(
    private adapter: CloudThreadListItemRuntimeAdapter,
    private threadListItemRuntime: ThreadListItemRuntime,
  ) {}

  public __internal_setThreadListItemRuntime(
    threadListItemRuntime: ThreadListItemRuntime,
  ) {
    this.threadListItemRuntime = threadListItemRuntime;
  }

  public async initialize(): Promise<CloudInitializeResponse> {
    const threadData = this.threadListItemRuntime.getState();
    if (threadData.remoteId)
      return threadData as RemoteThreadInitializeResponse;
    return this.adapter.initialize(threadData.id);
  }
}

type CloudThreadListItemRuntimeContextAdapterProps = {
  adapter: CloudThreadListItemRuntimeAdapter;
  children: React.ReactNode;
};

export const CloudThreadListItemRuntimeProvider: FC<
  CloudThreadListItemRuntimeContextAdapterProps
> = ({ adapter, children }) => {
  const threadListItemRuntime = useThreadListItemRuntime();
  const [cloudThreadListItemRuntime] = useState(
    () => new CloudThreadListItemRuntimeImpl(adapter, threadListItemRuntime),
  );

  useEffect(() => {
    cloudThreadListItemRuntime.__internal_setThreadListItemRuntime(
      threadListItemRuntime,
    );
  }, [cloudThreadListItemRuntime, threadListItemRuntime]);

  return (
    <CloudThreadListItemRuntimeContext.Provider
      value={cloudThreadListItemRuntime}
    >
      {children}
    </CloudThreadListItemRuntimeContext.Provider>
  );
};

const CloudThreadListItemRuntimeContext =
  createContext<CloudThreadListItemRuntime | null>(null);
