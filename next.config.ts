// import type { NextConfig } from "next";

const nextConfig = {
  devIndicators: false,
  trailingSlash: true,
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
  // output: 'export',
};

export default nextConfig;
