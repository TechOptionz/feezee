"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  FacebookIcon,
  LinkIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/**
 * "Share this look" — the row that closes the buying panel.
 *
 * WhatsApp is first because that is where this shop's customers send a picture
 * of a suit to their sister before they buy it. The copy button is the fallback
 * for everywhere else, and it says it worked in place, rather than through a
 * toast that would cover the page it just copied.
 */
export function ShareRow({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = useCallback(async () => {
    /* `navigator.clipboard` needs a secure context, which a phone on a local
       network does not always have. The selection fallback is what keeps the
       button honest there rather than silently doing nothing. */
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const field = document.createElement("textarea");
      field.value = url;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(field);
      }
    }

    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }, [url]);

  const message = `${name} — FEEZEE\n${url}`;

  return (
    <div className="flex items-center gap-4">
      <span className="text-[11px] tracking-[0.24em] uppercase text-muted">
        Share this look
      </span>

      <div className="flex items-center gap-1.5">
        <ShareLink
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          label={`Share ${name} on WhatsApp`}
        >
          <WhatsAppIcon />
        </ShareLink>

        <ShareLink
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          label={`Share ${name} on Facebook`}
        >
          <FacebookIcon />
        </ShareLink>

        <button
          type="button"
          onClick={copy}
          aria-label={`Copy the link to ${name}`}
          className={cn(
            "w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors duration-200",
            copied ? "text-gold-dark" : "text-ink hover:text-gold-dark",
          )}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
        </button>

        <span aria-live="polite" className="sr-only">
          {copied ? "Link copied" : ""}
        </span>
      </div>
    </div>
  );
}

function ShareLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 flex items-center justify-center text-ink hover:text-gold-dark transition-colors duration-200"
    >
      {children}
    </a>
  );
}
