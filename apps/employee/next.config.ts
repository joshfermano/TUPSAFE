import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Allow type checking to fail the build
    ignoreBuildErrors: false,
  },
  // Enable standalone output for Docker
  output: "standalone",
};

export default nextConfig;
