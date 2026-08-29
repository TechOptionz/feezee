import { values } from "@/content/values";

export function Values() {
  return (
    <section className="max-w-[var(--fz-container)] mx-auto px-[18px] pt-[clamp(40px,6vw,72px)]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[22px] text-center border-y border-line py-[30px]">
        {values.map((value) => (
          <div key={value.title} className="flex flex-col gap-[5px] px-2">
            <div className="font-display text-[17px] text-gold">{value.title}</div>
            <div className="text-[13px] text-cocoa leading-[1.5]">{value.text}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
