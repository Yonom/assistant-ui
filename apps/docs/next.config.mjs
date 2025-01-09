import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const config = {
  transpilePackages: ["@assistant-ui/*"],
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/umami/:path*",
        destination: "https://assistant-ui-umami.vercel.app/:path*",
      },
    ],
    fallback: [
      {
        source: "/registry/:path*",
        destination: "https://ui.shadcn.com/registry/:path*",
      },
    ],
  }),
  env: {
    ASTERAI_APP_ID: process.env.ASTERAI_APP_ID,
    ASTERAI_PUBLIC_QUERY_KEY: process.env.ASTERAI_PUBLIC_QUERY_KEY,
  }
};

const withMDX = createMDX();

export default withMDX(config);
