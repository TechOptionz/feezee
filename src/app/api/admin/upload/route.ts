import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { audit, requireStaffAction } from "@/modules/admin";

/**
 * Photographs, straight off the shop's laptop.
 *
 * Before this, putting a garment on the site meant copying a file into
 * `public/img/` by hand and then typing its name into the product form — a
 * two-machine job that only the person with the repository could do. This is
 * the same thing over HTTP, restricted to staff, and it returns the *relative*
 * path (`uploads/kurta-1712…jpg`) rather than a URL, because that is what the
 * `ProductImage.url` column holds and what `img()` prefixes.
 *
 * Three things it does not take on trust:
 *
 * 1. **The session.** Same guard as every admin action; a route handler is a
 *    public endpoint whether or not the admin UI is the only thing calling it.
 * 2. **The declared type.** `file.type` is whatever the browser felt like
 *    sending, so the first bytes are read and checked against the format they
 *    claim to be. A `.jpg` that is really a script never reaches the disk.
 * 3. **The filename.** Reduced to `[a-z0-9-]` and taken through `basename`,
 *    so no amount of `../` in it can write outside the uploads folder.
 */

export const runtime = "nodejs";

/** Ten megabytes — a phone photograph, not a print master. */
const MAX_BYTES = 10 * 1024 * 1024;

const ACCEPTED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
} as const;

type AcceptedType = keyof typeof ACCEPTED;

/** Where the file lands, relative to `public/`. */
const UPLOAD_DIR = path.join(process.cwd(), "public", "img", "uploads");

function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * What the bytes actually are, or null.
 *
 * Only the three formats above have a signature worth checking here; anything
 * else fails the type check before it gets this far.
 */
function sniff(bytes: Uint8Array): AcceptedType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && PNG.every((b, i) => bytes[i] === b)) {
    return "image/png";
  }
  // "RIFF" .... "WEBP"
  if (bytes.length >= 12) {
    const head = Buffer.from(bytes.subarray(0, 12)).toString("latin1");
    if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") {
      return "image/webp";
    }
  }
  return null;
}

/**
 * A filename safe to write and pleasant to read back in the form.
 *
 * The timestamp is not decoration: two people uploading `IMG_0042.jpg` on the
 * same afternoon must not overwrite one another, and a product photograph is
 * cached immutably for a year by `next.config.ts`, so a reused name would
 * leave the old picture on screen.
 */
function safeName(original: string, extension: string): string {
  const base = path
    .basename(original)
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${base || "photo"}-${Date.now().toString(36)}${extension}`;
}

export async function POST(request: Request) {
  let actor;
  try {
    actor = await requireStaffAction();
  } catch {
    return bad("Please sign in again.", 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return bad("Send the photograph as multipart/form-data.");
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return bad("Choose a photograph to upload.");
  }
  if (file.size > MAX_BYTES) {
    return bad("That photograph is over 10 MB. Please export it smaller.", 413);
  }
  if (!(file.type in ACCEPTED)) {
    return bad("Photographs must be JPEG, PNG or WebP.", 415);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Re-check the size against what actually arrived, not the declared length.
  if (bytes.byteLength > MAX_BYTES) {
    return bad("That photograph is over 10 MB. Please export it smaller.", 413);
  }

  const real = sniff(bytes);
  if (!real || real !== file.type) {
    return bad("That file is not the image it claims to be.", 415);
  }

  const filename = safeName(file.name, ACCEPTED[real]);

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  } catch (error) {
    console.error("[upload]", error);
    return bad("The photograph could not be saved. Please try again.", 500);
  }

  const relativePath = `uploads/${filename}`;

  await audit({
    actor,
    action: "product.image.upload",
    entityType: "ProductImage",
    entityId: relativePath,
    newState: { bytes: bytes.byteLength, type: real, original: file.name },
  });

  return Response.json({
    /** What goes in the product form and the `ProductImage.url` column. */
    path: relativePath,
    /** The same file as the browser should request it. */
    url: `/img/${relativePath}`,
    bytes: bytes.byteLength,
  });
}
