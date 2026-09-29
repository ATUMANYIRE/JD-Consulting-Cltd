import { useLanguage } from "../i18n/context";

// Visible marker for company information that hasn't been supplied yet. Never replace it with
// a guess: fill the source data (src/data/*) once the client approves the real content.
export default function Placeholder({ label, note, tone = "light", className = "" }) {
  const { t } = useLanguage();
  const colors = tone === "dark" ? "border-white/25 text-white/60" : "border-navy/20 text-navy/50";
  return (
    <span className={`inline-flex flex-col gap-0.5 rounded-xl border border-dashed px-3 py-1.5 text-sm ${colors} ${className}`}>
      <span className="flex items-center gap-2 font-semibold">
        <span className="h-1.5 w-1.5 flex-none rounded-full bg-orange" />
        {label ?? t.common.toBeSupplied}
      </span>
      {note && <span className="text-xs opacity-80">{note}</span>}
    </span>
  );
}
