// import type { NextConfig } from "next";

const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/dszmb7soi/image/upload/**",
      },
    ],
    unoptimized: true
  },
  output: 'export',
};

export default nextConfig;
