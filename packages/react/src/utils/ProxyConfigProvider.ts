"use client";
import {
  type ModelConfigProvider,
  mergeModelConfigs,
} from "../types/ModelConfigTypes";

export class ProxyConfigProvider implements ModelConfigProvider {
  private _providers = new Set<ModelConfigProvider>();

  getModelConfig() {
    return mergeModelConfigs(this._providers);
  }

  registerModelConfigProvider(provider: ModelConfigProvider) {
    this._providers.add(provider);
    return () => {
      this._providers.delete(provider);
    };
  }
}
