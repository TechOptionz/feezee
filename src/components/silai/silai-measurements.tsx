import Image from "next/image";
import { silaiMeasurements } from "@/content/silai";
import { img } from "@/lib/assets";

/**
 * The measurements, on the panel colour the rest of the site keeps for the
 * Silai feature.
 *
 * The list is the whole point of the section, so the photograph is the narrow
 * half here rather than the wide one — the reverse of `CollectionNote`, which
 * leads on the frame because the words under it are only a caveat.
 */
export function SilaiMeasurements() {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(48px,8vw,100px)]">
      <div className="flex flex-wrap bg-panel">
        <div className="flex-[1_1_280px] min-h-[360px] relative overflow-hidden">
          <Image
            src={img(silaiMeasurements.image)}
            alt="A FEEZEE piece cut to measure"
            fill
            sizes="(max-width: 860px) 100vw, 460px"
            className="object-cover object-top"
          />
        </div>

        <div className="flex-[2_1_460px] p-[clamp(28px,4.4vw,60px)] flex flex-col gap-5">
          <p className="m-0 text-xs tracking-[0.32em] uppercase text-gold">
            What we need from you
          </p>
          <h2 className="m-0 font-display font-normal text-[clamp(24px,3.4vw,38px)] leading-[1.15] max-w-[20ch] text-pretty">
            Ten numbers, and the rest is our problem
          </h2>

          <div className="grid grid-cols-1 nav:grid-cols-3 gap-x-[clamp(18px,2.4vw,34px)] gap-y-7 border-y border-ink/10 py-[clamp(20px,2.6vw,30px)]">
            {silaiMeasurements.groups.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="m-0 text-[11.5px] tracking-[0.22em] uppercase text-cocoa">
                  {group.title}
                </h3>
                <ul className="m-0 p-0 list-none flex flex-col gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2.5 text-[14px] leading-[1.5] text-ink"
                    >
                      <span
                        aria-hidden
                        className="mt-[9px] h-px w-2.5 shrink-0 bg-gold"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="m-0 max-w-[62ch] text-[14.5px] leading-[1.7] text-cocoa">
            {silaiMeasurements.note}
          </p>
        </div>
      </div>
    </section>
  );
}
