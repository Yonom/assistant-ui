import sjson from "secure-json-parse";
import { fixJson } from "./fix-json";
import {
  ContentPartStatus,
  ToolCallContentPartStatus,
} from "../../types/AssistantTypes";

const PARTIAL_JSON_COUNT_SYMBOL = Symbol("partial-json-count");
export const parsePartialJson = (json: string) => {
  try {
    return sjson.parse(json);
  } catch {
    try {
      const [fixedJson, partialCount] = fixJson(json);
      const res = sjson.parse(fixedJson);
      res[PARTIAL_JSON_COUNT_SYMBOL] = partialCount;
      return res;
    } catch {
      return undefined;
    }
  }
};

const getFieldStatus = (
  lastState: ContentPartStatus,
  args: unknown,
  fieldPath: string[],
  partialCount: number,
): ContentPartStatus => {
  if (fieldPath.length === 0) return lastState;
  if (partialCount === 1) return { type: "complete" };
  if (typeof args !== "object" || args === null) return { type: "complete" };

  const path = fieldPath.at(-1)!;
  const argsKeys = Object.keys(args);
  const isLast = argsKeys.indexOf(path) === argsKeys.length - 1;
  if (!isLast) return { type: "complete" };

  return getFieldStatus(
    lastState,
    args[path as keyof typeof args],
    fieldPath.slice(0, -1),
    partialCount - 1,
  );
};

export const getToolArgsFieldStatus = (
  status: ToolCallContentPartStatus,
  args: Record<string, unknown>,
  fieldPath: string[],
): ContentPartStatus => {
  const partialCount = (args as any)[PARTIAL_JSON_COUNT_SYMBOL] ?? 0;
  if (partialCount === 0) return { type: "complete" };

  const lastState: ContentPartStatus =
    status.type !== "requires-action" ? status : { type: "complete" };

  return getFieldStatus(lastState, args, fieldPath, partialCount);
};
