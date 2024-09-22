import { useEffect, useMemo, useState } from "react";
import { ExternalStoreRuntimeCore } from "./ExternalStoreRuntimeCore";
import { ExternalStoreAdapter } from "./ExternalStoreAdapter";
import { AssistantRuntime } from "../../api/AssistantRuntime";

export const useExternalStoreRuntime = <T,>(store: ExternalStoreAdapter<T>) => {
  const [runtime] = useState(() => new ExternalStoreRuntimeCore(store));

  useEffect(() => {
    runtime.store = store;
  });

  return useMemo(() => new AssistantRuntime(runtime), [runtime]);
};
