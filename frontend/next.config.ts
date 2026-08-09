import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Product images uploaded to the NestJS API
      { protocol: "http", hostname: "localhost", port: "4000" },
      // Placeholder images used by the seed data
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
