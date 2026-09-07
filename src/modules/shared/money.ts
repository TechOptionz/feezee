import { Prisma } from "@prisma/client";

/**
 * Money, in one place.
 *
 * Every amount that touches the database is a `Decimal(10,2)` in dirhams.
 * Every amount that touches React is a plain `number`, because a Prisma
 * `Decimal` is a class instance and a server component cannot serialise one
 * into a client component — it throws at render time, not at compile time,
 * which is the worst place to find out.
 *
 * Arithmetic happens in **fils** (1 AED = 100 fils) as integers. 5% VAT on
 * AED 209.35 is exactly the shape of sum that leaves 0.000000001 behind in
 * binary floating point, and an invoice whose lines do not add up to its total
 * is a support ticket every time.
 */

/** A Decimal (or anything Decimal-like) as a plain number of dirhams. */
export function toAed(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

/** Same, but preserving null — for optional columns like `wasAed`. */
export function toAedOrNull(
  value: Prisma.Decimal | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : value.toNumber();
}

/** A number of dirhams as the Decimal the database column wants. */
export function toDecimal(aed: number): Prisma.Decimal {
  return new Prisma.Decimal(round2(aed).toFixed(2));
}

/** Dirhams to whole fils. */
export function toFils(aed: number): number {
  return Math.round(aed * 100);
}

/** Fils back to dirhams. */
export function fromFils(fils: number): number {
  return fils / 100;
}

/**
 * Round to two decimals, away from zero on a tie.
 *
 * `Math.round` alone is not enough: `Math.round(1.005 * 100) / 100` is 1 in
 * JavaScript, because 1.005 is really 1.00499999999999989. Going through a
 * fixed-point string first is what makes 1.005 round to 1.01 the way a person
 * reading the invoice expects.
 */
export function round2(value: number): number {
  return Math.round(Number(`${value}e2`)) / 100;
}
