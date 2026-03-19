import {
  Award,
  ChevronDown,
  ChevronRight,
  Clock,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
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

function HighProfitCard({
  signal,
  index,
  onClick,
  onTrack,
  isTracked,
}: {
  signal: SignalData;
  index: number;
  onClick: () => void;
  onTrack: (s: SignalData) => void;
  isTracked: boolean;
}) {
  const isBuy = signal.direction === "long";
  const isTop = index === 0;
  const aiTrained = hasLearningData(signal.symbol);

  return (
    <button
      type="button"
      className="rounded-2xl overflow-hidden cursor-pointer w-full text-left"
      style={{
        background: "#ffffff",
        border: isTop
          ? "1px solid rgba(0,0,0,0.25)"
          : "1px solid rgba(0,0,0,0.15)",
        boxShadow: isTop
          ? "0 8px 32px rgba(0,0,0,0.18)"
          : "0 8px 24px rgba(0,0,0,0.12)",
      }}
      onClick={onClick}
      data-ocid="highprofit.card"
    >
      <div
        className="h-1"
        style={{
          background: isTop
            ? "linear-gradient(90deg, oklch(52% 0.15 60), oklch(44% 0.12 55))"
            : isBuy
              ? "linear-gradient(90deg, oklch(62% 0.18 145), oklch(52% 0.12 145 / 0.3))"
              : "linear-gradient(90deg, oklch(60% 0.18 25), oklch(50% 0.12 25 / 0.3))",
        }}
      />
      <div className="p-4 sm:p-5">
        {/* MAX PROFIT badge for #1 */}
        {isTop && (
          <div className="flex items-center justify-center mb-2 sm:mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-gold/15 border border-gold/40 text-[10px] sm:text-xs font-mono font-bold text-gold">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-gold" />
              MAX PROFIT
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-gold" />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm font-bold font-display text-white flex-shrink-0"
              style={{
                background: isTop
                  ? "linear-gradient(135deg, oklch(52% 0.15 60), oklch(44% 0.12 55))"
                  : isBuy
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

        {/* Rank + direction badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
          <div
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold ${
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
          <div className="ml-auto inline-flex items-center px-2 sm:px-3 py-1.5 rounded-lg bg-signal-buy/10 border border-signal-buy/25 text-xs sm:text-sm font-mono font-bold text-signal-buy">
            ↑ {signal.profitPercent}% TP
          </div>
        </div>

        {/* Profit highlight for top signal */}
        {isTop && (
          <div className="mb-3 sm:mb-4 rounded-xl bg-gold/8 border border-gold/20 p-2.5 sm:p-3 text-center">
            <div className="text-xl sm:text-2xl font-mono font-bold text-gold">
              +{signal.profitPercent}%
            </div>
            <div className="text-[10px] sm:text-xs text-foreground/55 mt-0.5">
              Estimated Maximum Profit
            </div>
          </div>
        )}

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
              data-ocid="highprofit.secondary_button"
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

export default function HighProfitSection({
  signals,
  onSelectSignal,
  onTrack,
  trackedIds,
}: Props) {
  const [isListOpen, setIsListOpen] = useState(false);

  const sorted = [...signals]
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .slice(0, 9);

  return (
    <section
      id="highprofit"
      className="relative py-4 px-3 sm:px-4 md:px-6 overflow-hidden"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% 50%, oklch(75% 0.15 60 / 0.04) 0%, transparent 70%)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/15 to-transparent" />

      <div className="max-w-6xl mx-auto">
        {/* Static Header */}
        <div className="w-full py-6 sm:py-8 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/5 mb-3 sm:mb-4">
            <Award className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-mono text-gold tracking-widest">
              TOP OPPORTUNITIES
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground text-center">
            High <span className="gold-gradient">Profit</span> Signals
          </h2>
          <p className="text-foreground/65 max-w-lg mt-2 sm:mt-3 text-sm md:text-base text-center">
            Swipe to browse. Tap any card for full analysis.
          </p>
          <span className="text-xs font-mono text-foreground/50 mt-2">
            {sorted.length} high-profit signal{sorted.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Always-visible Content */}
        <div className="pb-8 sm:pb-12">
          <div className="flex flex-col lg:flex-row gap-8 sm:gap-12 items-start">
            {/* Left: carousel */}
            <div className="flex-1 w-full">
              {sorted.length === 0 ? (
                <div
                  className="w-full flex flex-col items-center justify-center rounded-2xl border border-border gap-4 py-12 sm:py-16"
                  style={{
                    background: "#ffffff",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                  data-ocid="highprofit.empty_state"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                    <Award className="w-7 h-7 sm:w-8 sm:h-8 text-gold" />
                  </div>
                  <div className="text-center">
                    <div className="font-display text-base sm:text-lg mb-1 text-foreground">
                      No High-Profit Signals
                    </div>
                    <div className="text-sm text-foreground/60">
                      Rescan to find opportunities
                    </div>
                  </div>
                </div>
              ) : (
                <SignalCarousel
                  signals={sorted}
                  onSelectSignal={onSelectSignal}
                  renderCard={(signal, index) => (
                    <HighProfitCard
                      signal={signal}
                      index={index}
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
                data-ocid="highprofit.list.toggle"
                onClick={() => setIsListOpen((v) => !v)}
                className="w-full flex items-center justify-between text-xs font-mono text-foreground/55 uppercase tracking-wider mb-4 cursor-pointer hover:text-foreground/80 transition-colors rounded-lg px-2 py-2 hover:bg-black/5 min-h-[44px]"
              >
                <span>All High Profit Signals ({sorted.length})</span>
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
                    key="highprofit-list"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    {sorted.map((signal, idx) => {
                      const ib = signal.direction === "long";
                      return (
                        <motion.button
                          key={signal.id}
                          initial={{ opacity: 0, x: 20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => onSelectSignal(signal)}
                          data-ocid={`highprofit.item.${idx + 1}`}
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
                              background:
                                idx === 0
                                  ? "linear-gradient(135deg, oklch(52% 0.15 60), oklch(44% 0.12 55))"
                                  : ib
                                    ? "oklch(62% 0.18 145)"
                                    : "oklch(60% 0.18 25)",
                            }}
                          >
                            {signal.symbol.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="text-sm font-semibold truncate text-foreground">
                                {signal.coinName}
                              </div>
                              {idx === 0 && (
                                <span className="text-[10px] font-mono font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded shrink-0">
                                  MAX
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-mono text-foreground/55">
                              {signal.symbol}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-mono font-bold text-gold">
                              +{signal.profitPercent}%
                            </div>
                            <div className="text-xs font-mono text-foreground/50">
                              {signal.confidence}% conf
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-foreground/35 group-hover:text-gold/60 transition-colors flex-shrink-0" />
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-8 sm:mt-10 text-center text-xs font-mono text-foreground/50"
          >
            Signals ranked by maximum return potential · Updated every 30s
          </motion.div>
        </div>
      </div>
    </section>
  );
}
