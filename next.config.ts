import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    reactStrictMode: true,
    poweredByHeader: false,
    // The dev server builds into its own folder so it can run alongside a
    // production build (`npm run preview`) without the two overwriting each other.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
