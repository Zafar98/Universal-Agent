import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local network dev access from your phone or another device.
  // Replace or add more origins if the port changes.
  // This setting is only used in development.
  allowedDevOrigins: [
    "192.168.1.27:3000",
    "192.168.1.27:3001",
    "foyer-garnet-caption.ngrok-free.dev",
  ],
};

export default nextConfig;
