import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "../i18n/context";
import { ChatIcon, WhatsAppIcon } from "./icons";
import { whatsappHref } from "../data/company";
import { ASSISTANT_ENDPOINT, buildReply, detectIntent } from "../lib/assistant";
import { LogoMark } from "./Logo";

const HIDDEN_KEY = "jd-assistant-hidden";
const CHIPS = ["services", "proposal", "contact", "careers", "about", "human"];

function readHidden() {
  try {
    return sessionStorage.getItem(HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

// Bot messages store the intent, not the text, so switching language re-renders the whole
// conversation. Replies from an optional AI endpoint are stored as plain text.
function BotMessage({ message, t, onNavigate }) {
  const reply = message.text ? { text: message.text } : buildReply(message.intent, t, message.question);
  const linkClass = "inline-flex items-center gap-1.5 rounded-full border border-navy/15 bg-white px-3 py-1 text-xs font-semibold text-navy transition-colors hover:border-orange hover:text-orange";
  return (
    <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-[#f1f4f7] px-4 py-3 text-sm text-navy">
      {reply.title && <p className="mb-1 font-display font-bold">{reply.title}</p>}
      <p className="leading-relaxed">{reply.text}</p>
      {reply.quote && <p className="mt-2 border-l-2 border-orange pl-3 text-navy/80">{reply.quote}</p>}
      {reply.list && (
        <ul className="mt-2 space-y-1">
          {reply.list.map((item) => (
            <li key={item} className="flex gap-2 text-navy/80">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rotate-45 bg-orange" />
              {item}
            </li>
          ))}
        </ul>
      )}
      {reply.extra && <p className="mt-2 text-xs text-navy/60">{reply.extra}</p>}
      {reply.links?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {reply.links.map((link) =>
            link.to ? (
              <Link key={link.label} to={link.to} onClick={onNavigate} className={linkClass}>
                {link.label} →
              </Link>
            ) : (
              <a key={link.label} href={link.href} className={linkClass} {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {link.kind === "whatsapp" && <WhatsAppIcon className="h-3.5 w-3.5 text-[#128C4B]" />}
                {link.label}
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function SupportChat() {
  const { t, lang } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(readHidden);
  const [messages, setMessages] = useState([{ from: "bot", intent: "intro" }]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const root = useRef(null);
  const launcher = useRef(null);
  const input = useRef(null);
  const log = useRef(null);
  const a = t.assistant;

  useEffect(() => {
    if (!open) return undefined;
    input.current?.focus();
    const close = (event) => {
      if (event.type === "keydown" ? event.key === "Escape" : !root.current.contains(event.target)) {
        setOpen(false);
        if (event.type === "keydown") launcher.current?.focus();
      }
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, typing, open]);

  if (hidden) return null;

  function hide() {
    setHidden(true);
    try {
      sessionStorage.setItem(HIDDEN_KEY, "1");
    } catch {
      // storage unavailable: hidden for this page view only
    }
  }

  async function answer(intent, question) {
    setTyping(true);
    let botMessage = { from: "bot", intent, question };
    if (intent === "fallback" && ASSISTANT_ENDPOINT && question) {
      try {
        const response = await fetch(ASSISTANT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, lang }),
        });
        const data = await response.json();
        if (response.ok && data.reply) botMessage = { from: "bot", text: data.reply };
      } catch {
        // keep the hand-off-to-the-team reply
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 150 : 550 + Math.random() * 400));
    }
    setTyping(false);
    setMessages((current) => [...current, botMessage]);
  }

  function ask(event) {
    event.preventDefault();
    const question = draft.trim();
    if (!question || typing) return;
    setDraft("");
    if (input.current) input.current.style.height = "auto";
    setMessages((current) => [...current, { from: "user", text: question }]);
    answer(detectIntent(question), question);
  }

  function choose(chip) {
    if (typing) return;
    setMessages((current) => [...current, { from: "user", chip }]);
    answer(chip);
  }

  return (
    <div ref={root} className="fixed bottom-4 right-4 z-40 flex flex-col items-end sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            id="support-chat"
            role="dialog"
            aria-label={a.name}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 flex h-[36rem] max-h-[calc(100svh-6.5rem)] w-[23rem] max-w-[calc(100vw-2rem)] origin-bottom-right flex-col overflow-hidden rounded-3xl bg-white text-navy shadow-[0_30px_70px_-25px_rgba(14,41,62,0.55)]"
          >
            <div className="relative flex-none overflow-hidden bg-navy px-4 py-3.5 text-white">
              <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full" aria-hidden="true">
                <path d="M0 60 L0 42 L40 28 L75 38 L120 16 L160 34 L205 22 L245 38 L300 26 L300 60 Z" fill="#ffffff" fillOpacity="0.05" />
                <path d="M0 60 L0 50 L60 43 L110 50 L170 40 L230 51 L300 44 L300 60 Z" fill="#E28A2E" fillOpacity="0.15" />
              </svg>
              <div className="relative flex items-center gap-3">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white p-1">
                  <LogoMark className="h-full w-full" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold leading-tight">{a.name}</p>
                  <p className="flex items-center gap-1.5 text-[11px] text-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                    {a.status}
                  </p>
                </div>
                <a
                  href={whatsappHref(a.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={a.links.whatsapp}
                  title={a.links.whatsapp}
                  className="grid h-8 w-8 place-items-center rounded-full bg-[#25D366] text-white transition hover:brightness-110"
                >
                  <WhatsAppIcon />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    launcher.current?.focus();
                  }}
                  aria-label={a.minimize}
                  title={a.minimize}
                  className="grid h-8 w-8 place-items-center rounded-full border border-white/20 transition-colors hover:border-orange hover:text-orange"
                >
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M2 6h8" />
                  </svg>
                </button>
              </div>
            </div>

            <div ref={log} role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
              {messages.map((message, i) =>
                message.from === "user" ? (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl rounded-tr-md bg-navy px-4 py-2.5 text-sm text-white">{message.chip ? a.chips[message.chip] : message.text}</p>
                  </div>
                ) : (
                  <BotMessage key={i} message={message} t={t} onNavigate={() => setOpen(false)} />
                )
              )}
              {typing && (
                <div className="flex w-fit items-center gap-1 rounded-2xl rounded-tl-md bg-[#f1f4f7] px-4 py-3" aria-label={a.typing}>
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="h-1.5 w-1.5 rounded-full bg-navy/50"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15 }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex-none border-t border-navy/10 px-3 pb-3 pt-2.5">
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2.5 [scrollbar-width:none]">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => choose(chip)}
                    className="flex-none rounded-full border border-navy/15 px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-orange hover:text-orange"
                  >
                    {a.chips[chip]}
                  </button>
                ))}
              </div>
              <form
                onSubmit={ask}
                className="flex items-end gap-2 rounded-2xl bg-[#f1f4f7] py-1.5 pl-4 pr-1.5"
              >
                <label htmlFor="assistant-input" className="sr-only">
                  {a.inputLabel}
                </label>
                <textarea
                  ref={input}
                  id="assistant-input"
                  rows={1}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    // Grow with the text, up to about four lines.
                    event.target.style.height = "auto";
                    event.target.style.height = `${Math.min(event.target.scrollHeight, 96)}px`;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) ask(event);
                  }}
                  placeholder={a.placeholder}
                  autoComplete="off"
                  maxLength={500}
                  className="max-h-24 min-w-0 flex-1 resize-none self-center bg-transparent py-1.5 text-sm leading-5 text-navy outline-none placeholder:text-navy/40 focus-visible:outline-none"
                />
                <button
                  type="submit"
                  aria-label={a.send}
                  title={a.send}
                  disabled={!draft.trim() || typing}
                  className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-navy text-white transition hover:bg-navy-light disabled:bg-navy/15 disabled:text-navy/40"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                    <path d="M3.4 20.4 21 12 3.4 3.6l-.1 6.5L15 12l-11.7 1.9z" />
                  </svg>
                </button>
              </form>
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="text-[10px] leading-snug text-navy/45">{a.disclaimer}</p>
                <button type="button" onClick={hide} className="flex-none text-[10px] font-semibold text-navy/45 underline-offset-2 hover:text-navy hover:underline">
                  {a.hide}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={launcher}
        type="button"
        aria-expanded={open}
        aria-controls="support-chat"
        aria-label={a.open}
        onClick={() => setOpen((value) => !value)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="group flex h-12 items-center gap-2.5 rounded-full bg-navy pl-1.5 pr-1.5 text-sm font-semibold text-white shadow-[0_18px_40px_-15px_rgba(14,41,62,0.7)] transition-colors hover:bg-navy-light sm:pr-5"
      >
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-orange text-navy">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid place-items-center"
            >
              {open ? (
                <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              ) : (
                <ChatIcon className="h-[18px] w-[18px]" />
              )}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className="hidden sm:inline">{a.launcher}</span>
      </motion.button>
    </div>
  );
}
