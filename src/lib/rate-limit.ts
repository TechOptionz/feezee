import "server-only";
import { headers } from "next/headers";

/**
 * A fixed-window rate limit, keyed by whatever the caller chooses.
 *
 * In memory, so it resets on deploy and does not span instances. That is the
 * honest limit of it: it raises the cost of abuse from one address, and it is
 * not a defence against a distributed attacker. Move it to the database or a
 * cache if the shop ever runs more than one node.
 */
export function createRateLimit({
  windowMs,
  max,
}: {
  windowMs: number;
  max: number;
}) {
  const attempts = new Map<string, { count: number; resetAt: number }>();

  /** True when `key` has used up its allowance for the current window. */
  return function limited(key: string): boolean {
    const now = Date.now();

    // Swept on the way past rather than on a timer, so an idle server holds
    // nothing and a busy one never accumulates yesterday's callers.
    if (attempts.size > 5000) {
      for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
    }

    const current = attempts.get(key);
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return false;
    }

    current.count += 1;
    return current.count > max;
  };
}

/** Best-effort caller identity. A missing header limits everyone as one. */
export async function callerKey(): Promise<string> {
  try {
    const list = await headers();
    const forwarded = list.get("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
  } catch {
    return "unknown";
  }
}
