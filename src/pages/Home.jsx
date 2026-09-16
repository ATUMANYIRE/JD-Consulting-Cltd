import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { animate, AnimatePresence, motion, useInView, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { Reveal, Stagger, TiltCard } from "../components/motion";
import NavyPattern from "../components/NavyPattern";
import { staggerItem } from "../components/variants";
import { mineControls } from "../three/mineControls";
import { ServiceIllustration } from "../components/illustrations";
import { useLanguage, useServices } from "../i18n/context";

const MineScene = lazy(() => import("../three/MineScene"));

const STAGE_RANGES = [
  [0.18, 0.26, 0.42, 0.5],
  [0.5, 0.58, 0.72, 0.8],
  [0.8, 0.88, 1, 1],
];

function Counter({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return undefined;
    const controls = animate(0, value, {
      duration: 1.6,
      delay: 1.2,
      ease: "easeOut",
      onUpdate: (latest) => {
        ref.current.textContent = String(Math.round(latest)).padStart(2, "0");
      },
    });
    return () => controls.stop();
  }, [inView, value]);

  return <span ref={ref}>00</span>;
}

function Stage({ progress, range, index, item, last, active, t }) {
  const [a, b, c, d] = range;
  const input = last ? [a, b] : [a, b, c, d];
  const opacity = useTransform(progress, input, last ? [0, 1] : [0, 1, 1, 0]);
  const filter = useTransform(progress, input, last ? ["blur(14px)", "blur(0px)"] : ["blur(14px)", "blur(0px)", "blur(0px)", "blur(14px)"]);
  const y = useTransform(progress, [a, d], [70, last ? 0 : -70]);
  const scale = useTransform(progress, [a, b], [1.15, 1]);

  return (
    <motion.div style={{ opacity, filter, y }} className="pointer-events-none absolute inset-x-0 bottom-[12%] mx-auto max-w-3xl px-6 text-center">
      <div className="absolute -inset-x-16 -inset-y-16 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(6,17,27,0.9)_0%,rgba(6,17,27,0.55)_45%,transparent_72%)]" />
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">{String(index + 2).padStart(2, "0")} / 04</p>
      <motion.h2 style={{ scale }} className="mt-3 font-display text-4xl font-bold leading-tight drop-shadow-[0_6px_30px_rgba(0,0,0,0.6)] sm:text-6xl">
        {item.title}
      </motion.h2>
      <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">{item.text}</p>
      {last && (
        <div className={`mt-8 flex flex-wrap justify-center gap-4 ${active ? "pointer-events-auto" : "invisible"}`}>
          <Link to="/contact" className="rounded-full bg-orange px-7 py-3 font-display font-semibold text-navy transition-colors hover:bg-orange-light">
            {t.hero.primary}
          </Link>
          <Link to="/services" className="rounded-full border-2 border-white/40 px-7 py-3 font-display font-semibold text-white transition hover:border-orange hover:text-orange">
            {t.hero.secondary}
          </Link>
        </div>
      )}
    </motion.div>
  );
}

function Hero() {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const inView = useInView(sectionRef);
  const [stage, setStage] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 20, mass: 0.8, restDelta: 0.0005 });
  const introOpacity = useTransform(progress, [0, 0.14], [1, 0]);
  const introY = useTransform(progress, [0, 0.14], [0, -90]);
  const introScale = useTransform(progress, [0, 0.14], [1, 0.94]);
  const sideShade = useTransform(progress, [0, 0.2], [1, 0]);
  const bottomShade = useTransform(progress, [0.12, 0.25], [0, 1]);
  const hintOpacity = useTransform(progress, [0, 0.06], [1, 0]);
  const vignette = useTransform(progress, [0, 1], [0.35, 0.8]);

  useEffect(() => {
    mineControls.reducedMotion = Boolean(reducedMotion);
  }, [reducedMotion]);

  useMotionValueEvent(progress, "change", (value) => {
    mineControls.scroll = value;
    const next = value < 0.2 ? 0 : value < 0.5 ? 1 : value < 0.8 ? 2 : 3;
    setStage((current) => (current === next ? current : next));
  });

  function handlePointerMove(event) {
    mineControls.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    mineControls.pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
  }

  function handlePointerDown(event) {
    if (!event.target.closest("a, button")) mineControls.strike = true;
  }

  return (
    <section ref={sectionRef} onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} className="relative h-[420vh] bg-navy text-white">
      <div className="cursor-pick sticky top-0 isolate h-[100svh] overflow-hidden">
        <motion.div
          className="absolute inset-0"
          role="img"
          aria-label={t.hero.sceneLabel}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense fallback={<div className="h-full w-full animate-pulse bg-navy" />}>
            <MineScene active={inView} />
          </Suspense>
        </motion.div>

        <motion.div
          style={{ opacity: sideShade }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy via-navy/65 to-navy/5 md:bg-gradient-to-r md:from-navy md:via-navy/70 md:to-transparent"
        />
        <motion.div style={{ opacity: bottomShade }} className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
        <motion.div
          style={{ opacity: vignette }}
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,14,22,0.9)_100%)]"
        />

        <div className="pointer-events-none relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-24 pt-32 sm:px-6 md:justify-center md:pb-10">
          <motion.div key={t.hero.eyebrow} style={{ opacity: introOpacity, y: introY, scale: introScale }} className={`max-w-xl origin-left ${stage === 0 ? "" : "invisible"}`}>
            <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <span className="h-2 w-10 rounded-full bg-gradient-to-r from-orange to-orange-light" />
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-light">{t.hero.eyebrow}</p>
            </motion.div>

            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.35)] sm:text-5xl">
              {t.hero.lines.map((line, i) => (
                <span key={line.text} className="block overflow-hidden pb-1">
                  <motion.span
                    className={`block ${line.highlight ? "bg-gradient-to-r from-orange to-orange-light bg-clip-text text-transparent" : ""}`}
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ delay: 0.35 + i * 0.14, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {line.text}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p className="mt-5 max-w-md text-white/80" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95, duration: 0.6 }}>
              {t.hero.sub}
            </motion.p>

            <motion.div className="mt-8 flex flex-wrap gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.6 }}>
              <Link to="/contact" className="pointer-events-auto rounded-full bg-orange px-7 py-3 font-display font-semibold text-navy transition-colors hover:bg-orange-light">
                {t.hero.primary}
              </Link>
              <Link
                to="/services"
                className="pointer-events-auto rounded-full border-2 border-white/40 px-7 py-3 font-display font-semibold text-white backdrop-blur-sm transition hover:border-orange hover:text-orange"
              >
                {t.hero.secondary}
              </Link>
            </motion.div>

            <motion.div
              className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.25, duration: 0.6 }}
            >
              {t.home.facts.map((fact) => (
                <div key={fact.label} className="min-w-[6rem]">
                  <p className="font-display text-3xl font-bold text-orange">
                    <Counter value={fact.value} />
                  </p>
                  <p className="mt-1 max-w-[10rem] text-xs leading-snug text-white/60">{fact.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {t.hero.stages.map((item, i) => (
          <Stage key={item.title} progress={progress} range={STAGE_RANGES[i]} index={i} item={item} last={i === 2} active={stage === 3} t={t} />
        ))}

        <div className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`block rounded-full transition-all duration-500 ${stage === i ? "h-10 w-1.5 bg-orange" : "h-1.5 w-1.5 bg-white/40"}`} />
          ))}
        </div>

        <motion.div
          style={{ opacity: hintOpacity }}
          className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/60 md:flex"
        >
          <span className="flex h-9 w-5 justify-center rounded-full border-2 border-white/40 pt-1.5">
            <motion.span className="h-2 w-1 rounded-full bg-orange" animate={{ y: [0, 10, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
          </span>
          {t.hero.scrollHint}
        </motion.div>

        <p className="pointer-events-none absolute bottom-6 right-6 hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-white/50 md:flex">
          <span className="h-2 w-2 animate-ping rounded-full bg-orange motion-reduce:animate-none" />
          {t.hero.hint}
        </p>
      </div>
    </section>
  );
}

function MissionVision() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.home.whyEyebrow}</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold text-navy sm:text-4xl">{t.home.whyTitle}</h2>
      </Reveal>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <Reveal delay={0.1}>
          <TiltCard className="relative h-full overflow-hidden bg-navy p-8 text-white *:relative">
            <NavyPattern />
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-orange" style={{ transform: "translateZ(40px)" }}>
              {t.common.vision}
            </h3>
            <p className="mt-4 text-lg text-white/85" style={{ transform: "translateZ(30px)" }}>
              {t.common.visionText}
            </p>
          </TiltCard>
        </Reveal>
        <Reveal delay={0.2}>
          <TiltCard className="relative h-full border-2 border-navy bg-white p-8">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-orange" style={{ transform: "translateZ(40px)" }}>
              {t.common.mission}
            </h3>
            <p className="mt-4 text-lg text-navy/80" style={{ transform: "translateZ(30px)" }}>
              {t.common.missionText}
            </p>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  );
}

function ServicePillars() {
  const { t } = useLanguage();
  const services = useServices();
  const [active, setActive] = useState(0);
  const current = services[active];

  return (
    <section className="px-3 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-clip rounded-[2.5rem] bg-navy px-5 pb-16 pt-20 text-white sm:px-10 sm:pb-20 lg:px-14">
        <NavyPattern />
        <div className="pointer-events-none h-96 w-96 rounded-full border-[48px] border-orange/15" style={{ position: "absolute", right: "-8rem", bottom: "-10rem" }} />
        <div className="relative">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.home.pillarsEyebrow}</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t.home.pillarsTitle}</h2>
            </div>
            <Link to="/services" className="text-sm font-semibold text-orange hover:text-orange-light">
              {t.home.viewAll}
            </Link>
          </Reveal>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <Stagger className="space-y-2">
              {services.map((service, index) => {
                const isActive = index === active;
                return (
                  <motion.div key={service.slug} variants={staggerItem}>
                    <Link
                      to={`/services/${service.slug}`}
                      onMouseEnter={() => setActive(index)}
                      onFocus={() => setActive(index)}
                      className="group relative flex items-center gap-4 rounded-2xl px-4 py-5 sm:gap-6 sm:px-5"
                    >
                      {isActive && (
                        <motion.span
                          layoutId="pillar-bar"
                          className="absolute inset-0 rounded-2xl border border-white/10 bg-white/[0.06]"
                          transition={{ type: "spring", stiffness: 400, damping: 34 }}
                        />
                      )}
                      <span className={`relative font-display text-2xl font-bold transition-colors sm:text-3xl ${isActive ? "text-orange" : "text-white/25"}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="relative flex-1">
                        <h3 className={`text-lg font-semibold transition-colors ${isActive ? "text-white" : "text-white/70"}`}>{service.title}</h3>
                        <p className="mt-1 text-sm text-white/50 lg:hidden">{service.summary}</p>
                      </div>
                      <span className={`relative font-display text-xl text-orange transition-all ${isActive ? "translate-x-0 opacity-100" : "-translate-x-3 opacity-0"}`}>→</span>
                    </Link>
                  </motion.div>
                );
              })}
            </Stagger>

            <div className="hidden lg:block">
              <div className="sticky top-28 overflow-hidden rounded-3xl bg-gradient-to-b from-white to-[#eef2f6] text-navy shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.slug}
                    className="p-8"
                    initial={{ opacity: 0, rotateY: -25, x: 30 }}
                    animate={{ opacity: 1, rotateY: 0, x: 0 }}
                    exit={{ opacity: 0, rotateY: 25, x: -30 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformPerspective: 900 }}
                  >
                    <ServiceIllustration slug={current.slug} className="mb-6 h-56 w-full" />
                    <p className="font-display text-sm font-bold uppercase tracking-widest text-orange">
                      {t.common.pillar} {String(active + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-navy/75">{current.summary}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Process() {
  const { t } = useLanguage();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 60%"] });

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.home.processEyebrow}</p>
        <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">{t.home.processTitle}</h2>
      </Reveal>
      <div className="relative mt-14">
        <div className="absolute left-0 right-0 top-6 hidden h-0.5 bg-navy/10 md:block" />
        <motion.div className="absolute left-0 right-0 top-6 hidden h-0.5 origin-left bg-gradient-to-r from-orange to-orange-light md:block" style={{ scaleX: scrollYProgress }} />
        <Stagger className="grid gap-8 md:grid-cols-4">
          {t.home.steps.map((step, i) => (
            <motion.div key={step.title} variants={staggerItem} className="group relative">
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-navy font-display font-bold text-white transition-colors group-hover:bg-orange group-hover:text-navy">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-bold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy/70">{step.text}</p>
            </motion.div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

const ELEMENTS = [
  { symbol: "Sn", number: 50 },
  { symbol: "Ta", number: 73 },
  { symbol: "W", number: 74 },
  { symbol: "Au", number: 79 },
  { symbol: "Li", number: 3 },
  { symbol: "C", number: 6 },
];

function Minerals() {
  const { t } = useLanguage();
  return (
    <section className="px-3 sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-12 relative overflow-hidden rounded-[2.5rem] bg-navy px-5 py-20 text-white *:relative sm:px-10 lg:grid-cols-[1fr_1.1fr] lg:px-14">
        <NavyPattern />
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.home.mineralsEyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">{t.home.mineralsTitle}</h2>
          <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-white/50">{t.home.standardsLabel}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {t.home.standards.map((standard) => (
              <span key={standard} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-orange hover:text-orange">
                {standard}
              </span>
            ))}
          </div>
        </Reveal>
        <div>
          <Stagger className="grid grid-cols-3 gap-3 sm:gap-4">
            {ELEMENTS.map((element, i) => (
              <motion.div key={element.symbol} variants={staggerItem} className="group aspect-square [perspective:800px]">
                <div className="relative h-full w-full rounded-2xl transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
                  <div className={`absolute inset-0 flex flex-col justify-between rounded-2xl p-4 [backface-visibility:hidden] ${i % 2 ? "bg-white text-navy" : "bg-orange text-navy"}`}>
                    <span className="text-xs font-semibold opacity-70">{element.number}</span>
                    <span className="font-display text-4xl font-bold sm:text-5xl">{element.symbol}</span>
                    <span className="truncate text-xs font-semibold opacity-80">{t.home.minerals[i]}</span>
                  </div>
                  <div className="absolute inset-0 grid place-items-center rounded-2xl border-2 border-orange bg-navy p-3 text-center font-display text-lg font-bold text-white [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {t.home.minerals[i]}
                  </div>
                </div>
              </motion.div>
            ))}
          </Stagger>
          <p className="mt-4 text-right text-xs font-semibold uppercase tracking-widest text-white/40">{t.home.mineralsHint}</p>
        </div>
      </div>
    </section>
  );
}

function Impact() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
      <Reveal className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.home.impactEyebrow}</p>
        <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">{t.home.impactTitle}</h2>
      </Reveal>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {t.home.impact.map((item, i) => (
          <Reveal key={item.value} delay={i * 0.1}>
            <TiltCard className={`relative h-full overflow-hidden p-8 *:relative ${i === 0 ? "bg-navy text-white" : "border-2 border-navy/10 bg-white text-navy"}`}>
              {i === 0 && <NavyPattern />}
              {item.prefix && <p className={`text-sm font-semibold ${i === 0 ? "text-white/60" : "text-navy/50"}`}>{item.prefix}</p>}
              <p className={`font-display font-bold text-orange ${item.value.length > 5 ? "text-3xl" : "text-6xl"}`}>{item.value}</p>
              <p className={`mt-4 ${i === 0 ? "text-white/80" : "text-navy/70"}`}>{item.text}</p>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Audiences() {
  const { t } = useLanguage();
  return (
    <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.home.serveEyebrow}</p>
      </Reveal>
      <Stagger className="mt-6 grid gap-5 md:grid-cols-3">
        {t.about.audiences.map((audience, i) => (
          <motion.div
            key={audience.title}
            variants={staggerItem}
            className="group relative overflow-hidden rounded-3xl border-2 border-navy/10 p-7 transition-colors hover:border-navy"
          >
            <span className="absolute -right-4 -top-6 font-display text-8xl font-bold text-navy/5 transition-colors group-hover:text-orange/20">{i + 1}</span>
            <h3 className="relative text-xl font-bold text-navy">{audience.title}</h3>
            <p className="relative mt-2 text-sm text-navy/70">{audience.text}</p>
          </motion.div>
        ))}
      </Stagger>
    </section>
  );
}

function CallToAction() {
  const { t } = useLanguage();
  return (
    <section className="relative overflow-hidden bg-white pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-orange-light via-orange to-orange px-8 py-14 sm:px-14">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rotate-45 rounded-3xl border-[14px] border-navy/15" />
          <h2 className="max-w-2xl text-3xl font-bold text-navy sm:text-4xl">{t.home.ctaTitle}</h2>
          <p className="mt-4 max-w-xl text-navy/80">{t.home.ctaText}</p>
          <Link
            to="/contact"
            className="mt-8 inline-block rounded-full bg-navy px-8 py-3 font-display font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#fff]"
          >
            {t.home.ctaButton}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />
      <MissionVision />
      <ServicePillars />
      <Process />
      <Minerals />
      <Impact />
      <Audiences />
      <CallToAction />
    </>
  );
}
