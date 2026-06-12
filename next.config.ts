import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Whitelists your local IP network so Turbopack serves assets and fonts without 403 blocks
  allowedDevOrigins: ["10.95.223.238", "localhost:3000"],
};

export default nextConfig;
