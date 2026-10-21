import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    // In production (Vercel), edge rewrites in vercel.json route /api/* to the
    // API service directly — no Next.js proxy needed.
    // In dev, NEXT_PUBLIC_API_URL points to the local FastAPI server.
    const rawUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    if (!rawUrl.startsWith("http")) {
      return [];
    }
    const backendOrigin = rawUrl.replace(/\/api(\/v\d+)?\/?$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};


export default nextConfig;
