import { build } from "tsup";
import { copyFileSync, mkdirSync } from "node:fs";
import fs from "fs";
import postcss from "postcss";
import postcssJs from "postcss-js";

// tailwind-plugin-resources

const files = [
  "./src/styles/tailwindcss/base-components.css",
  "./src/styles/tailwindcss/modal.css",
  "./src/styles/tailwindcss/thread.css",
  "./src/styles/themes/default.css",
];

const replaceNullWithObject = (obj: object) => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => {
      if (value === true) return [key, {}];
      if (typeof value === "object" && value !== null)
        return [key, replaceNullWithObject(value)];
      return [key, value];
    }),
  );
};

mkdirSync("./src/tailwindcss/data", { recursive: true });
for (const file of files) {
  const cssContent = fs.readFileSync(file, "utf8");
  const root = postcss.parse(cssContent);
  const formattedComponents = replaceNullWithObject(postcssJs.objectify(root));

  const outputFile =
    "./src/tailwindcss/data/" + file.split("/").pop() + ".json";
  const outputContent = JSON.stringify(formattedComponents, null, 2);
  fs.writeFileSync(outputFile, outputContent);
}

// JS
await build({
  entry: ["src/index.ts", "src/edge.ts", "src/tailwindcss/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  esbuildOptions: (options, { format }) => {
    if (format === "esm") {
      options.banner = {
        js: '"use client";',
      };
    }
  },
});

// TODO find a way to bundle edge with the rest of the package
await build({
  entry: ["src/edge.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
});

// css

await build({
  entry: ["src/styles/index.css", "src/styles/modal.css"],
  outDir: "dist/styles",
  dts: true,
  sourcemap: true,
});

mkdirSync("dist/styles/tailwindcss", { recursive: true });
copyFileSync(
  "src/styles/tailwindcss/base-components.css",
  "dist/styles/tailwindcss/base-components.css",
);
copyFileSync(
  "src/styles/tailwindcss/thread.css",
  "dist/styles/tailwindcss/thread.css",
);
copyFileSync(
  "src/styles/tailwindcss/modal.css",
  "dist/styles/tailwindcss/modal.css",
);

mkdirSync("dist/styles/themes", { recursive: true });
copyFileSync("src/styles/themes/default.css", "dist/styles/themes/default.css");
