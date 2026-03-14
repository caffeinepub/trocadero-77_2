import {
  ChevronLeft,
  ChevronRight,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";
import type { SignalData } from "../hooks/useCryptoSignals";

function fmtPrice(p: number) {
  if (p >= 1000)
    return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

function ConfidenceRing({ value }: { value: number }) {
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
          stroke="oklch(18% 0.01 240)"
        />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          strokeWidth="4"
          stroke="oklch(75% 0.15 60)"
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

function SwipeCard({
  signal,
  onAccept,
  onSkip,
  onClick,
  zIndex,
  offset,
}: {
  signal: SignalData;
  onAccept: () => void;
  onSkip: () => void;
  onClick: () => void;
  zIndex: number;
  offset: number;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const buyOp = useTransform(x, [0, 80], [0, 1]);
  const skipOp = useTransform(x, [-80, 0], [1, 0]);
  const isBuy = signal.direction === "long";
  const dragged = useRef(false);

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex }}
      drag="x"
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.8}
      onDragStart={() => {
        dragged.current = false;
      }}
      onDrag={(_, info) => {
        if (Math.abs(info.offset.x) > 5) dragged.current = true;
      }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onAccept();
        else if (info.offset.x < -120) onSkip();
      }}
      onClick={() => {
        if (!dragged.current) onClick();
      }}
      initial={{ opacity: 0, scale: 1 - offset * 0.04, y: offset * 12 }}
      animate={{
        opacity: offset === 0 ? 1 : 0.8,
        scale: 1 - offset * 0.04,
        y: offset * 12,
      }}
      exit={{
        opacity: 0,
        x: -300,
        rotate: -15,
        transition: { duration: 0.35 },
      }}
      className="absolute w-full cursor-pointer select-none"
      data-ocid="signal.card"
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "oklch(10% 0.015 240 / 0.85)",
          backdropFilter: "blur(12px)",
          border: `1px solid oklch(${isBuy ? "62% 0.18 145" : "60% 0.18 25"} / 0.3)`,
          boxShadow: `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px oklch(${isBuy ? "62% 0.18 145" : "60% 0.18 25"} / 0.1), ${isBuy ? "0 0 30px oklch(62% 0.18 145 / 0.12)" : "0 0 30px oklch(60% 0.18 25 / 0.12)"}`,
        }}
      >
        <div
          className="h-1"
          style={{
            background: isBuy
              ? "linear-gradient(90deg, oklch(62% 0.18 145), oklch(52% 0.12 145 / 0.3))"
              : "linear-gradient(90deg, oklch(60% 0.18 25), oklch(50% 0.12 25 / 0.3))",
          }}
        />
        <motion.div
          style={{ opacity: buyOp }}
          className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-signal-buy text-white text-xs font-bold rotate-12"
        >
          ACCEPT ✓
        </motion.div>
        <motion.div
          style={{ opacity: skipOp }}
          className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-signal-sell text-white text-xs font-bold -rotate-12"
        >
          SKIP ✕
        </motion.div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold font-display text-white"
                style={{
                  background: isBuy
                    ? "oklch(62% 0.18 145)"
                    : "oklch(60% 0.18 25)",
                }}
              >
                {signal.symbol.slice(0, 2)}
              </div>
              <div>
                <div className="font-display font-bold text-lg leading-tight">
                  {signal.coinName}
                </div>
                <div className="text-xs font-mono text-foreground/70">
                  {signal.symbol}/USDT
                </div>
              </div>
            </div>
            <ConfidenceRing value={signal.confidence} />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                isBuy
                  ? "bg-signal-buy/15 text-signal-buy border border-signal-buy/25"
                  : "bg-signal-sell/15 text-signal-sell border border-signal-sell/25"
              }`}
            >
              {isBuy ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {isBuy ? "LONG / BUY" : "SHORT / SELL"}
            </div>
            <div className="ml-auto inline-flex items-center px-2.5 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-xs font-mono font-bold text-gold">
              +{signal.profitPercent}%
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              {
                label: "Live Price",
                value: fmtPrice(signal.currentPrice),
                hi: true,
              },
              { label: "Entry", value: fmtPrice(signal.entryPrice), hi: false },
              {
                label: "Take Profit",
                value: fmtPrice(signal.takeProfit),
                hi: false,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg bg-surface-2/70 p-2.5 text-center"
              >
                <div
                  className={`text-sm font-mono font-bold ${item.hi ? "text-gold" : "text-foreground"}`}
                >
                  {item.value}
                </div>
                <div className="text-[10px] text-foreground/65 mt-0.5">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-foreground/70">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold/60" />
              <span className="font-mono">
                Est. {signal.estimatedHours}h to target
              </span>
            </div>
            <span className="font-mono text-gold/60">Tap for details →</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface Props {
  signals: SignalData[];
  onSelectSignal: (s: SignalData) => void;
  onRescan: () => void;
  isScanning: boolean;
  lastScanTime: Date | null;
}

export default function SignalCardSection({
  signals,
  onSelectSignal,
  onRescan,
  isScanning,
  lastScanTime,
}: Props) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible: number[] = [];
  for (let i = 0; i < signals.length && visible.length < 3; i++) {
    if (!dismissed.has(i)) visible.push(i);
  }

  const handleSkip = () => {
    if (visible.length === 0) return;
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(visible[0]);
      if (next.size >= signals.length) return new Set();
      return next;
    });
  };

  const handleAccept = () => {
    if (visible[0] !== undefined) onSelectSignal(signals[visible[0]]);
  };

  const remaining = signals.length - dismissed.size;

  return (
    <section id="signals" className="relative py-24 px-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-16 text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/20 bg-gold/5 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-xs font-mono text-gold tracking-widest">
            LIVE SIGNALS
          </span>
        </div>
        <h2 className="section-heading text-4xl md:text-5xl font-bold mb-4">
          Trading <span className="gold-gradient">Signals</span>
        </h2>
        <p className="text-foreground/70 max-w-lg mx-auto">
          Swipe right to accept, left to skip. Click any card for full analysis.
        </p>
        {lastScanTime && (
          <p className="text-xs font-mono text-foreground/55 mt-2">
            Last scan: {lastScanTime.toLocaleTimeString()}
          </p>
        )}
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <div className="flex-1 flex flex-col items-center">
          <div className="relative w-full max-w-sm h-80 signal-card-stack mb-8">
            {visible.length === 0 ? (
              <div
                className="w-full h-full flex flex-col items-center justify-center glass-card rounded-2xl border border-border gap-4"
                data-ocid="signal.empty_state"
              >
                <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-gold" />
                </div>
                <div className="text-center">
                  <div className="font-display text-lg mb-1">
                    All Signals Reviewed
                  </div>
                  <div className="text-sm text-foreground/70">
                    Rescan for new opportunities
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                {visible
                  .slice(0)
                  .reverse()
                  .map((idx, stackPos) => (
                    <SwipeCard
                      key={signals[idx].id}
                      signal={signals[idx]}
                      onAccept={handleAccept}
                      onSkip={handleSkip}
                      onClick={() => onSelectSignal(signals[idx])}
                      zIndex={visible.length - stackPos}
                      offset={visible.length - 1 - stackPos}
                    />
                  ))}
              </AnimatePresence>
            )}
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              data-ocid="signal.secondary_button"
              onClick={handleSkip}
              className="w-14 h-14 rounded-full border border-signal-sell/30 bg-signal-sell/10 flex items-center justify-center text-signal-sell hover:bg-signal-sell/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="text-center">
              <div className="text-sm font-mono text-foreground/65">
                {remaining} signals
              </div>
              <div className="flex gap-1 mt-1 justify-center">
                {Array.from({ length: Math.min(10, signals.length) }).map(
                  (_, i) => (
                    <div
                      key={signals[i]?.id ?? i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i < dismissed.size ? "bg-border" : "bg-gold/60"}`}
                    />
                  ),
                )}
              </div>
            </div>
            <button
              type="button"
              data-ocid="signal.primary_button"
              onClick={handleAccept}
              className="w-14 h-14 rounded-full border border-signal-buy/30 bg-signal-buy/10 flex items-center justify-center text-signal-buy hover:bg-signal-buy/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="text-xs font-mono text-foreground/65 uppercase tracking-wider mb-4">
            All Active Signals
          </div>
          {signals.map((signal, idx) => {
            const ib = signal.direction === "long";
            return (
              <motion.button
                key={signal.id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => onSelectSignal(signal)}
                data-ocid={`signal.item.${idx + 1}`}
                className="w-full text-left rounded-xl border border-border bg-surface-2/40 hover:border-gold/20 hover:bg-surface-2 transition-all p-3 flex items-center gap-3 group"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{
                    background: ib
                      ? "oklch(62% 0.18 145)"
                      : "oklch(60% 0.18 25)",
                  }}
                >
                  {signal.symbol.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {signal.coinName}
                  </div>
                  <div className="text-xs font-mono text-foreground/65">
                    {signal.symbol}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-sm font-mono font-bold ${ib ? "text-signal-buy" : "text-signal-sell"}`}
                  >
                    +{signal.profitPercent}%
                  </div>
                  <div className="text-xs font-mono text-gold/60">
                    {signal.confidence}% conf
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-foreground/50 group-hover:text-gold/40 transition-colors flex-shrink-0" />
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center mt-16">
        <button
          type="button"
          data-ocid="signal.rescan_button"
          onClick={onRescan}
          disabled={isScanning}
          className="relative flex items-center gap-3 px-8 py-4 rounded-2xl border border-gold/30 bg-gold/5 hover:bg-gold/10 transition-all disabled:opacity-60 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {isScanning ? (
            <>
              <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
              <span className="font-mono text-gold">Scanning markets...</span>
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5 text-gold" />
              <span className="font-mono text-gold font-medium">
                Rescan Markets
              </span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
