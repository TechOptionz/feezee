/**
 * Partial redaction for details shown on a page a stranger might reach.
 *
 * These are not a security control on their own — they are what is left when
 * the page has already decided the viewer has not proved who they are. The
 * point is recognition without disclosure: enough for the person who owns the
 * detail to nod at it, not enough for anyone else to use it.
 */

/** `ayesha@gmail.com` -> `a••••@gmail.com`. The domain is not the secret. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "•••••";

  const local = email.slice(0, at);
  const domain = email.slice(at);
  // Two characters of a three-letter local part gives most of it away, so the
  // first is all that is ever kept regardless of length.
  return `${local[0]}${"•".repeat(Math.max(4, local.length - 1))}${domain}`;
}

/**
 * The last four digits, which is what a courier reads back and what the owner
 * recognises. Anything shorter than four digits is withheld entirely rather
 * than shown in full.
 */
export function maskPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 4 ? `Ending ${digits.slice(-4)}` : null;
}
