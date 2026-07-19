import type { OvrPoint } from "@/lib/ovr-evolution";

const WIDTH = 320;
const HEIGHT = 130;
const PADDING = 24;

export function OvrEvolutionChart({ points }: { points: OvrPoint[] }) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-muted">
        A evolução aparece aqui após o primeiro jogo registrado na súmula.
      </p>
    );
  }

  const values = points.map((p) => p.ovr);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const stepX = points.length > 1 ? (WIDTH - PADDING * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => ({
    x: PADDING + index * stepX,
    y: HEIGHT - PADDING - ((point.ovr - min) / range) * (HEIGHT - PADDING * 2),
    point,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label="Evolução do overall ao longo do campeonato"
    >
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c.x} cy={c.y} r={3} fill="var(--accent)" />
          <text x={c.x} y={c.y - 8} textAnchor="middle" fontSize={9} fill="var(--foreground)">
            {c.point.ovr}
          </text>
          <text x={c.x} y={HEIGHT - 6} textAnchor="middle" fontSize={8} fill="var(--muted)">
            {c.point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
