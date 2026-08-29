/**
 * Single source of truth for static asset paths.
 *
 * All design images live in `public/img/` and keep the filenames used by the
 * source design (e.g. `p14.jpg`). Referencing them through `img()` instead of
 * hardcoding strings means a rename or a move to a CDN is a one-line change here.
 */

/** Base URL for assets. Set NEXT_PUBLIC_ASSET_BASE to serve from a CDN. */
const ASSET_BASE = process.env.NEXT_PUBLIC_ASSET_BASE ?? "";

/** Path to an image in `public/img/`. */
export function img(file: string): string {
  return `${ASSET_BASE}/img/${file}`;
}

/** Path to any file in `public/`. */
export function asset(path: string): string {
  return `${ASSET_BASE}/${path.replace(/^\//, "")}`;
}
