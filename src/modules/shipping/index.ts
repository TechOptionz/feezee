/**
 * Couriers, and where a customer goes to watch the parcel move.
 *
 * Each courier owns the shape of its own tracking URL, so the order page and
 * the dispatch email both get a working link from a tracking number and a name
 * — and adding a courier is one entry here rather than a new `if` in three
 * templates.
 */

export type CourierId =
  | "ARAMEX"
  | "EMIRATES_POST"
  | "FETCHR"
  | "DHL"
  | "LOCAL";

export type Courier = {
  id: CourierId;
  /** What the customer is told carried the parcel. */
  name: string;
  /** Typical door-to-door time, printed beside the tracking link. */
  transit: string;
  /** Null for the in-house rider, who has no tracking site to point at. */
  track: ((trackingNumber: string) => string) | null;
};

export const COURIERS: Courier[] = [
  {
    id: "ARAMEX",
    name: "Aramex",
    transit: "1–2 working days across the UAE",
    track: (n) => `https://www.aramex.com/us/en/track/results?ShipmentNumber=${encodeURIComponent(n)}`,
  },
  {
    id: "EMIRATES_POST",
    name: "Emirates Post",
    transit: "2–4 working days across the UAE",
    track: (n) => `https://www.emiratespost.ae/track?trackingNumber=${encodeURIComponent(n)}`,
  },
  {
    id: "FETCHR",
    name: "Fetchr",
    transit: "1–3 working days across the UAE",
    track: (n) => `https://track.fetchr.us/#/track/${encodeURIComponent(n)}`,
  },
  {
    id: "DHL",
    name: "DHL Express",
    transit: "3–7 working days internationally",
    track: (n) => `https://www.dhl.com/ae-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
  },
  {
    id: "LOCAL",
    name: "FEEZEE Local Courier",
    transit: "Same or next day inside Dubai",
    track: null,
  },
];

const byId = new Map(COURIERS.map((c) => [c.id, c]));
const byName = new Map(COURIERS.map((c) => [c.name.toLowerCase(), c]));

export function courier(id: CourierId): Courier | undefined {
  return byId.get(id);
}

/**
 * The tracking URL for a courier, or null.
 *
 * Takes the courier by *name* because that is what the order row stores — the
 * name is what the customer is told, and it stays readable if a courier is
 * later removed from the list above.
 */
export function trackingUrlFor(
  courierName: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  if (!courierName || !trackingNumber) return null;
  const found = byName.get(courierName.trim().toLowerCase());
  return found?.track ? found.track(trackingNumber.trim()) : null;
}

/** Every courier name, for the admin's dispatch dropdown. */
export function courierNames(): string[] {
  return COURIERS.map((c) => c.name);
}
