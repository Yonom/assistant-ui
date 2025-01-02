import {
  AssistantCloudAuthStrategy,
  AssistantCloudJWTAuthStrategy,
  AssistantCloudAPIKeyAuthStrategy,
} from "./AssistantCloudAuthStrategy";

export type AssistantCloudConfig =
  | {
      projectId: string;
      authToken(): Promise<string>;
    }
  | {
      apiKey: string;
      workspaceId: string;
    };

export class AssistantCloudAPI {
  private _tokenManager: AssistantCloudAuthStrategy;
  private _baseUrl = "https://api.assistant-ui.com";

  constructor(config: AssistantCloudConfig) {
    if ("projectId" in config) {
      this._tokenManager = new AssistantCloudJWTAuthStrategy(
        config.projectId,
        config.authToken,
      );
    } else {
      this._tokenManager = new AssistantCloudAPIKeyAuthStrategy(
        config.apiKey,
        config.workspaceId,
      );
    }
  }

  public async makeRequest(
    endpoint: string,
    options: {
      method?: string;
      query?: Record<string, string | number | boolean> | undefined;
      body?: object | undefined;
    } = {},
  ) {
    const authHeaders = await this._tokenManager.getAuthHeaders();
    const headers = {
      ...authHeaders,
      "Content-Type": "application/json",
    };

    const queryParams = new URLSearchParams();
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (!value) continue;
        if (value === true) {
          queryParams.set(key, "true");
        } else {
          queryParams.set(key, value.toString());
        }
      }
    }

    const url = new URL(`${this._baseUrl}${endpoint}`);
    url.search = queryParams.toString();

    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : null,
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  }
}
