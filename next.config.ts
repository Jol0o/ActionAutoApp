import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

process.env.SERWIST_SUPPRESS_TURBOPACK_WARNING = "1";

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    serverActions: {
      allowedOrigins: ["nctbkrf4-3000.asse.devtunnels.ms", "localhost:3001", "localhost:3000"],
    },
  },
};

export default process.env.NODE_ENV === "production"
  ? withSerwistInit({
    swSrc: "src/sw.ts",
    swDest: "public/sw.js",
  })(nextConfig)
  : nextConfig;
