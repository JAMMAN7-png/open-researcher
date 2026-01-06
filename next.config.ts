import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Optimize production builds
  poweredByHeader: false,

  // Compiler options for better performance
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },

  // Enable experimental features for Next.js 15+
  experimental: {
    // Optimize package imports
    optimizePackageImports: [
      "@anthropic-ai/sdk",
      "@mendable/firecrawl-js",
      "lucide-react",
      "react-markdown",
    ],
  },

  // Turbopack configuration (stable in Next.js 15+)
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
