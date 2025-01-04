import { type ModelConfigProvider } from "../../types/ModelConfigTypes";
import type { Unsubscribe } from "../../types/Unsubscribe";
import type { AssistantRuntimeCore } from "./AssistantRuntimeCore";
import { ProxyConfigProvider } from "../../utils/ProxyConfigProvider";
import { ThreadListRuntimeCore } from "./ThreadListRuntimeCore";
import { ComponentType } from "react";

export abstract class BaseAssistantRuntimeCore implements AssistantRuntimeCore {
  protected readonly _proxyConfigProvider = new ProxyConfigProvider();
  public abstract get threadList(): ThreadListRuntimeCore;
  public abstract get Provider():
    | ComponentType<React.PropsWithChildren>
    | undefined;

  constructor() {}

  public registerModelConfigProvider(
    provider: ModelConfigProvider,
  ): Unsubscribe {
    return this._proxyConfigProvider.registerModelConfigProvider(provider);
  }
}
