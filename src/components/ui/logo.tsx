import Image from "next/image";
import { img } from "@/lib/assets";
import { cn } from "@/lib/utils";

/**
 * The FEEZEE lockup, supplied as artwork.
 *
 * Two colourways of the same file: `gold` for cream surfaces, `light` for the
 * header while it floats over a photograph and for the ink footer. Both are
 * keyed to transparency from the brand original, so the mark never carries a
 * background of its own.
 */
export type LogoTone = "gold" | "light";

/** Intrinsic size of the artwork, used to keep the aspect ratio honest. */
const ART = { width: 865, height: 276 };

export function Logo({
  tone = "gold",
  className,
  priority = false,
}: {
  tone?: LogoTone;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={img(tone === "light" ? "logo-feezee-light.png" : "logo-feezee.png")}
      alt="FEEZEE Fashion"
      width={ART.width}
      height={ART.height}
      preload={priority}
      sizes="(max-width: 860px) 220px, 400px"
      className={cn("w-auto object-contain", className)}
    />
  );
}
