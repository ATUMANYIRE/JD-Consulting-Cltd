import { motion } from "framer-motion";

// Survey-peg illustration: a marked-out site waiting for its first record.
function SurveyMark() {
  return (
    <svg viewBox="0 0 120 90" className="h-24 w-32" fill="none" aria-hidden="true">
      <path d="M6 70 Q34 58 60 66 T114 62" stroke="#0E293E" strokeOpacity="0.15" strokeWidth="2" />
      <path d="M6 80 Q40 70 64 76 T114 74" stroke="#0E293E" strokeOpacity="0.1" strokeWidth="2" />
      <motion.g
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M60 16 V64" stroke="#0E293E" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 18 L84 25 L60 32 Z" fill="#E28A2E" />
      </motion.g>
      <ellipse cx="60" cy="68" rx="10" ry="2.5" fill="#0E293E" fillOpacity="0.15" />
      {[24, 96].map((x, i) => (
        <motion.circle
          key={x}
          cx={x}
          cy={i ? 62 : 66}
          r="3"
          fill="none"
          stroke="#E28A2E"
          strokeWidth="2"
          strokeDasharray="3 3"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: `${x}px ${i ? 62 : 66}px` }}
        />
      ))}
    </svg>
  );
}

export default function EmptyState({ title, text, children, className = "" }) {
  return (
    <div className={`flex flex-col items-center rounded-3xl border-2 border-dashed border-navy/15 bg-[#f6f8fa] px-6 py-14 text-center ${className}`}>
      <SurveyMark />
      <p className="mt-4 max-w-xl font-display text-xl font-bold text-navy sm:text-2xl">{title}</p>
      {text && <p className="mt-3 max-w-lg text-navy/65">{text}</p>}
      {children}
    </div>
  );
}
