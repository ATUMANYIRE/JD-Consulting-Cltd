import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { Reveal, TiltCard } from "../components/motion";
import { ServiceIllustration } from "../components/illustrations";
import { useLanguage, useServices } from "../i18n/context";

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

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
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
    </>
  );
}
