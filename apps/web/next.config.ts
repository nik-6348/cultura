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
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
