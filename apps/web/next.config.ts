import path from "node:path";

import type { NextConfig } from "next";

const sharedStylesPath = path.join(process.cwd(), "src/shared/styles");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@cs/shared"],
  sassOptions: {
    loadPaths: [sharedStylesPath],
  },
};

export default nextConfig;
