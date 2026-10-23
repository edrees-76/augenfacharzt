import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  // This app is session-authenticated end-to-end (nearly every route reads
  // cookies()/the database per request), so there is effectively nothing to
  // statically cache — Cache Components' static-shell model fights that more
  // than it helps, so Stage 1 sticks with standard per-request dynamic
  // rendering instead.
  turbopack: {
    root: path.join(__dirname),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
