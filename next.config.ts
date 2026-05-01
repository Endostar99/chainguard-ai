import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Image domains for external images (add as needed)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // Transpile packages if needed
  experimental: {
    // Enable server actions (already default in Next.js 15)
  },
};

export default nextConfig;
