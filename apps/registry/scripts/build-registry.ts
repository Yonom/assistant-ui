import { promises as fs, readFileSync } from "node:fs";
import * as path from "node:path";
import { registry } from "../registry/registry";
import { RegistryItem } from "@/registry/schema";
import threadStyles from "../../../packages/react-ui/dist/styles/tailwindcss/thread.css.json";

const REGISTRY_PATH = path.join(process.cwd(), "dist");

const stylesToReplace = Object.entries(threadStyles).map(([key, value]) => {
  return {
    key: key.replace(/^\./, ""),
    value: Object.keys(value)
      .map((key) => key.replace(/^\@apply /, "").replaceAll("-aui-", "-"))
      .filter((k) => k)
      .join(" "),
  };
});

const transformClassnames = (content: string) => {
  for (const style of stylesToReplace) {
    content = content.replaceAll(
      new RegExp(`\\b${style.key}\\b`, "g"),
      style.value,
    );
  }

  return content;
};

async function buildRegistry(registry: RegistryItem[]) {
  await fs.mkdir(REGISTRY_PATH, { recursive: true });

  for (const item of registry) {
    const files = item.files?.map((file) => {
      const content = readFileSync(
        path.join(process.cwd(), "registry", file.path),
        "utf8",
      );
      const transformedContent = transformClassnames(content);

      // in debug mode, write the transformed content to a file
      const debugPath = path.join(
        process.cwd(),
        "debug",
        `${item.name}-${file.path}`,
      );
      fs.mkdir(path.dirname(debugPath), { recursive: true }).then(() => {
        fs.writeFile(debugPath, transformedContent, "utf8");
      });

      return {
        content: transformedContent,
        ...file,
      };
    });

    const payload = {
      ...item,
      files,
    };

    const p = path.join(REGISTRY_PATH, `${item.name}.json`);
    await fs.mkdir(path.dirname(p), { recursive: true });

    await fs.writeFile(p, JSON.stringify(payload, null, 2), "utf8");
  }
}

await buildRegistry(registry);
