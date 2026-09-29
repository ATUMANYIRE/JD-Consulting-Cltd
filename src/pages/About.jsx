import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PageHero from "../components/PageHero";
import { Reveal, Stagger } from "../components/motion";
import NavyPattern from "../components/NavyPattern";
import MediaFrame from "../components/MediaFrame";
import Placeholder from "../components/Placeholder";
import { staggerItem } from "../components/variants";
import { StrataIllustration } from "../components/illustrations";
import { localize, useLanguage, useServices } from "../i18n/context";
import { founder } from "../data/profile";

function ProfileField({ label, children }) {
  return (
    <div className="grid gap-2 border-t border-navy/10 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
      <dt className="text-xs font-semibold uppercase tracking-widest text-navy/50">{label}</dt>
      <dd className="text-navy/80">{children}</dd>
    </div>
  );
}

function FounderProfile() {
  const { t, lang } = useLanguage();
  const labels = t.about.profile;
  const text = (value) => (localize(value, lang) ? <p>{localize(value, lang)}</p> : <Placeholder />);
  const list = (items) =>
    items.length ? (
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={localize(item, "en")} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 flex-none rotate-45 bg-orange" />
            {localize(item, lang)}
          </li>
        ))}
      </ul>
    ) : (
      <Placeholder />
    );

  return (
    <section id="founder" className="scroll-mt-24 px-3 sm:px-6">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#f3f6f9] px-5 py-20 sm:px-10 lg:px-14">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.about.founderEyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">{t.about.founderTitle}</h2>
        </Reveal>
        <div className="mt-12 grid gap-10 md:grid-cols-[0.75fr_1.25fr]">
          <Reveal x={-40} y={0}>
            <MediaFrame media={founder.photo} label={labels.photo} aspect="aspect-[4/5]" className="bg-white" />
            <div className="mt-5 rounded-3xl bg-navy p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange">{labels.name}</p>
              <div className="mt-2 font-display text-2xl font-bold">{founder.name ? localize(founder.name, lang) : <Placeholder tone="dark" />}</div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-orange">{labels.role}</p>
              <div className="mt-2 text-white/85">{founder.role ? localize(founder.role, lang) : <Placeholder tone="dark" />}</div>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <dl className="border-b border-navy/10">
              <ProfileField label={labels.background}>{text(founder.background)}</ProfileField>
              <ProfileField label={labels.education}>{list(founder.education)}</ProfileField>
              <ProfileField label={labels.expertise}>
                {founder.expertise.length ? (
                  <div className="flex flex-wrap gap-2">
                    {founder.expertise.map((item) => (
                      <span key={localize(item, "en")} className="rounded-full border border-navy/15 bg-white px-3 py-1 text-sm font-semibold text-navy">
                        {localize(item, lang)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <Placeholder />
                )}
              </ProfileField>
              <ProfileField label={labels.experience}>{list(founder.experience)}</ProfileField>
              <ProfileField label={labels.philosophy}>
                {founder.philosophy ? <blockquote className="border-l-4 border-orange pl-4 font-display text-lg text-navy">{localize(founder.philosophy, lang)}</blockquote> : <Placeholder />}
              </ProfileField>
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CompanyProfile() {
  const { t } = useLanguage();
  const services = useServices();
  const c = t.about.company;
  const linkClass = "font-semibold text-navy underline decoration-orange decoration-2 underline-offset-4 hover:text-orange";
  const rows = [
    [c.background, <p key="b">{c.backgroundText}</p>],
    [c.mandate, <Link key="m" to="/mandate" className={linkClass}>{t.mandatePage.statementEyebrow}</Link>],
    [c.areas, <p key="a">{c.areasText}</p>],
    [c.sectors, <p key="s">{c.sectorsText}</p>],
    [
      c.expertise,
      <div key="e" className="flex flex-wrap gap-2">
        {services.map((service) => (
          <Link key={service.slug} to={`/services/${service.slug}`} className="rounded-full border border-navy/15 px-3 py-1 text-sm font-semibold text-navy transition-colors hover:border-orange hover:text-orange">
            {service.title}
          </Link>
        ))}
      </div>,
    ],
    [c.profile, <a key="p" href="#founder" className={linkClass}>{c.profileLink}</a>],
    [c.experience, <Placeholder key="x" />],
    [c.projects, <Link key="j" to="/projects" className={linkClass}>{c.projectsLink}</Link>],
    [c.partners, <Placeholder key="c" note={c.partnersNote} />],
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.about.companyEyebrow}</p>
        <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">{t.about.companyTitle}</h2>
      </Reveal>
      <div className="relative mt-10 rounded-3xl border-2 border-navy p-2 sm:p-4">
        {["-left-1.5 -top-1.5", "-right-1.5 -top-1.5", "-bottom-1.5 -left-1.5", "-bottom-1.5 -right-1.5"].map((corner) => (
          <span key={corner} className={`absolute ${corner} h-3 w-3 rounded-full border-2 border-navy bg-orange`} />
        ))}
        <Stagger as="ul">
          {rows.map(([label, value], i) => (
            <motion.li
              key={label}
              variants={staggerItem}
              className="grid gap-2 rounded-2xl px-4 py-4 transition-colors hover:bg-navy/[0.03] sm:grid-cols-[13rem_1fr] sm:gap-6 sm:px-6"
            >
              <span className="flex items-baseline gap-3 text-xs font-semibold uppercase tracking-widest text-navy/50">
                <span className="font-display text-orange">{String(i + 1).padStart(2, "0")}</span>
                {label}
              </span>
              <div className="text-navy/80">{value}</div>
            </motion.li>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <PageHero eyebrow={t.about.eyebrow} title={t.about.title} description={t.about.description} />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
        <Reveal x={-50} y={0}>
          <StrataIllustration className="w-full" />
        </Reveal>
        <Reveal delay={0.15}>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.about.whoEyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold text-navy">{t.about.whoTitle}</h2>
          <p className="mt-5 text-navy/75">{t.about.p1}</p>
          <p className="mt-4 text-navy/75">{t.about.p2}</p>
        </Reveal>
      </section>

      <section className="px-3 sm:px-6">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-navy px-5 py-20 text-white *:relative sm:px-10 lg:px-14">
          <NavyPattern />
          <Reveal>
            <h2 className="text-3xl font-bold">{t.about.whereTitle}</h2>
          </Reveal>
          <div className="mt-10 flex flex-col items-stretch gap-4 md:flex-row">
            {t.about.intersections.map((item, i) => (
              <motion.div
                key={item}
                className="flex-1 rounded-3xl border-2 border-white/15 p-6 font-display text-xl font-bold"
                initial={{ opacity: 0, rotateX: -80 }}
                whileInView={{ opacity: 1, rotateX: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformPerspective: 800, transformOrigin: "top" }}
                whileHover={{ borderColor: "#E28A2E", color: "#E28A2E" }}
              >
                <span className="block text-sm text-orange">{String(i + 1).padStart(2, "0")}</span>
                {item}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <FounderProfile />
      <CompanyProfile />

      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.about.serveEyebrow}</p>
        </Reveal>
        <Stagger className="mt-6 grid gap-5 md:grid-cols-3">
          {t.about.audiences.map((audience) => (
            <motion.div key={audience.title} variants={staggerItem} className="rounded-3xl border-2 border-navy/10 bg-white p-6 transition-colors hover:border-orange">
              <h3 className="text-xl font-bold text-navy">{audience.title}</h3>
              <p className="mt-2 text-sm text-navy/70">{audience.text}</p>
            </motion.div>
          ))}
        </Stagger>

        <Reveal className="mt-14">
          <Link to="/services" className="group inline-flex items-center gap-3 font-display text-lg font-semibold text-navy">
            <span className="border-b-2 border-orange">{t.about.seeHow}</span>
            <span className="text-orange transition-transform group-hover:translate-x-2">→</span>
          </Link>
        </Reveal>

        <Reveal className="mt-16">
          <Link
            to="/careers"
            className="group flex flex-col gap-4 rounded-3xl border-2 border-navy/10 p-7 transition-colors hover:border-navy sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange">{t.about.careersTitle}</p>
              <p className="mt-2 text-lg font-semibold text-navy">{t.about.careersText}</p>
            </div>
            <span className="flex items-center gap-2 font-display font-semibold text-navy">
              {t.about.careersLink}
              <span className="text-orange transition-transform group-hover:translate-x-2">→</span>
            </span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}
