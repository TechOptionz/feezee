import "server-only";
import { contact } from "@/lib/site";
import type { EmailContent } from "@/modules/notifications/templates";

export * from "@/modules/notifications/templates";

/**
 * Sending email, and carrying on when it fails.
 *
 * A transport is one function. Resend is the configured one; the console is the
 * fallback, and in development it is the *better* one — a developer wants to
 * read the receipt in their terminal, not to actually post it to a customer.
 * An SMTP transport drops in beside `resendTransport` with the same shape.
 *
 * Nothing here ever throws into a caller. An order that is placed, paid and
 * stocked must not be undone because a mail server was briefly unreachable —
 * the customer has the confirmation page either way, and the failure goes to
 * the server log for someone to notice.
 */

export type Email = EmailContent & { to: string; replyTo?: string };

export type SendResult = {
  ok: boolean;
  transport: "resend" | "console";
  id?: string;
  error?: string;
};

type Transport = (email: Email) => Promise<SendResult>;

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || `FEEZEE Fashion <${contact.email}>`;
}

const resendTransport: Transport = async (email) => {
  const key = process.env.RESEND_API_KEY!.trim();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
      reply_to: email.replyTo ?? contact.email,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };

  if (!response.ok) {
    return {
      ok: false,
      transport: "resend",
      error: body.message ?? `Resend returned ${response.status}`,
    };
  }
  return { ok: true, transport: "resend", id: body.id };
};

const consoleTransport: Transport = async (email) => {
  console.info(
    [
      "",
      "──────────── email (not sent: no RESEND_API_KEY) ────────────",
      `To:      ${email.to}`,
      `From:    ${fromAddress()}`,
      `Subject: ${email.subject}`,
      "",
      email.text,
      "─────────────────────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
  return { ok: true, transport: "console" };
};

function transport(): Transport {
  return process.env.RESEND_API_KEY?.trim() ? resendTransport : consoleTransport;
}

/** Send one email. Never throws. */
export async function sendEmail(email: Email): Promise<SendResult> {
  try {
    return await transport()(email);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[email] failed to send "${email.subject}" to ${email.to}:`, message);
    return { ok: false, transport: "console", error: message };
  }
}

/**
 * Send without making the caller wait.
 *
 * Used on the checkout path: the customer should see their confirmation page as
 * soon as the order is written, not after a mail API has answered.
 */
export function sendEmailInBackground(email: Email): void {
  void sendEmail(email);
}
