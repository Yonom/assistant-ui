import { LanguageModelV1FunctionTool } from "@ai-sdk/provider";
import { Tool } from "../../../types/ModelConfigTypes";

export const fromLanguageModelTools = (
  tools: LanguageModelV1FunctionTool[],
): Record<string, Tool<any, any>> => {
  return Object.fromEntries(
    tools.map((tool) => [
      tool.name,
      {
        description: tool.description,
        parameters: tool.parameters,
      },
    ]),
  );
};
