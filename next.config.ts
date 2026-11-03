import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Design images are local (`public/img/`), and photographs uploaded on
    // Netlify are served from this site's own `/media/` route. Add remote
    // hosts here if the catalogue ever moves to a CDN.
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Two years. Browsers ignore it over plain http, so it does nothing
          // on localhost. `preload` is left off: submitting the domain to the
          // browser preload list is hard to undo and should be done on purpose.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          // Nothing on this site is meant to be framed, and the checkout
          // and admin are exactly what clickjacking goes after.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
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
