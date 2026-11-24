import type { NextConfig } from "next";

const s3Host = (() => {
  try {
    return process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const isDev = process.env.NODE_ENV !== "production";

// Next.js App Router inlines bootstrap scripts, so 'unsafe-inline' is needed for scripts
// unless nonce-based CSP is adopted (which forces dynamic rendering for every page).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com${s3Host ? ` https://${s3Host}` : ""}`,
  "font-src 'self' data:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
  "frame-src https://www.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Always put <title>, description and Open Graph tags in the initial <head> (no streamed metadata),
  // so every crawler and link-preview bot (WhatsApp, LinkedIn, Lighthouse…) sees them.
  htmlLimitedBots: /.*/,
  reactStrictMode: true,
  // Dev only: allow opening the dev server from other devices on the local network.
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.*.*", "10.*.*.*"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: s3Host ? [{ protocol: "https", hostname: s3Host }] : [],
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb", "mariadb", "ioredis", "sharp", "bcryptjs", "nodemailer"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
