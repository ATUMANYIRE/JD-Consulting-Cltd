import { Reveal, TiltCard } from "./motion";
import NavyPattern from "./NavyPattern";
import { useLanguage } from "../i18n/context";

// The approved Vision and Mission statements (verbatim), each followed by the focus areas it names.
function Points({ items, dark }) {
  return (
    <ul className={`mt-7 space-y-4 border-t pt-6 ${dark ? "border-white/15" : "border-navy/10"}`} style={{ transform: "translateZ(20px)" }}>
      {items.map((item, i) => (
        <li key={item.title} className="flex gap-4">
          <span className="font-display text-sm font-bold text-orange">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <p className={`font-semibold ${dark ? "text-white" : "text-navy"}`}>{item.title}</p>
            <p className={`mt-1 text-sm leading-relaxed ${dark ? "text-white/70" : "text-navy/65"}`}>{item.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function VisionMission() {
  const { t } = useLanguage();
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Reveal delay={0.1}>
        <TiltCard className="relative h-full overflow-hidden bg-navy p-8 text-white *:relative">
          <NavyPattern />
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-orange" style={{ transform: "translateZ(40px)" }}>
            {t.common.vision}
          </h3>
          <p className="mt-4 font-display text-xl leading-snug text-white" style={{ transform: "translateZ(30px)" }}>
            {t.common.visionText}
          </p>
          <Points items={t.common.visionPoints} dark />
        </TiltCard>
      </Reveal>
      <Reveal delay={0.2}>
        <TiltCard className="relative h-full border-2 border-navy bg-white p-8">
          <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-orange" style={{ transform: "translateZ(40px)" }}>
            {t.common.mission}
          </h3>
          <p className="mt-4 font-display text-xl leading-snug text-navy" style={{ transform: "translateZ(30px)" }}>
            {t.common.missionText}
          </p>
          <Points items={t.common.missionPoints} />
        </TiltCard>
      </Reveal>
    </div>
  );
}
