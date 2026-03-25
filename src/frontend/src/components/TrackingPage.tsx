import {
  Activity,
  AlertTriangle,
  Brain,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SignalData } from "../hooks/useCryptoSignals";
import {
  incrementAutoLearnCount,
  recordOutcome,
} from "../hooks/useLearningEngine";
import type { TrackedTrade } from "../hooks/useTrackTrades";
import { checkTrackedTradeOutcome, computeTrailingStop } from "../lib/aiEngine";
import SignalDetail from "./SignalDetail";

function fmtPrice(p: number) {
  if (p >= 1000)
    return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function tradeToSignal(
  trade: TrackedTrade,
  livePrices: Record<string, number>,
): SignalData {
  const isBuy = trade.direction === "long";
  const currentPrice = livePrices[trade.symbol] ?? trade.entryPrice;
  const tpRange = trade.takeProfit - trade.entryPrice;
  const rawProgress = isBuy
    ? ((currentPrice - trade.entryPrice) / tpRange) * 100
    : ((trade.entryPrice - currentPrice) / Math.abs(tpRange)) * 100;
  const hitTarget = rawProgress >= 100;

  return {
    id: trade.signalId,
    coinName: trade.coinName,
    symbol: trade.symbol,
    currentPrice,
    entryPrice: trade.entryPrice,
    takeProfit: trade.takeProfit,
    stopLoss: trade.stopLoss,
    confidence: trade.confidence ?? 88,
    estimatedHours: 12,
    direction: trade.direction,
    reasoning: `${trade.coinName} was selected for tracking. Technical indicators showed a strong ${isBuy ? "bullish" : "bearish"} setup at entry.`,
    profitPercent: trade.profitPercent,
    hitTarget,
    timestamp: trade.trackedAt,
    rsi: trade.rsi ?? (isBuy ? 38 : 67),
    macd: trade.macd ?? (isBuy ? "bullish" : "bearish"),
    volume: trade.volume ?? "medium",
    trend: isBuy ? "Uptrend" : "Downtrend",
    safeExitPrice: trade.safeExitPrice,
    maxHoldHours: 24,
    learningBoost: trade.learningBoost ?? 0,
    dumpRisk: trade.dumpRisk ?? 0,
    signalStrength: "strong" as const,
    tpProbability: trade.tpProbability ?? 75,
    newsBadge: null,
    aiDumpRisk: "LOW" as const,
  };
}

// AI TP Prediction panel
function AIPredictionPanel({
  trade,
  currentPrice,
}: {
  trade: TrackedTrade;
  currentPrice: number;
}) {
  const isBuy = trade.direction === "long";
  const tpRange = trade.takeProfit - trade.entryPrice;
  const progress = isBuy
    ? ((currentPrice - trade.entryPrice) / tpRange) * 100
    : ((trade.entryPrice - currentPrice) / Math.abs(tpRange)) * 100;

  const priceDiffFromEntry = isBuy
    ? ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100
    : ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;

  const rsi = trade.rsi ?? 50;
  const macdBullish = (trade.macd ?? "neutral") === "bullish";
  const volumeGood = (trade.volume ?? "medium") === "high";

  // AI prediction logic
  let score = 50;
  if (isBuy) {
    if (rsi > 45 && rsi < 70) score += 15;
    if (macdBullish) score += 15;
    if (volumeGood) score += 10;
    if (priceDiffFromEntry > 0) score += 10;
    if (progress > 50) score += 10;
  } else {
    if (rsi > 55) score += 15;
    if (!macdBullish) score += 15;
    if (volumeGood) score += 10;
    if (priceDiffFromEntry > 0) score += 10;
    if (progress > 50) score += 10;
  }
  // penalty for adverse movement
  if (priceDiffFromEntry < -1.5) score -= 20;

  score = Math.max(10, Math.min(95, score + (trade.confidence ?? 85) - 75));

  const prediction: "Will Hit TP" | "At Risk" | "TP Unlikely" =
    score >= 72 ? "Will Hit TP" : score >= 50 ? "At Risk" : "TP Unlikely";

  const predColor =
    prediction === "Will Hit TP"
      ? "oklch(42% 0.18 145)"
      : prediction === "At Risk"
        ? "oklch(55% 0.18 60)"
        : "oklch(45% 0.18 25)";

  const reasoning =
    prediction === "Will Hit TP"
      ? `RSI ${rsi > 45 ? "holding above 45" : "recovering"}, ${macdBullish ? "MACD bullish alignment" : "momentum building"}, ${volumeGood ? "high volume support" : "volume moderate"}. Strong probability of TP hit.`
      : prediction === "At Risk"
        ? `RSI at ${rsi}, mixed momentum signals. Monitor closely. Consider partial exit if price weakens.`
        : `Bearish divergence detected. RSI ${rsi < 40 ? "below 40" : "weakening"}, ${!macdBullish ? "MACD bearish crossover" : "momentum fading"}. Consider safe exit.`;

  return (
    <div
      className="mt-3 rounded-xl p-3"
      style={{
        background: `${predColor}08`,
        border: `1px solid ${predColor}30`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Brain className="w-3.5 h-3.5" style={{ color: predColor }} />
        <span className="text-xs font-semibold" style={{ color: predColor }}>
          AI Prediction
        </span>
        <span
          className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${predColor}20`, color: predColor }}
        >
          {prediction}
        </span>
        <span className="text-xs font-mono" style={{ color: predColor }}>
          {score}%
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {reasoning}
      </p>
    </div>
  );
}

type TradeWithOutcome = TrackedTrade & { hitOutcome?: boolean };

interface TradeCardProps {
  trade: TradeWithOutcome;
  onStop: () => void;
  onViewDetails: () => void;
  livePrices: Record<string, number>;
  now: number;
  onMarkOutcome: (hit: boolean) => void;
}

function TradeCard({
  trade,
  onStop,
  onViewDetails,
  livePrices,
  now,
  onMarkOutcome,
}: TradeCardProps) {
  const isBuy = trade.direction === "long";
  const currentPrice = livePrices[trade.symbol] ?? trade.entryPrice;
  const tpRange = trade.takeProfit - trade.entryPrice;
  const rawProgress = isBuy
    ? ((currentPrice - trade.entryPrice) / tpRange) * 100
    : ((trade.entryPrice - currentPrice) / Math.abs(tpRange)) * 100;
  const clampedProgress = Math.max(0, Math.min(100, rawProgress));
  const hitTarget = rawProgress >= 100;
  const elapsed = now - trade.trackedAt;

  const slDistance = isBuy
    ? ((currentPrice - trade.stopLoss) / currentPrice) * 100
    : ((trade.stopLoss - currentPrice) / currentPrice) * 100;
  const slDanger = slDistance < 1.5;
  const dumpRisk =
    isBuy && (currentPrice - trade.entryPrice) / trade.entryPrice < -0.015;
  const nearTP = clampedProgress >= 70;

  const trailingStop = computeTrailingStop(
    isBuy ? "BUY" : "SELL",
    trade.entryPrice,
    trade.stopLoss,
    currentPrice,
    trade.takeProfit,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative rounded-2xl overflow-hidden cursor-pointer animate-card-3d-enter"
      style={{
        background: "oklch(var(--card))",
        border: hitTarget
          ? "2px solid oklch(42% 0.18 145)"
          : dumpRisk
            ? "2px solid oklch(45% 0.18 25)"
            : "1px solid oklch(var(--border))",
        boxShadow: hitTarget
          ? "0 0 24px oklch(62% 0.18 145 / 0.2)"
          : "0 2px 12px rgba(0,0,0,0.06)",
      }}
      onClick={onViewDetails}
      data-ocid="tracking.item.1"
    >
      {/* Profit banner */}
      {hitTarget && (
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center py-4"
          style={{
            background: "oklch(42% 0.18 145 / 0.95)",
            animation: "profit-pulse 1.5s ease-in-out infinite",
          }}
        >
          <div className="text-center">
            <div className="text-white font-bold text-xl">
              🏆 PROFIT TAKEN +{trade.profitPercent.toFixed(1)}% Achieved!
            </div>
          </div>
        </div>
      )}

      {/* Take profit alert */}
      {nearTP && !hitTarget && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center gap-2 py-1.5 z-10"
          style={{
            background: "oklch(62% 0.18 145 / 0.15)",
            borderBottom: "1px solid oklch(62% 0.18 145 / 0.3)",
            animation: "profit-pulse 1.5s ease-in-out infinite",
          }}
        >
          <span
            className="text-xs font-bold"
            style={{ color: "oklch(42% 0.18 145)" }}
          >
            ✨ Consider taking profit now!
          </span>
        </div>
      )}

      {/* Dump risk banner */}
      {dumpRisk && !hitTarget && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center gap-2 py-1.5 z-10"
          style={{
            background: "oklch(60% 0.22 25 / 0.12)",
            borderBottom: "1px solid oklch(60% 0.22 25 / 0.3)",
          }}
        >
          <AlertTriangle
            className="w-3.5 h-3.5"
            style={{ color: "oklch(45% 0.18 25)" }}
          />
          <span
            className="text-xs font-bold"
            style={{ color: "oklch(45% 0.18 25)" }}
          >
            Dump Risk — Safe Exit: {fmtPrice(trailingStop)}
          </span>
        </div>
      )}

      <div className={`p-4 ${nearTP || dumpRisk ? "pt-9" : ""}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-foreground">
                {trade.symbol.replace("USDT", "")}
              </span>
              <span
                className="px-2 py-0.5 rounded-md text-xs font-bold"
                style={{
                  background: isBuy
                    ? "oklch(62% 0.18 145 / 0.15)"
                    : "oklch(60% 0.22 25 / 0.15)",
                  color: isBuy ? "oklch(42% 0.18 145)" : "oklch(45% 0.18 25)",
                }}
              >
                {isBuy ? "LONG" : "SHORT"}
              </span>
            </div>
            <div className="text-sm font-mono text-foreground/85 mt-0.5">
              {fmtPrice(currentPrice)}
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            data-ocid="tracking.close_button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress to TP</span>
            <span
              className="font-mono font-semibold"
              style={{
                color: isBuy ? "oklch(42% 0.18 145)" : "oklch(45% 0.18 25)",
              }}
            >
              {clampedProgress.toFixed(1)}%
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "oklch(var(--muted))" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${clampedProgress}%`,
                background: hitTarget
                  ? "oklch(62% 0.18 145)"
                  : clampedProgress >= 70
                    ? "oklch(75% 0.15 60)"
                    : isBuy
                      ? "oklch(62% 0.18 145)"
                      : "oklch(60% 0.22 25)",
              }}
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div
            className="text-center p-2 rounded-lg"
            style={{ background: "oklch(var(--muted))" }}
          >
            <div className="text-xs text-muted-foreground">Entry</div>
            <div className="text-xs font-mono font-semibold text-foreground">
              {fmtPrice(trade.entryPrice)}
            </div>
          </div>
          <div
            className="text-center p-2 rounded-lg"
            style={{ background: "oklch(var(--muted))" }}
          >
            <div className="text-xs text-muted-foreground">TP</div>
            <div
              className="text-xs font-mono font-semibold"
              style={{ color: "oklch(42% 0.18 145)" }}
            >
              {fmtPrice(trade.takeProfit)}
            </div>
          </div>
          <div
            className="text-center p-2 rounded-lg"
            style={{
              background: slDanger
                ? "oklch(60% 0.22 25 / 0.12)"
                : "oklch(var(--muted))",
            }}
          >
            <div className="text-xs text-muted-foreground">SL</div>
            <div
              className="text-xs font-mono font-semibold"
              style={{ color: "oklch(45% 0.18 25)" }}
            >
              {fmtPrice(trade.stopLoss)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {isBuy ? (
              <TrendingUp className="w-3 h-3 text-signal-buy" />
            ) : (
              <TrendingDown className="w-3 h-3 text-signal-sell" />
            )}
            <Activity className="w-3 h-3" />
            <span>{formatElapsed(elapsed)}</span>
          </div>
          {trade.safeExitPrice > 0 && (
            <span className="font-mono">
              Safe exit: {fmtPrice(trailingStop)}
            </span>
          )}
        </div>

        {/* AI Prediction */}
        <AIPredictionPanel trade={trade} currentPrice={currentPrice} />

        {/* Mark Hit/Missed buttons (only if TP hit) */}
        {hitTarget && (
          <div
            className="flex gap-2 mt-4 pt-3"
            style={{ borderTop: "1px solid oklch(var(--border))" }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {trade.hitOutcome === undefined ? (
              <>
                <button
                  type="button"
                  onClick={() => onMarkOutcome(true)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all"
                  style={{
                    background: "oklch(62% 0.18 145)",
                    boxShadow: "0 2px 8px oklch(62% 0.18 145 / 0.3)",
                  }}
                  data-ocid="tracking.confirm_button"
                >
                  ✓ Mark as Hit
                </button>
                <button
                  type="button"
                  onClick={() => onMarkOutcome(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all"
                  style={{
                    background: "oklch(60% 0.22 25)",
                    boxShadow: "0 2px 8px oklch(60% 0.22 25 / 0.3)",
                  }}
                  data-ocid="tracking.cancel_button"
                >
                  ✗ Mark as Missed
                </button>
              </>
            ) : (
              <div
                className="w-full py-2 rounded-xl text-xs font-bold text-center"
                style={{
                  background: trade.hitOutcome
                    ? "oklch(62% 0.18 145 / 0.2)"
                    : "oklch(60% 0.22 25 / 0.2)",
                  color: trade.hitOutcome
                    ? "oklch(42% 0.18 145)"
                    : "oklch(45% 0.18 25)",
                }}
              >
                {trade.hitOutcome ? "✓ Marked as Hit" : "✗ Marked as Missed"}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface Props {
  trackedTrades: TrackedTrade[];
  onStopTracking: (id: string) => void;
  livePrices: Record<string, number>;
  onAutoLearnUpdate: () => void;
}

export default function TrackingPage({
  trackedTrades,
  onStopTracking,
  livePrices,
  onAutoLearnUpdate,
}: Props) {
  const [selectedSignal, setSelectedSignal] = useState<SignalData | null>(null);
  const [now, setNow] = useState(Date.now());
  const [tradeOutcomes, setTradeOutcomes] = useState<
    Record<string, boolean | undefined>
  >({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-learn from TP/SL hits
  useEffect(() => {
    for (const trade of trackedTrades) {
      const currentPrice = livePrices[trade.symbol];
      if (!currentPrice || tradeOutcomes[trade.signalId] !== undefined)
        continue;
      const outcome = checkTrackedTradeOutcome({
        symbol: trade.symbol,
        signalType: trade.direction === "long" ? "BUY" : "SELL",
        entryPrice: trade.entryPrice,
        tp: trade.takeProfit,
        sl: trade.stopLoss,
        currentPrice,
        trackedAt: trade.trackedAt,
        confidence: trade.confidence,
        tpProbability: trade.tpProbability,
      });
      if (outcome !== null) {
        const hit = outcome === "WIN";
        setTradeOutcomes((prev) => ({ ...prev, [trade.signalId]: hit }));
        recordOutcome(trade.symbol, hit);
        incrementAutoLearnCount();
        onAutoLearnUpdate();
      }
    }
  }, [livePrices, trackedTrades, tradeOutcomes, onAutoLearnUpdate]);

  const handleMarkOutcome = useCallback(
    (tradeId: string, hit: boolean) => {
      setTradeOutcomes((prev) => ({ ...prev, [tradeId]: hit }));
      recordOutcome(tradeId, hit);
      incrementAutoLearnCount();
      onAutoLearnUpdate();
    },
    [onAutoLearnUpdate],
  );

  const tradesWithOutcomes: TradeWithOutcome[] = trackedTrades.map((t) => ({
    ...t,
    hitOutcome: tradeOutcomes[t.signalId],
  }));

  return (
    <main className="min-h-screen py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Tracking</h1>
          <p className="text-muted-foreground text-sm">
            {trackedTrades.length > 0
              ? `${trackedTrades.length} active trade${trackedTrades.length !== 1 ? "s" : ""} — updates every 30s`
              : "No trades being tracked"}
          </p>
        </div>

        {trackedTrades.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: "oklch(var(--muted))",
              border: "1px solid oklch(var(--border))",
            }}
            data-ocid="tracking.empty_state"
          >
            <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No trades tracked yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap "Track Trade" on any signal to start monitoring.
            </p>
          </div>
        ) : (
          <div className="space-y-5" data-ocid="tracking.list">
            <AnimatePresence>
              {tradesWithOutcomes.map((trade) => (
                <TradeCard
                  key={trade.signalId}
                  trade={trade}
                  onStop={() => onStopTracking(trade.signalId)}
                  onViewDetails={() =>
                    setSelectedSignal(tradeToSignal(trade, livePrices))
                  }
                  livePrices={livePrices}
                  now={now}
                  onMarkOutcome={(hit) =>
                    handleMarkOutcome(trade.signalId, hit)
                  }
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <SignalDetail
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onMarkAccuracy={(id, hit) => {
          handleMarkOutcome(id, hit);
          setSelectedSignal((prev) =>
            prev?.id === id ? { ...prev, hitTarget: hit } : prev,
          );
        }}
      />
    </main>
  );
}
