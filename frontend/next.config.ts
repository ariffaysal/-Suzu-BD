import type { NextConfig } from "next";

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
      // Product images uploaded to the NestJS API
      { protocol: "http", hostname: "localhost", port: "4000" },
      // Placeholder images used by the seed data
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
