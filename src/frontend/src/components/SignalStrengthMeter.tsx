interface Props {
  strength: "strong" | "weakening" | "at_risk";
}

export function SignalStrengthMeter({ strength }: Props) {
  const configs = {
    strong: {
      segments: [
        { color: "oklch(55% 0.18 145)" },
        { color: "oklch(55% 0.18 145)" },
        { color: "oklch(55% 0.18 145)" },
      ],
      label: "Strong Signal",
      textColor: "oklch(40% 0.18 145)",
    },
    weakening: {
      segments: [
        { color: "oklch(72% 0.15 85)" },
        { color: "oklch(72% 0.15 85)" },
        { color: "oklch(85% 0.02 0)" },
      ],
      label: "Weakening",
      textColor: "oklch(50% 0.15 85)",
    },
    at_risk: {
      segments: [
        { color: "oklch(58% 0.2 25)" },
        { color: "oklch(85% 0.02 0)" },
        { color: "oklch(85% 0.02 0)" },
      ],
      label: "At Risk",
      textColor: "oklch(45% 0.2 25)",
    },
  };

  const cfg = configs[strength];

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {cfg.segments.map((seg, i) => (
          <div
            key={`seg-${i}-${strength}`}
            className="w-4 h-2 rounded-sm"
            style={{ background: seg.color }}
          />
        ))}
      </div>
      <span
        className="text-[10px] font-mono font-bold"
        style={{ color: cfg.textColor }}
      >
        {cfg.label}
      </span>
    </div>
  );
}
