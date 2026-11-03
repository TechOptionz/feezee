/**
 * Single source of truth for static asset paths.
 *
 * All design images live in `public/img/` and keep the filenames used by the
 * source design (e.g. `p14.jpg`). Referencing them through `img()` instead of
 * hardcoding strings means a rename or a move to a CDN is a one-line change here.
 */

/** Base URL for assets. Set NEXT_PUBLIC_ASSET_BASE to serve from a CDN. */
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "";

const ABSOLUTE_URL = /^https?:\/\//i;

/**
 * Path to an image in `public/img/`.
 *
 * A value that is already a full URL, or a site path starting with "/", is
 * returned untouched. Photographs uploaded on Netlify are stored as
 * "/media/uploads/…" and served from Netlify Blobs; the design's own images
 * and anything uploaded to local disk are relative to `public/img/`.
 */
export function img(file: string): string {
  if (ABSOLUTE_URL.test(file) || file.startsWith("/")) return file;
  return `${ASSET_BASE}/img/${file}`;
}

/** The same image as an absolute URL, for structured data and emails. */
export function absoluteImg(file: string, origin: string): string {
  const src = img(file);
  return ABSOLUTE_URL.test(src) ? src : `${origin}${src}`;
}

/** Path to any file in `public/`. */
export function asset(path: string): string {
  return `${ASSET_BASE}/${path.replace(/^\//, "")}`;
}
