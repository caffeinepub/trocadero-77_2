export function ConfidenceRing({ value }: { value: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <svg
        className="absolute inset-0 -rotate-90"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <title>Confidence Ring</title>
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="4"
          stroke="oklch(88% 0.01 240)"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="4"
          stroke="oklch(50% 0.13 60)"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="text-xs font-mono font-bold gold-text">{value}%</span>
    </div>
  );
}
