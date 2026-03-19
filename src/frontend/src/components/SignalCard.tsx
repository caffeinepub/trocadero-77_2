import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronRight,
  Clock,
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

function TPProbabilityBadge({ value }: { value: number }) {
  const color =
    value >= 85
      ? "bg-green-100 text-green-700 border-green-300"
      : value >= 72
        ? "bg-yellow-100 text-yellow-700 border-yellow-300"
        : "bg-red-100 text-red-700 border-red-300";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${color}`}
    >
      TP: {value}%
    </span>
  );
}

function NewsBadge({
  badge,
}: {
  badge: "positive" | "negative" | "trending" | null | undefined;
}) {
  if (!badge) return null;
  if (badge === "positive")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-green-50 text-green-700 border border-green-200">
        📰+
      </span>
    );
  if (badge === "negative")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-50 text-red-700 border border-red-200">
        📰−
      </span>
    );
  if (badge === "trending")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
        🔥 Trending
      </span>
    );
  return null;
}

function DumpRiskDot({
  risk,
}: {
  risk: "LOW" | "MEDIUM" | "HIGH" | undefined;
}) {
  if (!risk || risk === "LOW") return null;
  const color =
    risk === "HIGH"
      ? "bg-red-500 text-red-700 border-red-300 bg-red-50"
      : "bg-yellow-500 text-yellow-700 border-yellow-300 bg-yellow-50";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${color}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${risk === "HIGH" ? "bg-red-500" : "bg-yellow-500"}`}
      />
      {risk === "HIGH" ? "Dump Risk" : "Caution"}
    </span>
  );
}

function ActiveSignalCard({
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
      data-ocid="signal.card"
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

        {/* AI badges row */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {signal.tpProbability != null && (
            <TPProbabilityBadge value={signal.tpProbability} />
          )}
          <NewsBadge badge={signal.newsBadge} />
          <DumpRiskDot risk={signal.aiDumpRisk} />
        </div>

        <div className="mt-1 mb-2">
          <SignalStrengthMeter strength={signal.signalStrength ?? "strong"} />
        </div>

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
                className={`text-xs sm:text-sm font-mono font-bold truncate ${
                  item.hi ? "text-gold" : "text-foreground"
                }`}
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
              data-ocid="signal.secondary_button"
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
  onSelectSignal: (s: SignalData) => void;
  lastScanTime: Date | null;
  onTrack: (s: SignalData) => void;
  trackedIds: Set<string>;
  isLoading?: boolean;
}

export default function SignalCardSection({
  signals,
  onSelectSignal,
  lastScanTime,
  onTrack,
  trackedIds,
  isLoading,
}: Props) {
  const [isListOpen, setIsListOpen] = useState(false);

  return (
    <section
      id="signals"
      className="relative px-3 sm:px-4 md:px-6 py-4 max-w-6xl mx-auto"
    >
      {/* Static Header */}
      <div className="w-full py-4 sm:py-6 px-2 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/5 mb-3 sm:mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
          <span className="text-xs font-mono text-gold tracking-widest">
            LIVE SIGNALS
          </span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground text-center">
          Active Signals
        </h2>
        {lastScanTime && (
          <p className="text-xs font-mono text-foreground/50 mt-2">
            Updated {lastScanTime.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Carousel or Loading */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-border"
          style={{ background: "#ffffff" }}
          data-ocid="signals.empty_state"
        >
          <div className="text-4xl mb-4">🔍</div>
          <div className="font-display text-xl mb-2 text-foreground">
            No signals found
          </div>
          <div className="text-sm text-foreground/55 text-center max-w-xs">
            The AI engine is filtering for only the highest-quality setups.
            Check back after the next scan.
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 hidden">
            <button
              type="button"
              className="flex items-center gap-2 text-sm font-mono text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setIsListOpen((v) => !v)}
            >
              {isListOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              {signals.length} signals (
              {signals.filter((s) => s.direction === "long").length} long,{" "}
              {signals.filter((s) => s.direction === "short").length} short)
            </button>
          </div>
          <SignalCarousel
            signals={signals}
            onSelectSignal={onSelectSignal}
            renderCard={(signal) => (
              <ActiveSignalCard
                signal={signal}
                onClick={() => onSelectSignal(signal)}
                onTrack={onTrack}
                isTracked={trackedIds.has(signal.id)}
              />
            )}
          />
        </>
      )}
    </section>
  );
}
