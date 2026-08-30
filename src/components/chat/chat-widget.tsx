"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useStore } from "@/components/store/store-provider";
import { ChatIcon, CloseIcon, SendIcon } from "@/components/ui/icons";
import {
  fallbackLines,
  matchTopic,
  rootTopicIds,
  topicsByIds,
  welcomeLines,
  type ChatTopic,
} from "@/content/chatbot";
import { productsByIds } from "@/content/products";
import { img } from "@/lib/assets";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

/** Long enough to read as an answer being written, short enough not to wait. */
const REPLY_DELAY_MS = 520;

type Message = {
  id: number;
  from: "bot" | "visitor";
  lines: string[];
  productIds?: number[];
};

/**
 * The shop assistant.
 *
 * It answers only from `@/content/chatbot` — a written script, no model — so a
 * reply is either one of the topics or the fallback that points at WhatsApp.
 * Chips carry the conversation; the input is there for visitors who would
 * rather type, and is routed to the same topics by keyword.
 */
export function ChatWidget() {
  const { currency } = useStore();
  const price = useCallback((aed: number) => formatPrice(aed, currency), [currency]);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chipIds, setChipIds] = useState<readonly string[]>(rootTopicIds);
  const [thinking, setThinking] = useState(false);
  const [draft, setDraft] = useState("");

  const panelId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(0);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback((message: Omit<Message, "id">) => {
    setMessages((list) => [...list, { ...message, id: nextId.current++ }]);
  }, []);

  /* The greeting is a message like any other, written the first time it opens. */
  useEffect(() => {
    if (!open || messages.length > 0) return;
    push({ from: "bot", lines: welcomeLines });
  }, [open, messages.length, push]);

  /* A pending reply must not land in a conversation that has been closed. */
  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
  }, []);

  useEffect(() => {
    if (!open) return;
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /** Says `question` as the visitor, then answers with `topic` or the fallback. */
  const ask = useCallback(
    (question: string, topic: ChatTopic | null) => {
      if (replyTimer.current) clearTimeout(replyTimer.current);

      push({ from: "visitor", lines: [question] });
      setChipIds([]);
      setThinking(true);

      replyTimer.current = setTimeout(() => {
        setThinking(false);
        push(
          topic
            ? { from: "bot", lines: topic.lines(price), productIds: topic.productIds }
            : { from: "bot", lines: fallbackLines },
        );
        setChipIds(topic?.followUps?.length ? topic.followUps : rootTopicIds);
      }, REPLY_DELAY_MS);
    },
    [price, push],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || thinking) return;
    setDraft("");
    ask(text, matchTopic(text));
  }

  const chips = topicsByIds(chipIds);

  return (
    <>
      {/* Sits above the header (z-50) and below the mobile drawer (z-90). */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close the FEEZEE assistant" : "Ask the FEEZEE assistant"}
        className={cn(
          "fixed bottom-5 right-5 z-70 w-14 h-14 rounded-full cursor-pointer",
          "flex items-center justify-center border border-gold/40",
          "bg-ink text-champagne shadow-[0_10px_30px_rgba(43,33,24,0.35)]",
          "transition-transform duration-300 hover:scale-105",
          "motion-reduce:transition-none motion-reduce:hover:scale-100",
          open && "max-[520px]:hidden",
        )}
      >
        {open ? <CloseIcon size={22} /> : <ChatIcon size={24} />}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="FEEZEE assistant"
          className={cn(
            "fixed z-70 flex flex-col overflow-hidden bg-cream",
            "border border-line shadow-[0_24px_60px_rgba(43,33,24,0.28)]",
            "bottom-24 right-5 w-[min(380px,calc(100vw-40px))] max-h-[min(560px,calc(100vh-140px))]",
            "max-[520px]:inset-x-3 max-[520px]:bottom-3 max-[520px]:top-3 max-[520px]:w-auto max-[520px]:max-h-none",
            "fz-rise",
          )}
        >
          <header className="flex items-center justify-between gap-3 bg-ink px-5 py-4">
            <div className="flex flex-col gap-1">
              <span className="font-display text-[17px] leading-none text-champagne">
                FEEZEE Assistant
              </span>
              <span className="text-[12px] tracking-[0.18em] uppercase text-taupe">
                Answers in seconds
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close the assistant"
              className="-mr-2 cursor-pointer border-none bg-transparent p-2 text-sandstone hover:text-champagne"
            >
              <CloseIcon size={18} />
            </button>
          </header>

          <div
            ref={logRef}
            aria-live="polite"
            className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message) => (
              <Bubble key={message.id} message={message} price={price} />
            ))}
            {thinking && <Thinking />}
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t border-line px-4 pt-3 pb-1">
              {chips.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => ask(topic.question, topic)}
                  className={cn(
                    "cursor-pointer rounded-full border border-line bg-transparent",
                    "px-3.5 py-2 text-[13.5px] text-cocoa transition-colors duration-200",
                    "hover:border-gold hover:text-ink",
                  )}
                >
                  {topic.question}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex items-center gap-2 px-4 pt-3 pb-4">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a piece, a size, delivery…"
              aria-label="Ask the assistant a question"
              className={cn(
                "min-w-0 flex-1 border border-line bg-transparent px-3.5 py-3",
                "text-[15px] text-ink outline-none placeholder:text-muted focus:border-gold",
              )}
            />
            <button
              type="submit"
              disabled={!draft.trim() || thinking}
              aria-label="Send"
              className={cn(
                "flex h-[42px] w-[42px] shrink-0 items-center justify-center border-none",
                "cursor-pointer bg-ink text-cream transition-opacity duration-200",
                "disabled:cursor-not-allowed disabled:opacity-35",
              )}
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Bubble({ message, price }: { message: Message; price: (aed: number) => string }) {
  const fromBot = message.from === "bot";
  const looks = message.productIds ? productsByIds(message.productIds) : [];

  return (
    <div className={cn("flex flex-col gap-2", fromBot ? "items-start" : "items-end")}>
      <div
        className={cn(
          "max-w-[85%] px-4 py-3 text-[14.5px] leading-[1.65]",
          fromBot ? "bg-panel text-cocoa" : "bg-ink text-sandstone",
        )}
      >
        {message.lines.map((line, i) => (
          <p key={i} className={cn("m-0", i > 0 && "mt-2")}>
            {line}
          </p>
        ))}
      </div>

      {looks.length > 0 && (
        <ul className="m-0 flex w-full list-none flex-col gap-2 p-0">
          {looks.map((product) => (
            <li key={product.id} className="flex items-center gap-3 border border-line p-2">
              <div className="relative h-[54px] w-[44px] shrink-0 overflow-hidden bg-sand">
                <Image
                  src={img(product.img)}
                  alt={product.name}
                  fill
                  sizes="44px"
                  className="object-cover object-top"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[14px] text-ink">{product.name}</span>
                <span className="truncate text-[12.5px] text-muted">{product.fabric}</span>
                <span className="text-[13.5px] text-ink">
                  {price(product.aed)}
                  {product.wasAed && (
                    <span className="ml-2 text-muted line-through">{price(product.wasAed)}</span>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-1.5 self-start bg-panel px-4 py-4">
      <span className="sr-only">Writing a reply</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ animationDelay: `${i * 160}ms` }}
          className="h-1.5 w-1.5 rounded-full bg-muted fz-typing"
        />
      ))}
    </div>
  );
}
