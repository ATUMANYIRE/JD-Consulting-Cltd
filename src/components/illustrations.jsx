import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const NAVY = "#0E293E";
const ORANGE = "#E28A2E";

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  show: (i = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: i * 0.18, duration: 1.1, ease: "easeInOut" },
      opacity: { delay: i * 0.18, duration: 0.01 },
    },
  }),
};

const pop = {
  hidden: { scale: 0, opacity: 0 },
  show: (i = 0) => ({ scale: 1, opacity: 1, transition: { delay: i * 0.18, type: "spring", stiffness: 260, damping: 16 } }),
};

const rise = {
  hidden: { scaleY: 0, opacity: 0 },
  show: (i = 0) => ({ scaleY: 1, opacity: 1, transition: { delay: i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

const slide = {
  hidden: { x: -80, opacity: 0 },
  show: (i = 0) => ({ x: 0, opacity: 1, transition: { delay: i * 0.12, duration: 0.8, ease: [0.22, 1, 0.36, 1] } }),
};

const originCenter = { transformBox: "fill-box", transformOrigin: "center" };
const originBottom = { transformBox: "fill-box", transformOrigin: "bottom" };

function AnimatedSvg({ viewBox, className, children, label }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  return (
    <motion.svg
      ref={ref}
      viewBox={viewBox}
      className={className}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      role="img"
      aria-label={label}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </motion.svg>
  );
}

function Check({ x, y, i }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g variants={pop} custom={i} style={originCenter}>
        <circle r="12" fill={ORANGE} />
        <path d="M-5 0 l3.5 3.5 l6.5 -7" stroke="#fff" strokeWidth="2.5" />
      </motion.g>
    </g>
  );
}

function EsgIllustration(props) {
  return (
    <AnimatedSvg viewBox="0 0 400 280" label="Mine-to-smelter chain of custody" {...props}>
      <motion.path d="M20 232 H380" stroke={NAVY} strokeOpacity="0.2" strokeWidth="2" variants={draw} />
      <motion.path d="M45 232 L65 152 L85 232 M52 202 H78 M58 177 H72" stroke={NAVY} strokeWidth="4" variants={draw} custom={1} />
      <motion.circle cx="65" cy="146" r="9" stroke={NAVY} strokeWidth="4" variants={draw} custom={1} />
      <motion.path d="M90 215 C150 140 230 290 295 205" stroke={ORANGE} strokeWidth="4" variants={draw} custom={2} />
      <Check x={138} y={194} i={4} />
      <Check x={191} y={214} i={5} />
      <Check x={244} y={232} i={6} />
      <motion.g variants={pop} custom={3} style={originBottom}>
        <rect x="300" y="182" width="62" height="50" rx="4" fill={NAVY} />
        <rect x="342" y="142" width="13" height="40" fill={NAVY} />
        <rect x="312" y="198" width="14" height="14" rx="2" fill={ORANGE} />
        <rect x="334" y="198" width="14" height="14" rx="2" fill="#fff" fillOpacity="0.3" />
      </motion.g>
      <motion.g variants={pop} custom={7} style={originCenter}>
        <path d="M200 30 L240 44 V72 C240 94 222 108 200 116 C178 108 160 94 160 72 V44 Z" fill={NAVY} />
      </motion.g>
      <motion.path d="M184 72 l11 11 l22 -24" stroke={ORANGE} strokeWidth="5" variants={draw} custom={8} />
    </AnimatedSvg>
  );
}

function CircularIllustration(props) {
  return (
    <AnimatedSvg viewBox="0 0 400 280" label="Circular tailings valorization loop" {...props}>
      <g className="animate-orbit motion-reduce:animate-none" style={{ transformOrigin: "200px 150px" }}>
        <motion.path d="M218.2 46.6 A105 105 0 0 1 298.7 185.9" stroke={ORANGE} strokeWidth="6" variants={draw} custom={0} />
        <motion.path d="M280.4 217.5 A105 105 0 0 1 119.6 217.5" stroke={NAVY} strokeWidth="6" variants={draw} custom={1} />
        <motion.path d="M101.3 185.9 A105 105 0 0 1 181.8 46.6" stroke={ORANGE} strokeWidth="6" variants={draw} custom={2} />
        <motion.path d="M296 193.4 L305.7 184.2 L294.5 180.1 Z" fill={ORANGE} variants={pop} custom={3} style={originCenter} />
        <motion.path d="M114.5 211.4 L117.6 224.5 L126.8 216.7 Z" fill={NAVY} variants={pop} custom={3} style={originCenter} />
        <motion.path d="M189.7 45.2 L176.9 41.4 L178.9 53.2 Z" fill={ORANGE} variants={pop} custom={3} style={originCenter} />
      </g>
      <motion.path d="M140 200 Q200 110 260 200 Z" fill={NAVY} variants={rise} custom={2} style={originBottom} />
      <motion.path d="M160 182 H240 M176 166 H224" stroke="#fff" strokeOpacity="0.25" strokeWidth="3" variants={draw} custom={4} />
      {[
        [180, 128, 5],
        [205, 112, 6],
        [228, 132, 7],
      ].map(([x, y, i]) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <motion.rect x="-7" y="-7" width="14" height="14" rx="2" transform="rotate(45)" fill={i === 6 ? NAVY : ORANGE} variants={pop} custom={i} style={originCenter} />
        </g>
      ))}
      <motion.path d="M60 200 H340" stroke={NAVY} strokeOpacity="0.2" strokeWidth="2" variants={draw} />
    </AnimatedSvg>
  );
}

function WorkforceIllustration(props) {
  const steps = [
    { x: 70, h: 40 },
    { x: 140, h: 80 },
    { x: 210, h: 120 },
    { x: 280, h: 160 },
  ];
  return (
    <AnimatedSvg viewBox="0 0 400 280" label="Skills progression steps" {...props}>
      <motion.path d="M30 250 H370" stroke={NAVY} strokeOpacity="0.2" strokeWidth="2" variants={draw} />
      {steps.map((step, i) => (
        <motion.g key={step.x} variants={rise} custom={i} style={originBottom}>
          <rect x={step.x} y={250 - step.h} width="62" height={step.h} rx="4" fill={NAVY} />
          <rect x={step.x} y={250 - step.h} width="62" height="6" rx="3" fill={ORANGE} />
          <text x={step.x + 31} y="238" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700" fontFamily="Space Grotesk, sans-serif">
            {String(i + 1).padStart(2, "0")}
          </text>
        </motion.g>
      ))}
      <motion.path d="M101 186 L171 146 L241 106 L282 80" stroke={ORANGE} strokeWidth="3" variants={draw} custom={4} />
      <motion.g variants={pop} custom={6} style={originBottom}>
        <path d="M285 82 Q311 44 337 82 Z" fill={ORANGE} />
        <path d="M278 82 H344" stroke={NAVY} strokeWidth="6" />
        <path d="M311 52 V80" stroke="#fff" strokeWidth="3" />
      </motion.g>
    </AnimatedSvg>
  );
}

function AdvisoryIllustration(props) {
  return (
    <AnimatedSvg viewBox="0 0 400 280" label="Underground mine cross-section" {...props}>
      <motion.path d="M0 80 L60 70 L120 85 L180 60 L240 75 L300 65 L400 80 V280 H0 Z" fill={NAVY} fillOpacity="0.06" variants={pop} style={originBottom} />
      <motion.path d="M0 80 L60 70 L120 85 L180 60 L240 75 L300 65 L400 80" stroke={NAVY} strokeWidth="3" variants={draw} />
      <motion.path d="M0 140 C100 130 250 155 400 138" stroke={NAVY} strokeOpacity="0.15" strokeWidth="2" variants={draw} custom={1} />
      <motion.path d="M0 205 C120 215 260 190 400 210" stroke={NAVY} strokeOpacity="0.15" strokeWidth="2" variants={draw} custom={1} />
      <motion.ellipse cx="265" cy="185" rx="95" ry="52" fill={ORANGE} fillOpacity="0.12" variants={pop} custom={2} style={originCenter} />
      <motion.path d="M100 36 L120 84 L140 36 Z M120 36 V84" stroke={NAVY} strokeWidth="3" variants={draw} custom={2} />
      <motion.path d="M120 84 V250" stroke={NAVY} strokeWidth="6" variants={draw} custom={3} />
      <motion.path d="M120 150 H345 M120 220 H345" stroke={NAVY} strokeWidth="5" variants={draw} custom={4} />
      <motion.path d="M205 150 L225 150 L240 220 L220 220 Z" fill={ORANGE} variants={pop} custom={6} style={originCenter} />
      <motion.path d="M275 150 L295 150 L310 220 L290 220 Z" fill={ORANGE} variants={pop} custom={7} style={originCenter} />
      <motion.path d="M160 150 V138 M180 150 V138 M320 150 V138 M160 220 V208 M185 220 V208" stroke={ORANGE} strokeWidth="2.5" variants={draw} custom={8} />
      <g className="animate-cage motion-reduce:animate-none">
        <rect x="112" y="96" width="16" height="20" rx="2" fill={ORANGE} />
      </g>
    </AnimatedSvg>
  );
}

function InstitutionalIllustration(props) {
  const nodes = [
    [60, 70],
    [340, 70],
    [50, 215],
    [350, 215],
  ];
  return (
    <AnimatedSvg viewBox="0 0 400 280" label="Governance partner network" {...props}>
      {nodes.map(([x, y], i) => (
        <motion.path key={`l${i}`} d={`M200 150 L${x} ${y}`} stroke={ORANGE} strokeWidth="2.5" variants={draw} custom={i + 3} />
      ))}
      <motion.g variants={pop} custom={0} style={originBottom}>
        <path d="M130 108 L200 66 L270 108 Z" fill={NAVY} />
        <rect x="130" y="108" width="140" height="10" fill={ORANGE} />
        {[142, 172, 202, 232].map((x) => (
          <rect key={x} x={x} y="124" width="16" height="66" rx="3" fill={NAVY} />
        ))}
        <rect x="122" y="194" width="156" height="10" rx="2" fill={NAVY} />
        <rect x="112" y="208" width="176" height="10" rx="2" fill={NAVY} />
      </motion.g>
      {nodes.map(([x, y], i) => (
        <g key={`n${i}`} transform={`translate(${x} ${y})`}>
          <motion.g variants={pop} custom={i + 6} style={originCenter}>
            <circle r="20" fill={i % 2 ? NAVY : ORANGE} />
            <circle r="7" fill="#fff" />
          </motion.g>
        </g>
      ))}
    </AnimatedSvg>
  );
}

const bySlug = {
  "esg-compliance": EsgIllustration,
  "circular-economy": CircularIllustration,
  "tvet-workforce": WorkforceIllustration,
  "technical-advisory": AdvisoryIllustration,
  "institutional-advisory": InstitutionalIllustration,
};

export function ServiceIllustration({ slug, className }) {
  const Illustration = bySlug[slug];
  return Illustration ? <Illustration className={className} /> : null;
}

export function StrataIllustration({ className }) {
  const layers = [
    { y: 120, h: 42, fill: "#2d5170" },
    { y: 162, h: 46, fill: "#1f4260" },
    { y: 208, h: 50, fill: "#163550" },
    { y: 258, h: 62, fill: NAVY },
  ];
  return (
    <AnimatedSvg viewBox="0 0 600 320" label="Open pit cut through rock strata" className={className}>
      {layers.map((layer, i) => (
        <motion.rect key={layer.y} x="0" y={layer.y} width="600" height={layer.h} fill={layer.fill} variants={slide} custom={i} />
      ))}
      <motion.path d="M40 290 C120 260 180 310 260 280 S420 250 560 295" stroke={ORANGE} strokeWidth="4" variants={draw} custom={4} />
      <motion.path d="M400 228 C450 243 520 213 590 238" stroke={ORANGE} strokeWidth="3" variants={draw} custom={5} />
      <motion.path
        d="M150 120 L175 150 L200 150 L222 185 L245 185 L265 225 L335 225 L355 185 L378 185 L400 150 L425 150 L450 120 Z"
        fill="#fff"
        variants={pop}
        custom={3}
        style={{ transformBox: "fill-box", transformOrigin: "top" }}
      />
      <motion.path
        d="M150 120 L175 150 L200 150 L222 185 L245 185 L265 225 L335 225 L355 185 L378 185 L400 150 L425 150 L450 120"
        stroke={ORANGE}
        strokeWidth="3"
        variants={draw}
        custom={6}
      />
      <g className="animate-haul motion-reduce:animate-none">
        <motion.g variants={pop} custom={8} style={originBottom}>
          <rect x="272" y="206" width="30" height="13" rx="2" fill={NAVY} />
          <path d="M272 206 L280 196 H302 V206 Z" fill={ORANGE} />
          <circle cx="279" cy="221" r="4" fill={NAVY} />
          <circle cx="296" cy="221" r="4" fill={NAVY} />
        </motion.g>
      </g>
      {[
        [260, 280, 7],
        [490, 229, 8],
        [120, 272, 9],
      ].map(([x, y, i]) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <motion.path d="M0 -9 L8 -4.5 V4.5 L0 9 L-8 4.5 V-4.5 Z" fill={ORANGE} stroke="#fff" strokeWidth="1.5" variants={pop} custom={i} style={originCenter} />
        </g>
      ))}
    </AnimatedSvg>
  );
}
