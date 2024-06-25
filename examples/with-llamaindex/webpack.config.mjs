// webpack config must be a function in NextJS that is used to patch the default webpack config provided by NextJS, see https://nextjs.org/docs/pages/api-reference/next-config-js/webpack
export default function webpack(config) {
  config.resolve.fallback = {
    aws4: false,
  };

  // Following lines will fix issues with onnxruntime-node when using pnpm
  // See: https://github.com/vercel/next.js/issues/43433
  config.externals.push({
    "onnxruntime-node": "commonjs onnxruntime-node",
    sharp: "commonjs sharp",
  });

  return config;
}
