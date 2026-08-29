import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Design images are local (`public/img/`); add remote hosts here if the
    // catalogue ever moves to a CDN or a headless commerce backend.
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        // Design assets are content-addressed by filename, so they can be
        // cached hard at the edge.
        source: "/img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
