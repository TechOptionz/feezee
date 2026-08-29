import { cn } from "@/lib/utils";

type Variant = "header" | "drawer" | "footer";

const MARK: Record<Variant, string> = {
  header: "font-display text-[clamp(19px,5vw,24px)] tracking-[0.26em] text-gold leading-none whitespace-nowrap -mr-[0.26em]",
  drawer: "font-display text-[22px] tracking-[0.3em] text-gold leading-none",
  footer: "font-display text-[24px] tracking-[0.3em] text-champagne",
};

const SUB: Record<Variant, string> = {
  header: "text-[8px] tracking-[0.4em] text-muted uppercase mt-1 flex items-center justify-center gap-[5px] whitespace-nowrap",
  drawer: "text-[8px] tracking-[0.48em] text-muted uppercase mt-1 flex items-center gap-[6px]",
  footer: "text-[10px] tracking-[0.48em] text-taupe uppercase -mt-1.5 flex items-center gap-[7px]",
};

const RULE: Record<Variant, string> = {
  header: "inline-block w-3 h-px bg-gold",
  drawer: "inline-block w-3 h-px bg-gold",
  footer: "inline-block w-3.5 h-px bg-taupe",
};

/** The FEEZEE lockup: serif wordmark over a rule-flanked "Fashion" line. */
export function Wordmark({ variant, className }: { variant: Variant; className?: string }) {
  return (
    <div className={className}>
      <div className={MARK[variant]}>FEEZEE</div>
      <div className={SUB[variant]}>
        <span className={RULE[variant]} />
        <span className={cn(variant === "header" && "-mr-[0.4em]")}>Fashion</span>
        <span className={RULE[variant]} />
      </div>
    </div>
  );
}
