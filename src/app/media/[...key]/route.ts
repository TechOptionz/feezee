import { PHOTO_KEY, photoStore } from "@/lib/photo-store";

/**
 * Serves product photographs kept in Netlify Blobs (see `src/lib/photo-store.ts`).
 *
 * Public on purpose: these are the same pictures the shop shows to everyone.
 * Only keys the upload route can produce are looked up, and each name carries
 * a timestamp, so a file never changes once written and can be cached for a
 * year like the design's own images.
 */

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const key = (await params).key.join("/");
  if (!PHOTO_KEY.test(key)) {
    return new Response("Not found", { status: 404 });
  }

  const store = photoStore();
  if (!store) {
    return new Response("Not found", { status: 404 });
  }

  const blob = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!blob) {
    return new Response("Not found", { status: 404 });
  }

  const contentType =
    typeof blob.metadata.contentType === "string"
      ? blob.metadata.contentType
      : "application/octet-stream";

  return new Response(blob.data, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
