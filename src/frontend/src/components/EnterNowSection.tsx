import {
  ChevronDown,
  ChevronRight,
  Clock,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { SignalData } from "../hooks/useCryptoSignals";
import { hasLearningData } from "../hooks/useLearningEngine";
import { ConfidenceRing } from "./ConfidenceRing";
import { SignalCarousel } from "./SignalCarousel";
import { SignalStrengthMeter } from "./SignalStrengthMeter";

const THRESHOLD = 0.015;

function fmtPrice(p: number) {
  if (p >= 1000)
    return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

function TradeCard({
  signal,
  onClick,
  onTrack,
  isTracked,
}: {
  signal: SignalData;
  onClick: () => void;
  onTrack: (s: SignalData) => void;
  isTracked: boolean;
}) {
  const isBuy = signal.direction === "long";
  const aiTrained = hasLearningData(signal.symbol);
  const gap =
    Math.abs(signal.currentPrice - signal.entryPrice) / signal.entryPrice;
  const proximityPct = Math.max(0, Math.min(100, (1 - gap / THRESHOLD) * 100));

  return (
    <button
      type="button"
      className="rounded-2xl overflow-hidden cursor-pointer w-full text-left"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.15)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
      onClick={onClick}
      data-ocid="enter-now.card"
    >
      <div
        className="h-1"
        style={{
          background: isBuy
            ? "linear-gradient(90deg, oklch(62% 0.18 145), oklch(52% 0.12 145 / 0.3))"
            : "linear-gradient(90deg, oklch(60% 0.18 25), oklch(50% 0.12 25 / 0.3))",
        }}
      />
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm font-bold font-display text-white flex-shrink-0"
              style={{
                background: isBuy
                  ? "oklch(62% 0.18 145)"
                  : "oklch(60% 0.18 25)",
              }}
            >
              {signal.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="font-display font-bold text-sm sm:text-base md:text-lg leading-tight text-foreground">
                {signal.coinName}
              </div>
              <div className="text-[10px] sm:text-xs font-mono text-foreground/60">
                {signal.symbol}/USDT
              </div>
              {aiTrained && (
                <div className="text-[10px] font-mono text-blue-500 mt-0.5">
                  🤖 AI Trained
                </div>
              )}
            </div>
          </div>
          <ConfidenceRing value={signal.confidence} />
        </div>
        <div className="mt-2 mb-1">
          <SignalStrengthMeter strength={signal.signalStrength ?? "strong"} />
        </div>

        {/* Urgency badge */}
        <div className="flex items-center gap-1.5 mb-3 sm:mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-signal-buy/15 border border-signal-buy/25 text-[10px] sm:text-xs font-mono font-bold text-signal-buy">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-buy opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-buy" />
            </span>
            ENTER NOW
          </div>
          <div
            className={`ml-auto inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold ${
              isBuy
                ? "bg-signal-buy/15 text-signal-buy border border-signal-buy/25"
                : "bg-signal-sell/15 text-signal-sell border border-signal-sell/25"
            }`}
          >
            {isBuy ? (
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
            {isBuy ? "LONG / BUY" : "SHORT / SELL"}
          </div>
        </div>

        {/* Proximity bar */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between text-[10px] font-mono text-foreground/50 mb-1">
            <span>Price Proximity to Entry</span>
            <span className="text-signal-buy font-bold">
              {proximityPct.toFixed(0)}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-signal-buy transition-all"
              style={{ width: `${proximityPct}%` }}
            />
          </div>
        </div>

        {/* Price grid */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
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
              className="rounded-lg bg-muted p-2 sm:p-2.5 text-center"
            >
              <div
                className={`text-xs sm:text-sm font-mono font-bold truncate ${item.hi ? "text-gold" : "text-foreground"}`}
              >
                {item.value}
              </div>
              <div className="text-[9px] sm:text-[10px] text-foreground/55 mt-0.5">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* Safe Exit row */}
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-foreground/60 bg-muted/60 rounded-lg px-2 sm:px-3 py-2 mb-3">
          <span className="text-foreground/50">🛡 Safe Exit</span>
          <span className="font-bold text-foreground/75">
            {fmtPrice(signal.safeExitPrice)}
          </span>
          <span className="text-foreground/40">
            SL: {fmtPrice(signal.stopLoss)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] sm:text-xs text-foreground/65">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold/60" />
            <span className="font-mono">
              Est. {signal.estimatedHours}h (max {signal.maxHoldHours}h)
            </span>
          </div>
          <span className="font-mono text-gold/60">Tap for details →</span>
        </div>
        <div className="mt-3 pt-3 border-t border-border/50">
          {isTracked ? (
            <div className="text-xs font-mono text-signal-buy font-bold flex items-center gap-1">
              ✓ Tracking
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTrack(signal);
              }}
              className={`min-h-[44px] text-xs font-mono font-bold px-3 py-2 rounded-lg border transition-colors ${
                signal.direction === "long"
                  ? "border-signal-buy text-signal-buy hover:bg-signal-buy/10"
                  : "border-signal-sell text-signal-sell hover:bg-signal-sell/10"
              }`}
              data-ocid="enter-now.secondary_button"
            >
              Track Trade
            </button>
          )}
        </div>
      </div>
    </button>
  );
}

interface Props {
  signals: SignalData[];
  onSelectSignal: (signal: SignalData) => void;
  onTrack: (s: SignalData) => void;
  trackedIds: Set<string>;
}

export default function EnterNowSection({
  signals,
  onSelectSignal,
  onTrack,
  trackedIds,
}: Props) {
  const [isListOpen, setIsListOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setTick((t) => t + 1), 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  void tick;

  const sorted = [...signals]
    .filter((s) => {
      const gap = Math.abs(s.currentPrice - s.entryPrice) / s.entryPrice;
      return gap < THRESHOLD;
    })
    .sort((a, b) => {
      const gA = Math.abs(a.currentPrice - a.entryPrice) / a.entryPrice;
      const gB = Math.abs(b.currentPrice - b.entryPrice) / b.entryPrice;
      return gA - gB;
    });

  return (
    <section
      className="px-3 sm:px-4 md:px-6 py-4 max-w-6xl mx-auto"
      data-ocid="enter-now.section"
    >
      {/* Static Header */}
      <div className="w-full flex flex-wrap items-center gap-3 sm:gap-4 py-4 sm:py-6 px-2">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Trade Now
        </h2>
        <div className="flex items-center gap-1.5 bg-signal-buy/10 border border-signal-buy/30 rounded-full px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-buy opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-buy" />
          </span>
          <span className="text-xs font-bold font-mono text-signal-buy uppercase tracking-widest">
            ENTER NOW
          </span>
        </div>
        <span className="text-xs text-foreground/50 font-mono">
          {sorted.length} signal{sorted.length !== 1 ? "s" : ""} ready
        </span>
      </div>

      {/* Always-visible Content */}
      <div className="pb-8 sm:pb-10">
        <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 items-start">
          {/* Left: carousel */}
          <div className="flex-1 w-full">
            {sorted.length === 0 ? (
              <div
                className="w-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border gap-4 py-12 sm:py-16"
                style={{ background: "#ffffff" }}
                data-ocid="enter-now.empty_state"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                  <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-gold" />
                </div>
                <div className="text-center">
                  <div className="font-display text-base sm:text-lg mb-1 text-foreground">
                    All Reviewed
                  </div>
                  <div className="text-sm text-foreground/60">
                    Signals within 1.5% of entry appear here
                  </div>
                </div>
              </div>
            ) : (
              <SignalCarousel
                signals={sorted}
                onSelectSignal={onSelectSignal}
                renderCard={(signal) => (
                  <TradeCard
                    signal={signal}
                    onClick={() => onSelectSignal(signal)}
                    onTrack={onTrack}
                    isTracked={trackedIds.has(signal.id)}
                  />
                )}
              />
            )}
          </div>

          {/* Right: compact list */}
          <div className="flex-1 space-y-3 w-full">
            <button
              type="button"
              data-ocid="enter-now.list.toggle"
              onClick={() => setIsListOpen((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-mono text-foreground/55 uppercase tracking-wider mb-4 cursor-pointer hover:text-foreground/80 transition-colors rounded-lg px-2 py-2 hover:bg-black/5 min-h-[44px]"
            >
              <span>All Trade Now Signals ({sorted.length})</span>
              <motion.div
                animate={{ rotate: isListOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isListOpen && (
                <motion.div
                  key="enter-now-list"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  {sorted.length === 0 ? (
                    <div
                      className="rounded-xl p-6 text-center text-sm text-foreground/50 font-mono"
                      style={{
                        background: "#ffffff",
                        border: "1px solid rgba(0,0,0,0.1)",
                      }}
                    >
                      No signals near entry price right now
                    </div>
                  ) : (
                    sorted.map((signal, idx) => {
                      const ib = signal.direction === "long";
                      return (
                        <motion.button
                          key={signal.id}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => onSelectSignal(signal)}
                          data-ocid={`enter-now.item.${idx + 1}`}
                          className="w-full text-left rounded-xl p-3 flex items-center gap-3 group transition-all mb-2 min-h-[52px]"
                          style={{
                            background: "#ffffff",
                            border: "1px solid rgba(0,0,0,0.15)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                        >
                          <div
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{
                              background: ib
                                ? "oklch(62% 0.18 145)"
                                : "oklch(60% 0.18 25)",
                            }}
                          >
                            {signal.symbol.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate text-foreground">
                              {signal.coinName}
                            </div>
                            <div className="text-xs font-mono text-foreground/55">
                              {signal.symbol}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div
                              className={`text-sm font-mono font-bold ${
                                ib ? "text-signal-buy" : "text-signal-sell"
                              }`}
                            >
                              +{signal.profitPercent}%
                            </div>
                            <div className="text-xs font-mono text-gold/70">
                              {signal.confidence}% conf
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-foreground/35 group-hover:text-gold/60 transition-colors flex-shrink-0" />
                        </motion.button>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
