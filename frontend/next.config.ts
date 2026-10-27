import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Free hosting puts the API to sleep; waking it takes 30-60 s and the
    // default proxy timeout (30 s) would turn that first request into a 500.
    proxyTimeout: 120_000,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
