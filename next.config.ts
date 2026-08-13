import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clerk production keys: local dev via https://local.connectainf.com (port 443)
  allowedDevOrigins: ["local.connectainf.com"],
};

export default nextConfig;
