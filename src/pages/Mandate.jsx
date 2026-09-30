import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import PageHero from "../components/PageHero";
import { Reveal, Stagger } from "../components/motion";
import VisionMission from "../components/VisionMission";
import Placeholder from "../components/Placeholder";
import { staggerItem } from "../components/variants";
import { StrataIllustration } from "../components/illustrations";
import { useLanguage } from "../i18n/context";

// One stratum of the core sample per value, top to bottom.
const STRATA = [
  { fill: "#0E293E", vein: "#E28A2E" },
  { fill: "#2f5470", vein: "#9fb3c4" },
  { fill: "#E28A2E", vein: "#0E293E" },
  { fill: "#6d8aa2", vein: "#ffffff" },
  { fill: "#EA9534", vein: "#0E293E" },
];
const SEGMENT = 84;
const CORE_TOP = 18;

function fracture(y, seed) {
  let d = `M8 ${y}`;
  for (let x = 16; x <= 72; x += 8) d += ` L${x} ${y + (((x * 7 + seed * 13) % 9) - 4)}`;
  return d + ` L80 ${y}`;
}

function CoreSample({ active }) {
  return (
    <svg viewBox="0 0 120 470" className="h-[470px] w-[120px]" aria-hidden="true">
      <defs>
        <linearGradient id="core-shade" x1="0" x2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
        <clipPath id="core-clip">
          <rect x="8" y={CORE_TOP} width="72" height={SEGMENT * 5} rx="14" />
        </clipPath>
      </defs>
      {Array.from({ length: 21 }, (_, i) => (
        <path key={i} d={`M92 ${CORE_TOP + i * 21} H${i % 4 === 0 ? 108 : 100}`} stroke="#0E293E" strokeOpacity="0.25" strokeWidth="1.5" />
      ))}
      <g clipPath="url(#core-clip)">
        {STRATA.map((stratum, i) => {
          const y = CORE_TOP + i * SEGMENT;
          return (
            <motion.g key={i} animate={{ opacity: active === i ? 1 : 0.35 }} transition={{ duration: 0.35 }}>
              <rect x="8" y={y} width="72" height={SEGMENT} fill={stratum.fill} />
              <path d={`M8 ${y + 30 + i * 3} Q40 ${y + 18} 80 ${y + 44 - i * 2}`} stroke={stratum.vein} strokeOpacity="0.5" strokeWidth="2" fill="none" />
              {[0, 1, 2, 3].map((k) => (
                <circle key={k} cx={18 + ((k * 23 + i * 11) % 56)} cy={y + 14 + ((k * 29 + i * 17) % 60)} r={1.4 + (k % 2)} fill={stratum.vein} fillOpacity="0.45" />
              ))}
            </motion.g>
          );
        })}
        <rect x="8" y={CORE_TOP} width="72" height={SEGMENT * 5} fill="url(#core-shade)" />
        {[1, 2, 3, 4].map((i) => (
          <path key={i} d={fracture(CORE_TOP + i * SEGMENT, i)} stroke="#ffffff" strokeWidth="2.5" fill="none" />
        ))}
      </g>
      <motion.rect
        x="4"
        width="80"
        height={SEGMENT + 8}
        rx="16"
        fill="none"
        stroke="#E28A2E"
        strokeWidth="3"
        initial={false}
        animate={{ y: CORE_TOP - 4 + active * SEGMENT }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      />
      <motion.path
        d="M112 0 l-10 6 l10 6 z"
        fill="#E28A2E"
        initial={false}
        animate={{ y: CORE_TOP + active * SEGMENT + SEGMENT / 2 - 6 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
      />
    </svg>
  );
}

function ValueRow({ value, index, active, onActive, pending }) {
  const ref = useRef(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  const isActive = active === index;
  return (
    <motion.li
      ref={ref}
      variants={staggerItem}
      onMouseEnter={() => onActive(index)}
      className={`relative border-l-4 py-7 pl-6 transition-colors sm:pl-8 ${isActive ? "border-orange" : "border-navy/10"}`}
    >
      <div className="flex items-baseline gap-4">
        <span className={`font-display text-sm font-bold transition-colors ${isActive ? "text-orange" : "text-navy/35"}`}>{String(index + 1).padStart(2, "0")}</span>
        <span className="h-3 w-3 flex-none translate-y-0.5 rounded-sm lg:hidden" style={{ background: STRATA[index].fill }} />
        <h3 className="text-2xl font-bold text-navy">{value.title}</h3>
      </div>
      <div className="mt-3 pl-9 lg:pl-8">
        {value.text ? <p className={`max-w-xl text-lg transition-colors ${isActive ? "text-navy/85" : "text-navy/60"}`}>{value.text}</p> : <Placeholder label={pending} />}
      </div>
    </motion.li>
  );
}

function CoreValues() {
  const { t } = useLanguage();
  const [active, setActive] = useState(0);

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.about.valuesEyebrow}</p>
            <h2 className="mt-3 max-w-sm text-3xl font-bold text-navy sm:text-4xl">{t.about.valuesTitle}</h2>
          </Reveal>
          <Reveal delay={0.15} className="mt-10 hidden lg:block">
            <CoreSample active={active} />
          </Reveal>
        </div>
        <Stagger as="ul">
          {t.about.values.map((value, i) => (
            <ValueRow key={value.title} value={value} index={i} active={active} onActive={setActive} pending={t.about.valuePending} />
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function SectionHead({ number, title, intro }) {
  return (
    <Reveal>
      <div className="flex items-baseline gap-4">
        <span className="font-display text-sm font-bold text-orange">{String(number).padStart(2, "0")}</span>
        <h3 className="text-2xl font-bold text-navy sm:text-3xl">{title}</h3>
      </div>
      {intro && <p className="mt-4 max-w-3xl text-lg text-navy/70">{intro}</p>}
    </Reveal>
  );
}

// The client's corporate mandate, shown word for word in English.
function CorporateMandate() {
  const { t } = useLanguage();
  const m = t.mandatePage;

  return (
    <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{m.statementEyebrow}</p>
        <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">{m.statementTitle}</h2>
        <p className="mt-3 font-display text-lg text-navy/60">{m.statementSubtitle}</p>
      </Reveal>

      <div className="mt-14">
        <SectionHead number={1} title={m.scopeTitle} intro={m.scopeIntro} />
        <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
          {m.scope.map((item, i) => (
            <motion.div key={item.title} variants={staggerItem} className="relative overflow-hidden rounded-3xl border-2 border-navy/10 bg-white p-7">
              <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: STRATA[i * 2].fill }} />
              <h4 className="font-display text-lg font-bold leading-snug text-navy">{item.title}</h4>
              <p className="mt-3 text-navy/70">{item.text}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>

      <div className="mt-20">
        <SectionHead number={2} title={m.directivesTitle} intro={m.directivesIntro} />
        <Stagger as="ol" className="mt-8 space-y-3">
          {m.directives.map((directive, i) => (
            <motion.li key={directive.title} variants={staggerItem} className="grid overflow-hidden rounded-3xl border-2 border-navy/10 bg-white sm:grid-cols-[11rem_1fr]">
              <div className="flex items-center gap-3 px-6 py-4 sm:flex-col sm:items-start sm:justify-center sm:py-6" style={{ background: STRATA[i].fill }}>
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: STRATA[i].vein }}>
                  {t.common.pillar}
                </span>
                <span className="font-display text-3xl font-bold leading-none" style={{ color: STRATA[i].vein }}>
                  {i + 1}
                </span>
              </div>
              <div className="p-6">
                <h4 className="font-display text-lg font-bold text-navy">{directive.title}</h4>
                <ul className="mt-3 space-y-2">
                  {directive.points.map((point) => (
                    <li key={point} className="flex gap-3 text-navy/75">
                      <span className="mt-2 h-2 w-2 flex-none rotate-45 bg-orange" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.li>
          ))}
        </Stagger>
      </div>

      <div className="mt-20">
        <SectionHead number={3} title={m.stakeholdersTitle} />
        <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
          {m.stakeholders.map((item) => (
            <motion.div key={item.title} variants={staggerItem} className="rounded-3xl bg-navy p-7 text-white">
              <span className="text-2xl text-orange">→</span>
              <h4 className="mt-3 font-display text-lg font-bold leading-snug">{item.title}</h4>
              <p className="mt-3 text-white/70">{item.text}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export default function Mandate() {
  const { t } = useLanguage();
  const m = t.mandatePage;

  return (
    <>
      <PageHero eyebrow={m.eyebrow} title={m.title} description={m.description}>
        <div className="p-6">
          <StrataIllustration className="h-56 w-full" />
        </div>
      </PageHero>

      <CorporateMandate />

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <VisionMission />
      </section>

      <CoreValues />
    </>
  );
}
