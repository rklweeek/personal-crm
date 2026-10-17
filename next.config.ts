import { networkInterfaces } from "node:os";

import type { NextConfig } from "next";

// This computer's local network addresses, so the dev server also works when
// opened from a phone on the same Wi-Fi (e.g. http://192.168.0.100:3000).
const lanAddresses = Object.values(networkInterfaces())
  .flat()
  .filter((net) => net?.family === "IPv4" && !net.internal)
  .map((net) => net!.address);

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: lanAddresses,
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
};

export default nextConfig;
