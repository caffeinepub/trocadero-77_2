import { Clock, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import type { SignalData } from "../hooks/useCryptoSignals";
import { hasLearningData } from "../hooks/useLearningEngine";
import { ConfidenceRing } from "./ConfidenceRing";
import { SignalCarousel } from "./SignalCarousel";
import { SignalStrengthMeter } from "./SignalStrengthMeter";

function fmtPrice(p: number) {
  if (p >= 1000)
    return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

function FastTradeCard({
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
  const aiTrained = hasLearningData(signal.symbol);

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
      data-ocid="fasttrades.card"
    >
      {/* Amber/lightning accent bar */}
      <div
        className="h-1"
        style={{
          background:
            "linear-gradient(90deg, oklch(72% 0.18 75), oklch(62% 0.15 65 / 0.4))",
        }}
      />
      <div className="p-4 sm:p-5">
        {/* FAST TRADE badge */}
        <div className="flex items-center justify-center mb-3">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold"
            style={{
              background: "oklch(72% 0.18 75 / 0.15)",
              border: "1px solid oklch(72% 0.18 75 / 0.35)",
              color: "oklch(50% 0.18 75)",
            }}
          >
            <Zap className="w-3 h-3 fill-current" />
            FAST TRADE
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm font-bold font-display text-white flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(65% 0.18 75), oklch(55% 0.15 65))",
              }}
            >
              {signal.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="font-display font-bold text-sm sm:text-base md:text-lg leading-tight text-foreground">
                {signal.coinName}
              </div>
              <div className="text-[10px] sm:text-xs font-mono text-foreground/60">
                {signal.symbol}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono font-bold text-sm sm:text-base md:text-lg text-foreground">
              {fmtPrice(signal.entryPrice)}
            </div>
            <div
              className="text-[10px] sm:text-xs font-mono font-bold"
              style={{ color: "oklch(62% 0.18 145)" }}
            >
              LONG
            </div>
          </div>
        </div>

        {/* TP in */}
        <div
          className="flex items-center justify-center gap-1.5 mb-3 py-2 rounded-xl"
          style={{
            background: "oklch(72% 0.18 75 / 0.08)",
            border: "1px solid oklch(72% 0.18 75 / 0.2)",
          }}
        >
          <Clock
            className="w-3.5 h-3.5"
            style={{ color: "oklch(50% 0.18 75)" }}
          />
          <span
            className="text-xs sm:text-sm font-mono font-bold"
            style={{ color: "oklch(50% 0.18 75)" }}
          >
            TP in ~{signal.estimatedHours}h
          </span>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            {
              label: "TP",
              value: fmtPrice(signal.takeProfit),
              color: "oklch(62% 0.18 145)",
            },
            {
              label: "SL",
              value: fmtPrice(signal.stopLoss),
              color: "oklch(60% 0.2 25)",
            },
            {
              label: "R:R",
              value: `${(signal.profitPercent / Math.max(0.01, Math.abs(((signal.stopLoss - signal.entryPrice) / signal.entryPrice) * 100))).toFixed(1)}x`,
              color: "oklch(65% 0.15 260)",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="text-center p-2 rounded-lg"
              style={{ background: "oklch(97% 0.005 240)" }}
            >
              <div className="text-[9px] sm:text-[10px] font-mono text-foreground/50 mb-0.5">
                {m.label}
              </div>
              <div
                className="text-xs sm:text-sm font-mono font-bold"
                style={{ color: m.color }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-between mb-3">
          <ConfidenceRing value={signal.confidence} />
          <SignalStrengthMeter strength={signal.signalStrength} />
          {aiTrained && (
            <div
              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "oklch(65% 0.18 260 / 0.1)",
                color: "oklch(55% 0.18 260)",
                border: "1px solid oklch(65% 0.18 260 / 0.2)",
              }}
            >
              AI
            </div>
          )}
        </div>

        {/* TP Probability */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] sm:text-xs font-mono text-foreground/60">
              TP Probability
            </span>
            <span
              className="text-[10px] sm:text-xs font-mono font-bold"
              style={{
                color:
                  signal.tpProbability >= 80
                    ? "oklch(62% 0.18 145)"
                    : "oklch(72% 0.18 75)",
              }}
            >
              {signal.tpProbability}%
            </span>
          </div>
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "oklch(93% 0.01 240)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${signal.tpProbability}%`,
                background:
                  signal.tpProbability >= 80
                    ? "oklch(62% 0.18 145)"
                    : "oklch(72% 0.18 75)",
              }}
            />
          </div>
        </div>

        {/* Track button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTrack(signal);
          }}
          className="w-full py-2 sm:py-2.5 rounded-xl font-mono font-semibold text-xs sm:text-sm transition-all"
          style={{
            background: isTracked
              ? "oklch(62% 0.18 145 / 0.1)"
              : "oklch(72% 0.18 75 / 0.1)",
            border: `1px solid ${
              isTracked
                ? "oklch(62% 0.18 145 / 0.3)"
                : "oklch(72% 0.18 75 / 0.3)"
            }`,
            color: isTracked ? "oklch(55% 0.18 145)" : "oklch(50% 0.18 75)",
          }}
          data-ocid="fasttrades.toggle"
        >
          {isTracked ? "✓ Tracking" : "Track Trade"}
        </button>
      </div>
    </button>
  );
}

export default function FastTradingSection({
  signals,
  onSelectSignal,
  onTrack,
  trackedIds,
}: {
  signals: SignalData[];
  onSelectSignal: (s: SignalData) => void;
  onTrack: (s: SignalData) => void;
  trackedIds: Set<string>;
}) {
  const fastSignals = signals
    .filter(
      (s) =>
        s.estimatedHours <= 18 &&
        s.confidence >= 82 &&
        s.tpProbability >= 65 &&
        s.direction === "long" &&
        s.aiDumpRisk !== "HIGH",
    )
    .slice(0, 10);

  if (fastSignals.length === 0) {
    return (
      <section className="px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "oklch(72% 0.18 75 / 0.1)",
              border: "1px solid oklch(72% 0.18 75 / 0.2)",
            }}
          >
            <Zap className="w-8 h-8" style={{ color: "oklch(72% 0.18 75)" }} />
          </div>
          <h2
            className="font-display font-bold text-xl mb-2"
            style={{ color: "oklch(72% 0.18 75)" }}
          >
            No Fast Trades Right Now
          </h2>
          <p className="text-sm font-mono text-foreground/60">
            AI is scanning for lightning-fast opportunities. Check back in a
            moment.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pt-24 pb-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "oklch(72% 0.18 75 / 0.1)",
                border: "1px solid oklch(72% 0.18 75 / 0.25)",
              }}
            >
              <Zap
                className="w-5 h-5"
                style={{ color: "oklch(72% 0.18 75)" }}
              />
            </div>
            <div>
              <h2
                className="font-display font-bold text-xl"
                style={{ color: "oklch(72% 0.18 75)" }}
              >
                Fast Trades
              </h2>
              <p className="text-xs font-mono text-foreground/60">
                TP expected within 12h
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: "oklch(72% 0.18 75 / 0.1)",
              border: "1px solid oklch(72% 0.18 75 / 0.25)",
            }}
          >
            <TrendingUp
              className="w-3.5 h-3.5"
              style={{ color: "oklch(72% 0.18 75)" }}
            />
            <span
              className="text-xs font-mono font-bold"
              style={{ color: "oklch(72% 0.18 75)" }}
            >
              {fastSignals.length} signal
              {fastSignals.length !== 1 ? "s" : ""} available
            </span>
          </div>
        </motion.div>

        <SignalCarousel
          signals={fastSignals}
          renderCard={(signal, _index) => (
            <FastTradeCard
              signal={signal}
              onClick={() => onSelectSignal(signal)}
              onTrack={onTrack}
              isTracked={trackedIds.has(signal.id)}
            />
          )}
          onSelectSignal={onSelectSignal}
        />
      </div>
    </section>
  );
}
