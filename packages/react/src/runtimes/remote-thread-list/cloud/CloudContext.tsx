import { createContext } from "react";

export type CloudInitializeResponse = {
  remoteId: string;
  externalId: string;
};

type CloudContextValue = {
  initialize: () => Promise<CloudInitializeResponse>;
};

export const CloudContext = createContext<CloudContextValue | null>(null);
