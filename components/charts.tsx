"use client";
interface SparkProps { values: number[]; height?: number; }
export function Sparkline({ values, height = 60 }: SparkProps) {
  if (!values.length) return <p className="text-xs text-text-dim">No recent commits.</p>;
  const W = 320, H = height, P = 3;
  const max = Math.max(1, ...values);
  const xs = values.map((_, i) => P + (i * (W - 2 * P)) / Math.max(1, values.length - 1));
  const ys = values.map((v) => H - P - (v / max) * (H - 2 * P));
  const points = xs.map((x, i) => `${x.toFixed(2)},${ys[i]!.toFixed(2)}`).join(" ");
  const area = `M ${xs[0]},${(H - P).toFixed(2)} L ${points} L ${xs.at(-1)},${(H - P).toFixed(2)} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="commits per day">
      <defs><linearGradient id="spkfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2d8659" stopOpacity="0.25" /><stop offset="100%" stopColor="#2d8659" stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill="url(#spkfill)" />
      <polyline points={points} fill="none" stroke="#2d8659" strokeWidth={1.5} />
      {values.map((v, i) => v === max ? <circle key={i} cx={xs[i]} cy={ys[i]} r={2.5} fill="#2d8659" /> : null)}
    </svg>
  );
}

interface DonutInput { label: string; value: number; color: string; }
export function Donut({ data, size = 140 }: { data: DonutInput[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="px-5 py-4 text-xs text-text-muted">No open issues.</p>;
  const r = size / 2 - 12, cx = size / 2, cy = size / 2;
  let acc = 0;
  const arcs = data.filter((d) => d.value > 0).map((d) => {
    const a0 = (acc / total) * 2 * Math.PI; acc += d.value;
    const a1 = (acc / total) * 2 * Math.PI;
    const x0 = cx + r * Math.cos(a0 - Math.PI / 2), y0 = cy + r * Math.sin(a0 - Math.PI / 2);
    const x1 = cx + r * Math.cos(a1 - Math.PI / 2), y1 = cy + r * Math.sin(a1 - Math.PI / 2);
    const big = a1 - a0 > Math.PI ? 1 : 0;
    return { ...d, d: `M ${cx},${cy} L ${x0},${y0} A ${r},${r} 0 ${big} 1 ${x1},${y1} Z` };
  });
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((a) => <path key={a.label} d={a.d} fill={a.color}><title>{a.label}: {a.value}</title></path>)}
        <circle cx={cx} cy={cy} r={r * 0.65} fill="#ffffff" />
      </svg>
      <ul className="flex-1 space-y-1 text-xs">
        {data.filter((d) => d.value > 0).map((d) => (
          <li key={d.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.label}</span>
            <span className="text-text-muted">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReleaseGauge({ score, band }: { score: number; band: "safe" | "moderate" | "high-risk" }) {
  const angle = Math.min(180, (score / 100) * 180);
  const color = band === "safe" ? "#2d8659" : band === "moderate" ? "#b8730a" : "#c94040";
  const rad = (angle - 180) * (Math.PI / 180);
  const r = 70, cx = 100, cy = 90;
  const x = cx + r * Math.cos(rad), y = cy + r * Math.sin(rad);
  const label = band === "safe" ? "Ready to ship" : band === "moderate" ? "Ship with care" : "Hold release";
  return (
    <div className="flex flex-col items-center px-5 py-6">
      <svg viewBox="0 0 200 110" className="w-full max-w-[260px]" aria-label={`Release readiness ${score} of 100`}>
        <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`} fill="none" stroke="#e3e6eb" strokeWidth={12} strokeLinecap="round" />
        <path d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${x.toFixed(2)},${y.toFixed(2)}`} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" />
        <text x={cx} y={cy - 12} textAnchor="middle" fill="#1a1b26" fontSize={28} fontWeight={700}>{score}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="#8b95a5" fontSize={11}>of 100</text>
      </svg>
      <p className="text-sm font-semibold" style={{ color }}>{label}</p>
    </div>
  );
}
