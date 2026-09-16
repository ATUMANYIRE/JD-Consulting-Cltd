const CENTERS = [
  { cx: 1050, cy: 110, rings: 16, step: 36, phases: [0.4, 2.1, 4.3] },
  { cx: 140, cy: 700, rings: 12, step: 40, phases: [1.7, 0.2, 3.1] },
];

// Nested irregular rings that read like a topographic survey map.
function contourPath(cx, cy, radius, [p1, p2, p3]) {
  const points = 72;
  let d = "";
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = radius * (1 + 0.16 * Math.sin(3 * a + p1) + 0.09 * Math.sin(5 * a + p2) + 0.05 * Math.sin(8 * a + p3));
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return d + "Z";
}

const CONTOURS = CENTERS.flatMap((center) =>
  Array.from({ length: center.rings }, (_, i) => ({
    d: contourPath(center.cx, center.cy, 30 + i * center.step, center.phases),
    index: i,
  }))
);

const fill = { position: "absolute", inset: 0 };

export default function NavyPattern() {
  return (
    <div aria-hidden="true" className="pointer-events-none overflow-hidden rounded-[inherit]" style={fill}>
      <div
        className="bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]"
        style={fill}
      />
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" className="h-full w-full" style={fill}>
        {CONTOURS.map(({ d, index }) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={index % 4 === 3 ? "#E28A2E" : "#ffffff"}
            strokeOpacity={index % 4 === 3 ? 0.22 : 0.07}
            strokeWidth={index % 4 === 3 ? 1.4 : 1}
          />
        ))}
      </svg>
      <div className="h-80 w-80 rounded-full bg-orange/20 blur-3xl" style={{ position: "absolute", right: "-6rem", top: "-6rem" }} />
      <div className="h-72 w-72 rounded-full bg-[#2d5170]/70 blur-3xl" style={{ position: "absolute", left: "-4rem", bottom: "-8rem" }} />
    </div>
  );
}
