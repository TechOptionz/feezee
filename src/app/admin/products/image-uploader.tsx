"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { img } from "@/lib/assets";
import { cn } from "@/lib/utils";

/**
 * The photographs on a product, without leaving the browser.
 *
 * The form still posts one `images` field of newline-separated filenames —
 * `saveProductAction` is unchanged — but nobody has to type one any more. Files
 * dropped or chosen here go to `/api/admin/upload`, which writes them into
 * `public/img/uploads/` and hands back the relative path that goes in the box.
 *
 * The textarea is the state, and the thumbnails are read off it. Holding the
 * list twice — once parsed, once as text — is what makes a half-typed filename
 * disappear under the cursor, so there is only ever the one copy.
 *
 * Order is meaningful: the first photograph is the card image, which is why
 * every thumbnail carries a "make card" button rather than only a remove. The
 * text box stays because the existing catalogue is filenames that were already
 * in `public/img/`, and editing one should not mean re-uploading it.
 */

const ACCEPT = "image/jpeg,image/png,image/webp";

/** The same split `saveProductAction` performs on the other side. */
function parse(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ImageUploader({ defaultImages }: { defaultImages: string[] }) {
  const [text, setText] = useState(defaultImages.join("\n"));
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, startUpload] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const images = parse(text);
  const write = (list: string[]) => setText(list.join("\n"));

  /**
   * Uploads one at a time rather than in parallel: a shop laptop pushing six
   * 8 MB photographs at once is how a request times out, and the order they
   * arrive in is the order they will sit on the page.
   */
  function upload(files: FileList | File[]) {
    const chosen = Array.from(files);
    if (chosen.length === 0) return;
    setError(null);

    startUpload(async () => {
      const added: string[] = [];
      for (const file of chosen) {
        const body = new FormData();
        body.set("file", file);

        try {
          const response = await fetch("/api/admin/upload", { method: "POST", body });
          const json = (await response.json()) as { path?: string; error?: string };

          if (!response.ok || !json.path) {
            setError(`${file.name}: ${json.error ?? "upload failed"}`);
            break;
          }
          added.push(json.path);
        } catch {
          setError(`${file.name} could not be sent. Check the connection.`);
          break;
        }
      }

      // Appended against the latest text, not the render this closure began in.
      if (added.length > 0) {
        setText((current) => [...parse(current), ...added].join("\n"));
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* What the server action actually reads. */}
      <input type="hidden" name="images" value={images.join("\n")} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-3 border border-dashed px-5 py-[clamp(20px,3vw,32px)] text-center transition-colors",
          dragging ? "border-gold bg-gold/5" : "border-ink-line",
        )}
      >
        <p className="m-0 text-[13.5px] leading-[1.7] text-taupe">
          Drop photographs here, or choose them from this computer.
          <br />
          JPEG, PNG or WebP, up to 10 MB each.
        </p>

        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            // Cleared so choosing the same file twice still fires a change.
            e.target.value = "";
          }}
        />

        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          className="cursor-pointer border border-ink-line bg-transparent px-6 py-2.5 text-[12px] tracking-[0.16em] uppercase text-champagne hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Choose photographs"}
        </button>
      </div>

      {error && (
        <p role="alert" className="m-0 text-[12.5px] leading-[1.6] text-wine-bright">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <ul className="m-0 p-0 list-none grid grid-cols-2 nav:grid-cols-4 gap-3">
          {images.map((file, index) => (
            <li
              key={`${file}-${index}`}
              className="flex flex-col gap-2 border border-ink-line p-2"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink">
                <Image
                  src={img(file)}
                  alt=""
                  fill
                  sizes="(max-width: 860px) 45vw, 200px"
                  className="object-cover object-top"
                />
                {index === 0 && (
                  <span className="absolute left-0 top-0 bg-gold px-2 py-1 text-[10px] tracking-[0.16em] uppercase text-ink">
                    Card
                  </span>
                )}
              </div>

              <span className="truncate text-[11.5px] text-taupe" title={file}>
                {file}
              </span>

              <div className="flex items-center justify-between gap-2">
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      write([file, ...images.filter((_, i) => i !== index)])
                    }
                    className="cursor-pointer border-none bg-transparent p-0 text-[11px] tracking-[0.14em] uppercase text-gold-light hover:text-champagne"
                  >
                    Make card
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => write(images.filter((_, i) => i !== index))}
                  className="cursor-pointer border-none bg-transparent p-0 text-[11px] tracking-[0.14em] uppercase text-taupe hover:text-wine-bright"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-[11px] tracking-[0.16em] uppercase text-taupe">
          Or edit the list by hand — one filename in public/img per line, first is
          the card image
        </span>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"suit-sage-tissue.jpg\nuploads/kurta-ivory-lx8f2p.jpg"}
          className="border border-ink-line bg-transparent px-3 py-2.5 text-[13.5px] leading-[1.7] text-champagne outline-none resize-y placeholder:text-taupe focus:border-gold"
        />
      </label>
    </div>
  );
}
