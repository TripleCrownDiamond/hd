import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Resize at the CDN instead of proxying every catalogue image through the
    // Next optimizer — see src/lib/cloudinary-loader.ts.
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",
    // Catalogue cards are at most a third of a 1440 viewport, so the huge
    // default breakpoints only produced bytes nobody downloaded.
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600],
    imageSizes: [120, 200, 240, 320, 480],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/pq4soawt/**",
      },
      // New uploads: Cloudinary's quota is full.
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/fghqtx0enp/**",
      },
      {
        protocol: "https",
        hostname: "www.spartherm.com",
        pathname: "/images/**",
      },
    ],
  },
};

export default nextConfig;
