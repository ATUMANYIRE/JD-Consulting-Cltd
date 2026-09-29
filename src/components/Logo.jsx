import { company } from "../data/company";

// The gear is engineering, the peaks and the pick-swoosh are mining, the leaves are the
// environment and the three figures are communities. `public/favicon.svg` is the same mark.
const TONES = {
  navy: { ink: "#0E293E", leaf: "#2F8F5B", cut: "#ffffff", text: "text-navy" },
  white: { ink: "#ffffff", leaf: "#5CC08A", cut: "#0E293E", text: "text-white" },
};

// Endpoints of the gear arc (radius 25 around the centre), from the top-left round to the bottom-left.
const GEAR_ARC = "M25.95 7.74 A25 25 0 0 0 19.5 53.65";
const PEOPLE = [
  [24, 48.5, 0.62],
  [31, 47, 0.72],
  [38, 48.5, 0.62],
];

export function LogoMark({ tone = "navy", className = "" }) {
  const { ink, leaf, cut } = TONES[tone];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d={GEAR_ARC} fill="none" stroke={ink} strokeWidth="5" strokeLinecap="round" />
      {[-35, -63, -91, -119].map((angle) => (
        <rect key={angle} x="29.4" y="2.4" width="5.2" height="6" rx="1" fill={ink} transform={`rotate(${angle} 32 32)`} />
      ))}
      <path d="M14 50 L24 29 L29 35 L37 17 L50 50 Z" fill="#E28A2E" />
      <path d="M37 17 L41 31 L36 38 L42 50 H50 Z" fill="#EA9534" />
      <path d="M24 29 L26 38 L22 50 H14 Z" fill="#EA9534" opacity="0.6" />
      <path d="M34.2 23.3 L37 17 L40 24 l-3-1.7z" fill={cut} opacity="0.85" />
      <path d="M9 45 C18 63 45 62 52.2 13 L56 14 C47 51 22 57.5 9 45Z" fill={ink} />
      <path d="M44.5 12.5 Q55 5.5 62 16.5 Q54.5 11.5 44.5 12.5Z" fill={ink} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
      <g transform="translate(47 45) rotate(-28)">
        <path d="M0 0 C3 -5 9 -6.5 13 -6 C11 -1.5 6 1.5 0 0Z" fill={leaf} />
        <path d="M1 -0.6 L10.5 -4.8" stroke={cut} strokeWidth="0.7" opacity="0.8" />
      </g>
      <path d="M0 0 C2.5 -4 7 -5 10 -4.5 C8.5 -1 4.5 1.2 0 0Z" fill={leaf} transform="translate(46 47) rotate(28)" />
      {PEOPLE.map(([x, y, scale]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${scale})`} fill={ink} stroke={cut} strokeWidth="1.6">
          <circle cy="-3.4" r="3" />
          <path d="M-5.2 6 v-1.6 a5.2 5.2 0 0 1 10.4 0 V6z" />
        </g>
      ))}
    </svg>
  );
}

// Mark plus the company name. Set company.logo to an official file and it replaces the mark in
// the same fixed-height box, so the header and footer layouts don't change.
export default function Logo({ tone = "navy", size = "md", showName = true, className = "" }) {
  const box = size === "lg" ? "h-12" : "h-11";
  const mark = company.logo ? (
    <img src={company.logo} alt="" className={`${box} w-auto`} />
  ) : (
    <LogoMark tone={tone} className={`${box} w-auto flex-none`} />
  );

  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className="transition-transform group-hover:-rotate-6">{mark}</span>
      {showName && (
        <span className={`font-display font-bold leading-[1.05] tracking-tight ${TONES[tone].text} ${size === "lg" ? "text-xl" : "max-w-[7rem] text-[15px] sm:max-w-none sm:text-lg"}`}>
          {company.name}
        </span>
      )}
    </span>
  );
}
