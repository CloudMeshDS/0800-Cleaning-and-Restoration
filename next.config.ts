import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  const dev = phase === PHASE_DEVELOPMENT_SERVER;

  /**
   * Content Security Policy: the browser may only load code, styles, data and
   * frames from this site (plus the Unsplash hero photo). Supabase and EmailJS
   * are only ever called from the server. Next.js needs inline scripts/styles.
   */
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self' data:",
    `connect-src 'self' blob: data:${dev ? " ws:" : ""}`,
    "media-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  return {
    reactStrictMode: true,
    poweredByHeader: false,
    // The dev server builds into its own folder so it can run alongside a
    // production build (`npm run preview`) without the two overwriting each other.
    distDir: dev ? ".next-dev" : ".next",
    async headers() {
      return [
        {
          source: "/:path*",
          headers: [
            { key: "Content-Security-Policy", value: csp },
            ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "X-Frame-Options", value: "DENY" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
            { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          ],
        },
        // The admin area is never cached by browsers or proxies.
        { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      ];
    },
  };
}
