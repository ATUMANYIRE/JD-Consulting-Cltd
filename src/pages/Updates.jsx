import { useState } from "react";
import { motion } from "framer-motion";
import PageHero from "../components/PageHero";
import EmptyState from "../components/EmptyState";
import MediaFrame from "../components/MediaFrame";
import { Reveal, Stagger } from "../components/motion";
import { staggerItem } from "../components/variants";
import { ServiceIllustration } from "../components/illustrations";
import { formatDate, localize, useLanguage } from "../i18n/context";
import { updateCategories, updates } from "../data/updates";

function UpdateCard({ item }) {
  const { t, lang } = useLanguage();
  return (
    <motion.article variants={staggerItem} className="flex flex-col overflow-hidden rounded-3xl border-2 border-navy/10 bg-white transition-colors hover:border-orange">
      {item.cover && <MediaFrame media={item.cover} aspect="aspect-[16/9]" rounded="rounded-none" />}
      <div className="flex flex-1 flex-col p-6">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-widest">
          <span className="text-orange">{t.updatesPage.categories[item.category]}</span>
          <time dateTime={item.date} className="text-navy/45">
            {formatDate(item.date, lang)}
          </time>
        </p>
        <h2 className="mt-3 text-xl font-bold text-navy">{localize(item.title, lang)}</h2>
        <p className="mt-3 flex-1 text-navy/70">{localize(item.summary, lang)}</p>
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="group mt-5 inline-flex items-center gap-2 font-display font-semibold text-navy">
            <span className="border-b-2 border-orange">{t.updatesPage.readMore}</span>
            <span className="text-orange transition-transform group-hover:translate-x-1">→</span>
          </a>
        )}
      </div>
    </motion.article>
  );
}

export default function Updates() {
  const { t } = useLanguage();
  const [category, setCategory] = useState("all");
  const counts = Object.fromEntries(updateCategories.map((key) => [key, updates.filter((item) => item.category === key).length]));
  const visible = category === "all" ? updates : updates.filter((item) => item.category === category);
  const chips = [["all", t.updatesPage.all, updates.length], ...updateCategories.map((key) => [key, t.updatesPage.categories[key], counts[key]])];

  return (
    <>
      <PageHero eyebrow={t.updatesPage.eyebrow} title={t.updatesPage.title} description={t.updatesPage.description}>
        <div className="p-6">
          <ServiceIllustration slug="circular-economy" className="h-56 w-full" />
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <Reveal>
          <div role="group" aria-label={t.updatesPage.eyebrow} className="flex flex-wrap gap-2">
            {chips.map(([key, label, count]) => {
              const active = key === category;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(key)}
                  className={`flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? "border-navy bg-navy text-white" : "border-navy/10 text-navy hover:border-orange"
                  }`}
                >
                  {label}
                  <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-orange text-navy" : "bg-navy/5 text-navy/50"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div className="mt-10">
          {visible.length > 0 ? (
            <Stagger key={category} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <UpdateCard key={item.id} item={item} />
              ))}
            </Stagger>
          ) : (
            <Reveal>
              <EmptyState
                title={updates.length ? t.updatesPage.categories[category] : t.updatesPage.emptyTitle}
                text={updates.length ? t.updatesPage.emptyCategory : t.updatesPage.emptyText}
              />
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
