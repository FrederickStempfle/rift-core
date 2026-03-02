import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    const engineBase = (process.env.RIFT_ENGINE_URL ?? "http://engine:3001").replace(/\/+$/, "");
    return [
      {
        source: "/api/ws/:path*",
        destination: `${engineBase}/api/ws/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
