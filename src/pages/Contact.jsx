import { useState } from "react";
import { motion } from "framer-motion";
import PageHero from "../components/PageHero";
import { Reveal, Stagger } from "../components/motion";
import NavyPattern from "../components/NavyPattern";
import { staggerItem } from "../components/variants";
import { ServiceIllustration } from "../components/illustrations";
import { useLanguage } from "../i18n/context";

const EMAIL = "contact@jdmining.rw";

function Field({ id, label, type = "text", required = true, multiline = false }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <div className="relative">
      <Tag
        id={id}
        name={id}
        type={multiline ? undefined : type}
        rows={multiline ? 5 : undefined}
        required={required}
        placeholder=" "
        className="peer w-full resize-none rounded-2xl border-2 border-navy/15 bg-white px-4 pb-3 pt-7 text-navy outline-none transition hover:border-navy/30 focus:border-orange focus:shadow-[0_0_0_4px_rgba(226,138,46,0.15)]"
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-2.5 text-[11px] font-semibold uppercase tracking-widest text-navy/50 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-2.5 peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-orange"
      >
        {label}
      </label>
    </div>
  );
}

function StepTitle({ number, children }) {
  return (
    <p className="flex items-center gap-3 font-display text-lg font-bold text-navy">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-orange text-sm text-navy">{number}</span>
      {children}
    </p>
  );
}

export default function Contact() {
  const { t } = useLanguage();
  const [topic, setTopic] = useState(0);
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }

  return (
    <>
      <PageHero eyebrow={t.contact.eyebrow} title={t.contact.title} description={t.contact.description}>
        <div className="p-6">
          <ServiceIllustration slug="institutional-advisory" className="h-56 w-full" />
        </div>
      </PageHero>

      <section className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.55fr]">
        <Reveal x={-40} y={0} className="lg:sticky lg:top-28">
          <div className="relative overflow-hidden rounded-3xl bg-navy p-8 text-white *:relative">
            <NavyPattern />
            <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="pointer-events-none h-28 w-full" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }} aria-hidden="true">
              <path d="M0 120 L0 80 L40 55 L70 72 L120 30 L165 66 L210 40 L250 70 L300 22 L345 60 L400 45 L400 120 Z" fill="#ffffff" fillOpacity="0.04" />
              <path d="M0 120 L0 95 L60 78 L110 92 L170 70 L230 94 L290 76 L350 92 L400 80 L400 120 Z" fill="#E28A2E" fillOpacity="0.12" />
            </svg>

            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.contact.label}</p>
            <a href={`mailto:${EMAIL}`} className="mt-4 block break-all font-display text-2xl font-bold transition-colors hover:text-orange">
              {EMAIL}
            </a>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={copyEmail}
                className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold transition-colors hover:border-orange hover:text-orange"
              >
                {copied ? `✓ ${t.contact.copied}` : t.contact.copy}
              </button>
              <span className="flex items-center gap-2 text-sm text-white/60">
                <span className="h-2 w-2 rounded-full bg-orange" />
                {t.contact.region}
              </span>
            </div>

            <div className="relative mt-10 border-t border-white/10 pt-8 pb-10">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.contact.nextTitle}</p>
              <Stagger as="ul" className="relative mt-6 space-y-6">
                <span className="absolute bottom-3 left-[15px] top-3 w-px bg-white/15" />
                {t.contact.next.map((step, i) => (
                  <motion.li key={step} variants={staggerItem} className="relative flex gap-4">
                    <span className="relative grid h-8 w-8 flex-none place-items-center rounded-full border border-orange bg-navy font-display text-sm font-bold text-orange">
                      {i + 1}
                    </span>
                    <span className="pt-1 text-white/80">{step}</span>
                  </motion.li>
                ))}
              </Stagger>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <form
            action={`mailto:${EMAIL}`}
            method="post"
            encType="text/plain"
            className="space-y-10 rounded-3xl border-2 border-navy/10 bg-white p-6 shadow-[0_30px_70px_-40px_rgba(14,41,62,0.45)] sm:p-10"
          >
            <fieldset>
              <legend className="contents">
                <StepTitle number="1">{t.contact.stepTopic}</StepTitle>
              </legend>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {t.contact.inquiries.map((item, i) => {
                  const active = topic === i;
                  return (
                    <label
                      key={item}
                      className={`relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 text-sm font-semibold transition-all ${
                        active ? "border-navy bg-navy text-white shadow-lg" : "border-navy/10 text-navy hover:-translate-y-0.5 hover:border-orange"
                      }`}
                    >
                      <input type="radio" name="topic" value={item} checked={active} onChange={() => setTopic(i)} className="sr-only" />
                      <span
                        className={`grid h-5 w-5 flex-none place-items-center rounded-full border-2 text-[10px] transition-colors ${
                          active ? "border-orange bg-orange text-navy" : "border-navy/25"
                        }`}
                      >
                        {active ? "✓" : ""}
                      </span>
                      {item}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <StepTitle number="2">{t.contact.stepDetails}</StepTitle>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field id="name" label={t.contact.name} />
                <Field id="email" type="email" label={t.contact.email} />
                <div className="sm:col-span-2">
                  <Field id="organization" label={t.contact.organization} required={false} />
                </div>
              </div>
            </div>

            <div>
              <StepTitle number="3">{t.contact.stepMessage}</StepTitle>
              <div className="mt-5">
                <Field id="message" label={t.contact.message} multiline />
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-navy/50">{t.contact.sendNote}</p>
              <button
                type="submit"
                className="group flex items-center gap-3 rounded-full bg-navy py-2 pl-7 pr-2 font-display font-semibold text-white transition-colors hover:bg-navy-light"
              >
                {t.contact.send}
                <span className="grid h-10 w-10 place-items-center rounded-full bg-orange text-navy transition-transform group-hover:translate-x-1 group-hover:-rotate-45">→</span>
              </button>
            </div>
          </form>
        </Reveal>
      </section>
    </>
  );
}
