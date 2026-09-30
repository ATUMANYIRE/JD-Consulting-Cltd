import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHero from "../components/PageHero";
import NavyPattern from "../components/NavyPattern";
import { Reveal, Stagger, TiltCard } from "../components/motion";
import { staggerItem } from "../components/variants";
import { ServiceIllustration } from "../components/illustrations";
import { useLanguage, useServices } from "../i18n/context";

// Tools the client has asked to show as planned, not as current services: every card carries the
// "future development" badge and nothing links to a working tool.
function FutureDevelopments() {
  const { t } = useLanguage();
  const s = t.servicesPage;

  return (
    <section id="future" className="scroll-mt-24 px-4 pb-24 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-navy px-6 py-14 text-white *:relative sm:px-10 sm:py-16">
        <NavyPattern />
        <Reveal className="max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-orange">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange" />
            {s.futureEyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">{s.futureTitle}</h2>
          <p className="mt-4 text-white/70">{s.futureText}</p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {s.futureGroups.map((group, g) => (
            <Reveal key={group.title} delay={0.08 * g} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm sm:p-7">
              <div className="flex items-start gap-4">
                <span className="font-display text-3xl font-bold leading-none text-orange/80">{String(g + 1).padStart(2, "0")}</span>
                <h3 className="pt-1 font-display text-lg font-bold leading-snug">{group.title}</h3>
              </div>
              <Stagger as="ul" className="mt-6 space-y-4">
                {group.items.map((item) => (
                  <motion.li key={item.title} variants={staggerItem} className="rounded-2xl border border-dashed border-white/20 p-5 transition-colors hover:border-orange/60">
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-orange">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange" />
                      {s.futureBadge}
                    </span>
                    <p className="mt-3 font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/65">{item.text}</p>
                  </motion.li>
                ))}
              </Stagger>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Services() {
  const { t } = useLanguage();
  const services = useServices();

  return (
    <>
      <PageHero eyebrow={t.servicesPage.eyebrow} title={t.servicesPage.title} description={t.servicesPage.description}>
        <div className="p-6">
          <ServiceIllustration slug="technical-advisory" className="h-56 w-full" />
        </div>
      </PageHero>

      {/* overflow-x-clip: the side-in reveals start off-screen and must not widen the page on phones. */}
      <section className="mx-auto max-w-6xl overflow-x-clip px-4 py-12 sm:px-6">
        {services.map((service, index) => {
          const flipped = index % 2 === 1;
          return (
            <div key={service.slug} className="grid items-center gap-10 border-b border-navy/10 py-16 last:border-b-0 md:grid-cols-2">
              <Reveal x={flipped ? 60 : -60} y={0} className={flipped ? "md:order-2" : ""}>
                <TiltCard className={`p-8 ${flipped ? "border-2 border-navy bg-white" : "bg-orange/10"}`}>
                  <ServiceIllustration slug={service.slug} className="h-64 w-full" />
                </TiltCard>
              </Reveal>
              <Reveal delay={0.15}>
                <span className="font-display text-6xl font-bold text-orange">{String(index + 1).padStart(2, "0")}</span>
                <h2 className="mt-2 text-3xl font-bold text-navy">{service.title}</h2>
                <p className="mt-4 text-navy/70">{service.summary}</p>
                <ul className="mt-6 space-y-2">
                  {service.points.slice(0, 2).map((point) => (
                    <li key={point} className="flex gap-3 text-sm text-navy/80">
                      <span className="mt-1.5 h-2 w-2 flex-none rotate-45 bg-orange" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link to={`/services/${service.slug}`} className="group mt-8 inline-flex items-center gap-3 font-display font-semibold text-navy">
                  <span className="border-b-2 border-orange pb-0.5">{t.servicesPage.explore}</span>
                  <span className="text-orange transition-transform group-hover:translate-x-2">→</span>
                </Link>
              </Reveal>
            </div>
          );
        })}
      </section>

      <FutureDevelopments />
    </>
  );
}
