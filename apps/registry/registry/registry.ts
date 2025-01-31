import { RegistryItem } from "./schema";

export const registry: RegistryItem[] = [
  // {
  //   name: "edge-backend",
  //   type: "registry:block",
  //   files: [
  //     {
  //       type: "registry:page",
  //       path: "app/api/chat/route.ts",
  //       target: "app/api/chat/route.ts",
  //     },
  //   ],
  //   dependencies: ["@ai-sdk/openai"],
  // },
  // {
  //   name: "quick-start",
  //   type: "registry:block",
  //   files: [
  //     {
  //       type: "registry:component",
  //       path: "components/assistant-ui/thread.tsx",
  //       target: "components/assistant-ui/my-assistant.tsx",
  //     },
  //   ],
  //   registryDependencies: [
  //     "https://r.assistant-ui.com/assistant-ui-tailwind",
  //     "https://r.assistant-ui.com/markdown-tailwind",
  //     "https://r.assistant-ui.com/edge-backend",
  //   ],
  // },
  // {
  //   name: "b/chat/quick-start",
  //   type: "registry:block",
  //   files: [
  //     {
  //       type: "registry:component",
  //       path: "components/assistant-ui/thread.tsx",
  //       target: "components/assistant-ui/my-assistant.tsx",
  //     },
  //   ],
  //   registryDependencies: [
  //     "https://r.assistant-ui.com/assistant-ui-tailwind",
  //     "https://r.assistant-ui.com/markdown-tailwind",
  //     "https://r.assistant-ui.com/edge-backend",
  //   ],
  // },
  {
    name: "thread",
    type: "registry:component",
    files: [
      {
        type: "registry:component",
        path: "components/assistant-ui/thread.tsx",
        target: "components/assistant-ui/thread.tsx",
      },
    ],
    dependencies: ["@assistant-ui/react", "lucide-react"],
    registryDependencies: [
      "button",
      "avatar",
      "https://r.assistant-ui.com/markdown-text",
      "https://r.assistant-ui.com/tooltip-icon-button",
    ],
  },
  {
    name: "markdown-text",
    type: "registry:component",
    files: [
      {
        type: "registry:component",
        path: "components/assistant-ui/markdown-text.tsx",
        target: "components/assistant-ui/markdown-text.tsx",
      },
    ],
    registryDependencies: ["https://r.assistant-ui.com/tooltip-icon-button"],
    dependencies: [
      "@assistant-ui/react-markdown",
      "lucide-react",
      "remark-gfm",
      "remark-math",
      "rehype-katex",
    ],
  },
  {
    name: "tooltip-icon-button",
    type: "registry:component",
    files: [
      {
        type: "registry:component",
        path: "components/assistant-ui/tooltip-icon-button.tsx",
        target: "components/assistant-ui/tooltip-icon-button.tsx",
      },
    ],
    registryDependencies: ["tooltip", "button"],
  },
  {
    name: "syntax-highlighter",
    type: "registry:component",
    files: [
      {
        type: "registry:component",
        path: "components/assistant-ui/syntax-highlighter.tsx",
        target: "components/assistant-ui/syntax-highlighter.tsx",
      },
    ],
    dependencies: [
      "@assistant-ui/react-syntax-highlighter",
      "react-syntax-highlighter",
      "@types/react-syntax-highlighter",
    ],
  },
  {
    name: "modal",
    type: "registry:component",
    files: [
      {
        type: "registry:component",
        path: "components/assistant-ui/assistant-modal.tsx",
        target: "components/assistant-ui/assistant-modal.tsx",
      },
    ],
    dependencies: ["@assistant-ui/react", "lucide-react"],
    registryDependencies: [
      "https://r.assistant-ui.com/thread",
      "https://r.assistant-ui.com/tooltip-icon-button",
    ],
  },
  {
    name: "sidebar",
    type: "registry:component",
    files: [
      {
        type: "registry:component",
        path: "components/assistant-ui/assistant-sidebar.tsx",
        target: "components/assistant-ui/assistant-sidebar.tsx",
      },
    ],
    dependencies: ["@assistant-ui/react", "lucide-react"],
    registryDependencies: ["https://r.assistant-ui.com/thread", "resizable"],
  },
];
