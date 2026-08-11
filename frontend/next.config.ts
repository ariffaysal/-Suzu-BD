import type { NextConfig } from "next";

// Product images are served from the API origin (see assetUrl() in services/api.ts),
// so the image optimizer must be told, at build time, where that origin lives.
// Falls back to the local dev API.
const apiUrl = new URL(
  process.env.NEXT_PUBLIC_API_ORIGIN ?? "http://localhost:4000",
);

const securityHeaders = [
  // Never allow the storefront to be embedded in another site (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Force strict MIME sniffing — a mislabeled file must never render as HTML
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Only honored by browsers over HTTPS; safe to ship now so production is covered
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Product images uploaded to the NestJS API (same origin as assetUrl())
      {
        protocol: apiUrl.protocol === "https:" ? "https" : "http",
        hostname: apiUrl.hostname,
        ...(apiUrl.port ? { port: apiUrl.port } : {}),
      },
      // Placeholder images used by the seed data
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
