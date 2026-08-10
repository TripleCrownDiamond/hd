import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The footer and outside links use the spelled-out names; the routes are
  // shorter. Redirect rather than duplicate a legal text under two URLs, which
  // is how the two copies end up disagreeing.
  async redirects() {
    return [
      { source: "/widerrufsbelehrung", destination: "/widerruf", permanent: true },
      { source: "/versand-und-zahlung", destination: "/versand", permanent: true },
      { source: "/agb-und-kundeninformationen", destination: "/agb", permanent: true },
    ];
  },
  images: {
    // Everything is resized and re-encoded by the local optimizer (sharp) —
    // the default Next loader. Product images are being migrated off
    // Cloudinary/ImageKit into the public Supabase Storage bucket
    // `produkt-bilder` (scripts/publish/migrate-media-local.mjs), so the CDN
    // transforms are on their way out.
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
      // Self-hosted product images: any Supabase project storage endpoint.
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
