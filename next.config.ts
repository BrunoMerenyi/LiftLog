import type { NextConfig } from "next";
const ipv4 =
  process.env.NEXT_ALLOWED_HOSTS?.split(",").find((host) =>
    host.includes("."),
  ) ?? "172.20.10.6";
const nextConfig: NextConfig = {
  reactCompiler: true,
  // Whitelists your local IP network so Turbopack serves assets and fonts without 403 blocks
  allowedDevOrigins: [ipv4, "localhost:3000"],
};

export default nextConfig;
