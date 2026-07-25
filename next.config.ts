import type { NextConfig } from "next";

const nextConfig: NextConfig & { allowedDevOrigins?: string[] } = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.37", "169.254.61.192", "localhost"],
};

export default nextConfig;
