import { formatPrice } from "@/lib/currency";
import { contact, site } from "@/lib/site";
import { formatUaePhone } from "@/modules/checkout";

/**
 * The emails, in the shop's own colours.
 *
 * Written as inline-styled tables rather than as anything modern, because email
 * clients are not browsers: Outlook has no flexbox, Gmail strips `<style>`
 * blocks, and a stylesheet in a `<head>` is thrown away by most of them. The
 * tokens are the same hexes as `tokens.css`, copied rather than imported — an
 * email cannot resolve a CSS custom property.
 */

const CREAM = "#faf6ee";
const INK = "#2b2118";
const COCOA = "#5b4c39";
const WINE = "#8f2d4f";
const LINE = "#e6dcc6";
const PANEL = "#f1e7d3";
const MUTED = "#8a7a5e";

/** HTML-escape anything that came from a person. */
function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailContent = { subject: string; html: string; text: string };

export type OrderEmailData = {
  orderNumber: string;
  customerName: string;
  placedAt: string;
  items: {
    productName: string;
    variantSize: string;
    quantity: number;
    unitPriceAed: number;
    totalAed: number;
  }[];
  subtotalAed: number;
  shippingFeeAed: number;
  vatAed: number;
  totalAed: number;
  paymentMethod: string;
  shippingAddressLine: string;
  shippingCity: string;
  shippingEmirate: string;
  customerPhone: string;
  instructions: string[];
};

function shell(title: string, body: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${CREAM};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${CREAM};border:1px solid ${LINE};">
  <tr><td style="background:${INK};padding:28px 30px;text-align:center;">
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:.22em;color:#e8d9b0;text-transform:uppercase;">FEEZEE</div>
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:.28em;color:#9c8b6a;text-transform:uppercase;margin-top:7px;">Fashion &middot; Dubai</div>
  </td></tr>
  <tr><td style="padding:30px;font-family:Helvetica,Arial,sans-serif;color:${COCOA};font-size:15px;line-height:1.65;">${body}</td></tr>
  <tr><td style="background:${INK};padding:22px 30px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#9c8b6a;">
    <div style="color:#d8cbb0;">${esc(contact.legalName)}</div>
    <div>${esc(contact.address.oneLine)}</div>
    <div><a href="mailto:${esc(contact.email)}" style="color:#d8cbb0;text-decoration:none;">${esc(contact.email)}</a> &middot; ${esc(contact.whatsapp.display)}</div>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:25px;line-height:1.2;color:${INK};text-transform:uppercase;letter-spacing:.02em;">${esc(text)}</h1>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr><td style="background:${INK};">
    <a href="${esc(href)}" style="display:inline-block;padding:14px 30px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:${CREAM};text-decoration:none;">${esc(label)}</a>
  </td></tr></table>`;
}

function itemRows(data: OrderEmailData): string {
  return data.items
    .map(
      (item) => `<tr>
      <td style="padding:11px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};">
        ${esc(item.productName)}
        <div style="color:${MUTED};font-size:12.5px;margin-top:3px;">Size ${esc(item.variantSize)} &middot; ${item.quantity} &times; ${esc(formatPrice(item.unitPriceAed))}</div>
      </td>
      <td align="right" style="padding:11px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${INK};white-space:nowrap;">${esc(formatPrice(item.totalAed))}</td>
    </tr>`,
    )
    .join("");
}

function totalsRows(data: OrderEmailData): string {
  const row = (label: string, value: string, bold = false) =>
    `<tr>
      <td style="padding:5px 0;font-size:14px;color:${bold ? INK : COCOA};${bold ? "font-weight:600;" : ""}">${esc(label)}</td>
      <td align="right" style="padding:5px 0;font-size:14px;color:${INK};${bold ? "font-weight:600;" : ""}white-space:nowrap;">${esc(value)}</td>
    </tr>`;

  return `${row("Subtotal", formatPrice(data.subtotalAed))}
    ${row("Delivery", data.shippingFeeAed === 0 ? "Free" : formatPrice(data.shippingFeeAed))}
    ${row("VAT (5%)", formatPrice(data.vatAed))}
    <tr><td colspan="2" style="border-top:1px solid ${LINE};height:8px;"></td></tr>
    ${row("Total", formatPrice(data.totalAed), true)}`;
}

function instructionBlock(lines: string[]): string {
  if (lines.length === 0) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PANEL};margin:22px 0;"><tr><td style="padding:18px 20px;font-size:14px;line-height:1.7;color:${COCOA};">
    ${lines.map((line) => `<div>${esc(line)}</div>`).join("")}
  </td></tr></table>`;
}

function addressBlock(data: OrderEmailData): string {
  return `<div style="margin:22px 0;font-size:14px;line-height:1.7;color:${COCOA};">
    <div style="font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:${MUTED};margin-bottom:6px;">Delivering to</div>
    <div style="color:${INK};">${esc(data.customerName)}</div>
    <div>${esc(data.shippingAddressLine)}</div>
    <div>${esc(data.shippingCity)}, ${esc(data.shippingEmirate)}</div>
    <div>${esc(formatUaePhone(data.customerPhone))}</div>
  </div>`;
}

export function orderConfirmationEmail(data: OrderEmailData): EmailContent {
  const url = `${site.url}/order-confirmation/${data.orderNumber}`;

  const html = shell(
    `Order ${data.orderNumber}`,
    `${heading("Thank you — your order is in")}
     <p style="margin:0 0 6px;">Dear ${esc(data.customerName)},</p>
     <p style="margin:0 0 4px;">We have your order <strong style="color:${INK};">${esc(data.orderNumber)}</strong> and it is being prepared in the studio.</p>
     ${instructionBlock(data.instructions)}
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">${itemRows(data)}</table>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;">${totalsRows(data)}</table>
     ${addressBlock(data)}
     ${button(url, "View your order")}
     <p style="margin:18px 0 0;font-size:13.5px;color:${MUTED};">Questions? Reply to this email or message us on WhatsApp at ${esc(contact.whatsapp.display)}.</p>`,
  );

  const text = [
    `Thank you — order ${data.orderNumber} is in.`,
    "",
    ...data.items.map(
      (i) => `${i.quantity} x ${i.productName} (${i.variantSize}) — ${formatPrice(i.totalAed)}`,
    ),
    "",
    `Subtotal: ${formatPrice(data.subtotalAed)}`,
    `Delivery: ${data.shippingFeeAed === 0 ? "Free" : formatPrice(data.shippingFeeAed)}`,
    `VAT (5%): ${formatPrice(data.vatAed)}`,
    `Total: ${formatPrice(data.totalAed)}`,
    "",
    ...data.instructions,
    "",
    url,
  ].join("\n");

  return { subject: `FEEZEE order ${data.orderNumber} confirmed`, html, text };
}

export function orderDispatchedEmail(data: {
  orderNumber: string;
  customerName: string;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string | null;
}): EmailContent {
  const url = `${site.url}/order-confirmation/${data.orderNumber}`;

  const html = shell(
    `Order ${data.orderNumber} is on its way`,
    `${heading("Your parcel is on its way")}
     <p style="margin:0 0 6px;">Dear ${esc(data.customerName)},</p>
     <p style="margin:0 0 4px;">Order <strong style="color:${INK};">${esc(data.orderNumber)}</strong> left the studio today with ${esc(data.courierName)}.</p>
     ${instructionBlock([
       `Courier: ${data.courierName}`,
       `Tracking number: ${data.trackingNumber}`,
     ])}
     ${button(data.trackingUrl ?? url, data.trackingUrl ? "Track your parcel" : "View your order")}
     <p style="margin:18px 0 0;font-size:13.5px;color:${MUTED};">Tracking can take a few hours to show its first scan.</p>`,
  );

  return {
    subject: `FEEZEE order ${data.orderNumber} has been dispatched`,
    html,
    text: `Order ${data.orderNumber} is on its way with ${data.courierName}. Tracking: ${data.trackingNumber}. ${data.trackingUrl ?? url}`,
  };
}

export function returnUpdateEmail(data: {
  returnNumber: string;
  orderNumber: string;
  customerName: string;
  status: string;
  refundAmountAed?: number | null;
  adminNotes?: string | null;
}): EmailContent {
  const wording: Record<string, string> = {
    PENDING: "We have your return request and are reviewing it.",
    APPROVED: "Your return has been approved. Please send the pieces back to us.",
    RECEIVED: "Your return has arrived with us and is being checked.",
    REFUNDED: "Your refund has been issued.",
    REJECTED: "We were not able to accept this return.",
  };

  const lines = [
    `Return ${data.returnNumber}, on order ${data.orderNumber}.`,
    ...(data.refundAmountAed
      ? [`Refund: ${formatPrice(data.refundAmountAed)}`]
      : []),
    ...(data.adminNotes ? [data.adminNotes] : []),
  ];

  const html = shell(
    `Return ${data.returnNumber}`,
    `${heading("An update on your return")}
     <p style="margin:0 0 6px;">Dear ${esc(data.customerName)},</p>
     <p style="margin:0 0 4px;">${esc(wording[data.status] ?? "Your return has been updated.")}</p>
     ${instructionBlock(lines)}
     ${button(`${site.url}/account/returns`, "View your returns")}`,
  );

  return {
    subject: `FEEZEE return ${data.returnNumber} — ${data.status.toLowerCase()}`,
    html,
    text: [wording[data.status] ?? "Your return has been updated.", ...lines].join("\n"),
  };
}

export function passwordResetEmail(data: {
  customerName: string;
  resetUrl: string;
}): EmailContent {
  const html = shell(
    "Reset your password",
    `${heading("Reset your password")}
     <p style="margin:0 0 6px;">Dear ${esc(data.customerName)},</p>
     <p style="margin:0 0 4px;">Use the button below to choose a new password. The link works once and expires in an hour.</p>
     ${button(data.resetUrl, "Choose a new password")}
     <p style="margin:18px 0 0;font-size:13.5px;color:${MUTED};">If you did not ask for this, you can ignore this email — nothing has changed.</p>
     <p style="margin:10px 0 0;font-size:12.5px;color:${WINE};word-break:break-all;">${esc(data.resetUrl)}</p>`,
  );

  return {
    subject: "Reset your FEEZEE password",
    html,
    text: `Reset your FEEZEE password (the link expires in an hour):\n${data.resetUrl}`,
  };
}
