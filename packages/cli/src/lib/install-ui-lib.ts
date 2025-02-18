import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { sync as globSync } from "glob";
import * as readline from "readline";
import { detect } from "detect-package-manager";

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function isPackageInstalled(pkg: string): boolean {
  const cwd = process.cwd();
  try {
    const pkgJsonPath = path.join(cwd, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
      const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
      const deps = pkgJson.dependencies || {};
      const devDeps = pkgJson.devDependencies || {};
      if (deps[pkg] || devDeps[pkg]) {
        return true;
      }
    }
  } catch (e) {
    // Fall back to node_modules check below.
  }
  const modulePath = path.join(cwd, "node_modules", ...pkg.split("/"));
  return fs.existsSync(modulePath);
}

export default async function installReactUILib(): Promise<void> {
  const cwd = process.cwd();
  const pattern = "**/*.{js,jsx,ts,tsx}";
  const files = globSync(pattern, {
    cwd,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  });

  let found = false;
  for (const file of files) {
    const fullPath = path.join(cwd, file);
    const content = fs.readFileSync(fullPath, "utf8");
    if (content.includes("@assistant-ui/react-ui")) {
      found = true;
      break;
    }
  }

  if (found) {
    if (isPackageInstalled("@assistant-ui/react-ui")) {
      console.log(
        "@assistant-ui/react-ui is already installed. Skipping installation.",
      );
      return;
    }

    const answer = await askQuestion(
      "React UI imports were added but @assistant-ui/react-ui is not installed. Do you want to install it? (Y/n) ",
    );
    if (answer === "" || answer.toLowerCase().startsWith("y")) {
      const pm = await detect();
      let cmd = "";
      if (pm === "yarn") {
        cmd = "yarn add @assistant-ui/react-ui";
      } else if (pm === "pnpm") {
        cmd = "pnpm add @assistant-ui/react-ui";
      } else if (pm === "bun") {
        cmd = "bun add @assistant-ui/react-ui";
      } else {
        cmd = "npm install @assistant-ui/react-ui";
      }
      try {
        execSync(cmd, { stdio: "inherit" });
      } catch (e) {
        console.error("Installation failed:", e);
      }
    } else {
      console.log("Skipping installation.");
    }
  } else {
    console.log("No React UI imports found; skipping installation.");
  }
}
