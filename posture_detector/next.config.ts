import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // The LiveKit packages are installed by the repo-root package.json, so
    // resolve from there rather than letting Next guess between lockfiles.
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
