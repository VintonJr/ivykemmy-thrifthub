import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Room for several phone photos per listing.
    serverActions: { bodySizeLimit: "25mb" },
  },
  cacheComponents: true,
  partialPrefetching: true,
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
