import "server-only";
import { getStore, type Store } from "@netlify/blobs";

/**
 * Where product photographs uploaded from the back office are kept on Netlify.
 *
 * A Netlify function's disk does not survive a deploy, so a file written to
 * `public/img/uploads/` there would vanish. Netlify Blobs keeps it instead,
 * and `/media/[...key]` serves it back. Off Netlify (local development) there
 * is no Blobs environment, and uploads go to `public/img/uploads/` as before.
 */

const STORE_NAME = "product-photos";

/** What a Blobs-backed photo's `ProductImage.url` starts with. */
export const MEDIA_PREFIX = "/media/";

/** A key the upload route could have written: `uploads/<safe-name>.<ext>`. */
export const PHOTO_KEY = /^uploads\/[a-z0-9-]+\.(jpg|png|webp)$/;

const NULL_BODY_STATUS = new Set([101, 204, 205, 304]);

/**
 * The fetch the Blobs client is given.
 *
 * Inside a route handler Next wraps `fetch` and tees each response body. The
 * Blobs client answers a 404 by cancelling the body, and cancelling one branch
 * of a tee only settles once the other branch is cancelled too, so a request
 * for a missing photo hung forever. Reading the body here and handing back a
 * plain Response avoids that. Photos are capped at 10 MB, so buffering is fine.
 */
const blobsFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, { ...init, cache: "no-store" });
  const body = NULL_BODY_STATUS.has(res.status) ? null : await res.arrayBuffer();
  return new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
};

/** The Netlify Blobs store, or null when the site is not running on Netlify. */
export function photoStore(): Store | null {
  try {
    return getStore({ name: STORE_NAME, consistency: "strong", fetch: blobsFetch });
  } catch (error) {
    if (error instanceof Error && error.name === "MissingBlobsEnvironmentError") {
      return null;
    }
    throw error;
  }
}

/**
 * True on a Netlify deploy, where falling back to disk would lose the file.
 * `NETLIFY` and `SITE_ID` are set by Netlify; neither is set locally.
 */
export function onNetlify(): boolean {
  return process.env.NETLIFY === "true" || Boolean(process.env.SITE_ID);
}
