import type { NextConfig } from "next";

const assetCacheHeaders = [
  {
    key: "Cache-Control",
    value: "public, max-age=31536000, immutable",
  },
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  experimental: {
    instrumentationHook: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24,
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: assetCacheHeaders,
      },
      {
        source: "/(.*)\\.(js|css|svg|png|jpg|jpeg|gif|webp|ico)$",
        headers: assetCacheHeaders,
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
