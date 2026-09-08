export function SearchIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="6" stroke="currentColor" strokeWidth="1.5" />
      <line x1="13" y1="13" x2="18" y2="18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * The wishlist mark, in the header and on every product tile. `filled` is the
 * saved state — same outline, flooded, so the two states sit on exactly the
 * same silhouette and the icon does not appear to jump when it is tapped.
 */
export function HeartIcon({
  size = 26,
  filled = false,
}: {
  size?: number;
  filled?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 16.5 3.9 10.6a3.75 3.75 0 0 1 5.3-5.3l.8.8.8-.8a3.75 3.75 0 0 1 5.3 5.3L10 16.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export function BagIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="14" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 6 V5 a3 3 0 0 1 6 0 V6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function ChatIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 5.5A1.5 1.5 0 0 1 4.5 4h11A1.5 1.5 0 0 1 17 5.5v7a1.5 1.5 0 0 1-1.5 1.5H8l-4 3v-3h-.5A1.5 1.5 0 0 1 2 12.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="9" r="0.9" fill="currentColor" />
      <circle cx="10" cy="9" r="0.9" fill="currentColor" />
      <circle cx="13" cy="9" r="0.9" fill="currentColor" />
    </svg>
  );
}

export function CloseIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <line x1="5" y1="5" x2="15" y2="15" stroke="currentColor" strokeWidth="1.5" />
      <line x1="15" y1="5" x2="5" y2="15" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function SendIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 10 17 3.5 13.5 17 10.2 11.4 3 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function TrashIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 6h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M6.5 6V4.6A1.1 1.1 0 0 1 7.6 3.5h4.8A1.1 1.1 0 0 1 13.5 4.6V6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M5.6 6h8.8l-.6 9.3a1.2 1.2 0 0 1-1.2 1.1H7.4a1.2 1.2 0 0 1-1.2-1.1L5.6 6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The `+` / `−` on the quantity stepper and the `+` that opens Filter and Sort.
 * One glyph, rotated: at `open` the plus loses its upright stroke and becomes a
 * minus, so the control says which way it will move next.
 */
export function PlusMinusIcon({
  size = 12,
  open = false,
}: {
  size?: number;
  open?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <line x1="1" y1="6" x2="11" y2="6" stroke="currentColor" strokeWidth="1.4" />
      <line
        x1="6"
        y1="1"
        x2="6"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.4"
        className="origin-center transition-transform duration-300"
        style={{ transform: open ? "scaleY(0)" : "scaleY(1)" }}
      />
    </svg>
  );
}

/**
 * The grid-density switches at the right of the toolbar. `columns` draws that
 * many bars, so the icon is a picture of the layout it selects.
 */
export function GridIcon({
  columns,
  size = 18,
}: {
  columns: 2 | 3 | 4;
  size?: number;
}) {
  const gap = 1.4;
  const width = (18 - gap * (columns - 1)) / columns;

  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      {Array.from({ length: columns }, (_, i) => (
        <rect
          key={i}
          x={i * (width + gap)}
          y={1}
          width={width}
          height={16}
          fill="currentColor"
        />
      ))}
    </svg>
  );
}

/**
 * The previous / next control on the boutique rail. One arrow drawn once and
 * mirrored for `left`, so the pair sits on exactly the same silhouette and the
 * two buttons cannot drift apart.
 */
export function ArrowIcon({
  size = 18,
  direction = "right",
}: {
  size?: number;
  direction?: "left" | "right";
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={direction === "left" ? "-scale-x-100" : undefined}
    >
      <line x1="3" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11.2 5.4 15.8 10l-4.6 4.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The three ways a look leaves this page: sent to one person, posted to
 * everyone, or copied for wherever else it is going. Drawn at the same weight
 * as the header icons so the row reads as one set.
 */
export function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.2A8.5 8.5 0 1 1 20.5 11.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 8.4c.3-.1.6 0 .8.3l.7 1.3c.1.3.1.6-.1.8l-.4.5c-.1.2-.2.4 0 .7.4.7 1 1.3 1.8 1.7.3.1.5.1.7-.1l.5-.5c.2-.2.5-.2.8-.1l1.3.7c.3.2.4.5.3.8-.2.7-.9 1.2-1.7 1.2-2.6 0-5.6-3-5.6-5.6 0-.8.5-1.5 1.2-1.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.6 21v-7.3h2.5l.4-2.9h-2.9V8.9c0-.8.2-1.4 1.4-1.4h1.6V4.9A20 20 0 0 0 15.3 4c-2.3 0-3.9 1.4-3.9 4v2.8H9v2.9h2.4V21h3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Copy link — two links of a chain, which is the sign everyone reads as one. */
export function LinkIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M10 13.8a3.6 3.6 0 0 0 5.4.4l2.4-2.4a3.6 3.6 0 0 0-5.1-5.1l-1.4 1.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 10.2a3.6 3.6 0 0 0-5.4-.4l-2.4 2.4a3.6 3.6 0 0 0 5.1 5.1l1.4-1.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The tick that replaces an icon for the second a copy has just happened. */
export function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The account link in the header — a head and shoulders, drawn as one line. */
export function AccountIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.8 20c0-3.6 3.2-5.8 7.2-5.8s7.2 2.2 7.2 5.8" />
    </svg>
  );
}
