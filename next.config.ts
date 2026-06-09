import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dszmb7soi/image/upload/**",
      },
    ],
  },
};

export default nextConfig;
