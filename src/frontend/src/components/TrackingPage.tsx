import { Activity, TrendingDown, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { SignalData } from "../hooks/useCryptoSignals";
import {
  incrementAutoLearnCount,
  recordOutcome,
} from "../hooks/useLearningEngine";
import type { TrackedTrade } from "../hooks/useTrackTrades";
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
    confidence: 88,
    estimatedHours: 12,
    direction: trade.direction,
    reasoning: `${trade.coinName} was selected for tracking. Technical indicators showed a strong ${
      isBuy ? "bullish" : "bearish"
    } setup at entry. Monitor live price against your take profit and stop loss levels.`,
    profitPercent: trade.profitPercent,
    hitTarget,
    timestamp: trade.trackedAt,
    rsi: isBuy ? 38 : 67,
    macd: isBuy ? "bullish" : "bearish",
    volume: "medium",
    trend: isBuy ? "Uptrend" : "Downtrend",
    safeExitPrice: trade.safeExitPrice,
    maxHoldHours: 24,
    learningBoost: 0,
  };
}

interface TradeCardProps {
  trade: TrackedTrade;
  onStop: () => void;
  onViewDetails: () => void;
  livePrices: Record<string, number>;
  now: number;
}

function TradeTrackCard({
  trade,
  onStop,
  onViewDetails,
  livePrices,
  now,
}: TradeCardProps) {
  const isBuy = trade.direction === "long";
  const currentPrice = livePrices[trade.symbol] ?? trade.entryPrice;
  const elapsed = now - trade.trackedAt;

  const tpRange = trade.takeProfit - trade.entryPrice;
  const rawProgress = isBuy
    ? ((currentPrice - trade.entryPrice) / tpRange) * 100
    : ((trade.entryPrice - currentPrice) / Math.abs(tpRange)) * 100;
  const progress = Math.max(0, Math.min(100, rawProgress));
  const isWaiting = rawProgress < 0;
  const hitTP = progress >= 100;

  const isInProfit = isBuy
    ? currentPrice >= trade.entryPrice
    : currentPrice <= trade.entryPrice;

  const slDistance = Math.abs(trade.entryPrice - trade.stopLoss);
  const currentToSL = Math.abs(currentPrice - trade.stopLoss);
  const slProximityPct =
    slDistance > 0 ? (currentToSL / slDistance) * 100 : 100;
  const slVeryClose = slProximityPct <= 10;
  const slNear = !slVeryClose && slProximityPct <= 20;
  const aiEarlyExitWarning = !slVeryClose && !slNear && slProximityPct <= 25;

  const priceDiffPct =
    ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-2xl overflow-hidden w-full cursor-pointer"
      style={{
        background: "#ffffff",
        border: hitTP
          ? "1.5px solid oklch(62% 0.18 145)"
          : "1px solid rgba(0,0,0,0.14)",
        boxShadow: hitTP
          ? "0 8px 32px rgba(0,180,80,0.12)"
          : "0 6px 20px rgba(0,0,0,0.08)",
      }}
      onClick={onViewDetails}
      data-ocid="tracking.card"
    >
      {/* Top bar */}
      <div
        className="h-1.5"
        style={{
          background: isBuy
            ? `linear-gradient(90deg, oklch(62% 0.18 145) ${progress}%, oklch(62% 0.18 145 / 0.2) ${progress}%)`
            : `linear-gradient(90deg, oklch(60% 0.18 25) ${progress}%, oklch(60% 0.18 25 / 0.2) ${progress}%)`,
        }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold font-display text-white flex-shrink-0"
              style={{
                background: isBuy
                  ? "oklch(62% 0.18 145)"
                  : "oklch(60% 0.18 25)",
              }}
            >
              {trade.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="font-display font-bold text-base leading-tight text-foreground">
                {trade.coinName}
              </div>
              <div className="text-xs font-mono text-foreground/60">
                {trade.symbol}/USDT
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                isBuy
                  ? "bg-signal-buy/15 text-signal-buy border border-signal-buy/25"
                  : "bg-signal-sell/15 text-signal-sell border border-signal-sell/25"
              }`}
            >
              {isBuy ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {isBuy ? "LONG" : "SHORT"}
            </div>
          </div>
        </div>

        {/* TP Hit banner */}
        {hitTP && (
          <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-signal-buy/10 border border-signal-buy/25">
            <span className="text-signal-buy font-bold text-sm">
              🎯 Take Profit Hit!
            </span>
          </div>
        )}

        {/* SL warning hierarchy */}
        {(slVeryClose || slNear || aiEarlyExitWarning) && !hitTP && (
          <div className="mb-3 flex flex-col gap-1.5">
            {slVeryClose && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs font-mono font-bold text-red-600">
                ⚠ SL Very Close — Consider Exiting
              </div>
            )}
            {slNear && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-mono font-bold text-amber-600">
                SL Near — Watch Closely
              </div>
            )}
            {aiEarlyExitWarning && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold"
                style={{
                  background: "oklch(96% 0.02 290)",
                  border: "1px solid oklch(80% 0.08 290)",
                  color: "oklch(40% 0.18 290)",
                }}
              >
                🤖 AI: Consider early exit to protect capital
              </div>
            )}
          </div>
        )}

        {/* Current vs Entry */}
        <div className="rounded-xl bg-muted/60 p-3 mb-3">
          <div className="text-[10px] font-mono text-foreground/50 uppercase tracking-wider mb-2">
            Price vs Entry
          </div>
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div
                className={`text-base font-mono font-bold ${
                  isInProfit ? "text-signal-buy" : "text-signal-sell"
                }`}
              >
                {fmtPrice(currentPrice)}
              </div>
              <div className="text-[10px] text-foreground/50">Current</div>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`text-sm font-mono font-bold ${
                  isInProfit ? "text-signal-buy" : "text-signal-sell"
                }`}
              >
                {isInProfit ? "▲" : "▼"} {Math.abs(priceDiffPct).toFixed(2)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-base font-mono font-bold text-foreground">
                {fmtPrice(trade.entryPrice)}
              </div>
              <div className="text-[10px] text-foreground/50">Entry</div>
            </div>
          </div>
        </div>

        {/* TP Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] font-mono text-foreground/55 mb-1.5">
            <span>Progress to TP ({fmtPrice(trade.takeProfit)})</span>
            <span
              className={`font-bold ${
                hitTP
                  ? "text-signal-buy"
                  : isWaiting
                    ? "text-foreground/50"
                    : "text-signal-buy"
              }`}
            >
              {hitTP
                ? "✓ DONE"
                : isWaiting
                  ? "Waiting for entry"
                  : `${progress.toFixed(0)}%`}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-signal-buy"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Key levels */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="text-[10px] font-mono text-foreground/45 mb-0.5">
              Stop Loss
            </div>
            <div className="text-sm font-mono font-bold text-signal-sell">
              {fmtPrice(trade.stopLoss)}
            </div>
          </div>
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="text-[10px] font-mono text-foreground/45 mb-0.5">
              Safe Exit
            </div>
            <div className="text-sm font-mono font-bold text-foreground/80">
              {fmtPrice(trade.safeExitPrice)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-foreground/55">
              ⏱ {formatElapsed(elapsed)}
            </span>
            <span className="text-xs font-mono font-bold text-foreground/70">
              +{trade.profitPercent.toFixed(1)}% target
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStop();
            }}
            data-ocid="tracking.stop_button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <X className="w-3 h-3" />
            Stop
          </button>
        </div>
      </div>
    </motion.div>
  );
}

interface Props {
  trackedTrades: TrackedTrade[];
  onStopTracking: (signalId: string) => void;
  livePrices: Record<string, number>;
  onAutoLearnUpdate?: () => void;
}

export default function TrackingPage({
  trackedTrades,
  onStopTracking,
  livePrices,
  onAutoLearnUpdate,
}: Props) {
  const [now, setNow] = useState(Date.now());
  const [detailSignal, setDetailSignal] = useState<SignalData | null>(null);
  // Track which signalIds have already been auto-recorded to avoid duplicates
  const autoRecordedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-outcome recording when price crosses TP or SL
  useEffect(() => {
    for (const trade of trackedTrades) {
      if (autoRecordedRef.current.has(trade.signalId)) continue;

      const currentPrice = livePrices[trade.symbol] ?? trade.entryPrice;
      const isBuy = trade.direction === "long";
      const tpRange = trade.takeProfit - trade.entryPrice;
      const rawProgress = isBuy
        ? ((currentPrice - trade.entryPrice) / tpRange) * 100
        : ((trade.entryPrice - currentPrice) / Math.abs(tpRange)) * 100;

      const hitTP = rawProgress >= 100;
      const hitSL = isBuy
        ? currentPrice <= trade.stopLoss
        : currentPrice >= trade.stopLoss;

      if (hitTP) {
        autoRecordedRef.current.add(trade.signalId);
        recordOutcome(trade.symbol, true);
        incrementAutoLearnCount();
        onAutoLearnUpdate?.();
      } else if (hitSL) {
        autoRecordedRef.current.add(trade.signalId);
        recordOutcome(trade.symbol, false);
        incrementAutoLearnCount();
        onAutoLearnUpdate?.();
      }
    }
  }, [trackedTrades, livePrices, onAutoLearnUpdate]);

  const active = trackedTrades.filter((t) => {
    const cp = livePrices[t.symbol] ?? t.entryPrice;
    const tpRange = t.takeProfit - t.entryPrice;
    const prog =
      t.direction === "long"
        ? ((cp - t.entryPrice) / tpRange) * 100
        : ((t.entryPrice - cp) / Math.abs(tpRange)) * 100;
    return prog < 100;
  });

  const completed = trackedTrades.filter((t) => {
    const cp = livePrices[t.symbol] ?? t.entryPrice;
    const tpRange = t.takeProfit - t.entryPrice;
    const prog =
      t.direction === "long"
        ? ((cp - t.entryPrice) / tpRange) * 100
        : ((t.entryPrice - cp) / Math.abs(tpRange)) * 100;
    return prog >= 100;
  });

  return (
    <div
      className="min-h-screen pt-28 pb-20 px-4 sm:px-6 max-w-6xl mx-auto"
      data-ocid="tracking.page"
    >
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Activity className="w-5 h-5 text-gold" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Trade Tracker
          </h1>
          {trackedTrades.length > 0 && (
            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-signal-buy/10 border border-signal-buy/30 text-signal-buy text-xs font-bold font-mono">
              {trackedTrades.length} active
            </span>
          )}
        </div>
        <p className="text-sm text-foreground/60 font-mono">
          Manually track trades you&apos;ve entered. Live price updates every
          second. Tap any card to open full trade details.
        </p>
      </div>

      {trackedTrades.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-32 rounded-2xl border border-dashed border-border"
          style={{ background: "#ffffff" }}
          data-ocid="tracking.empty_state"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-4xl mb-5">
            📊
          </div>
          <div className="font-display text-xl mb-2 text-foreground">
            No trades being tracked
          </div>
          <div className="text-sm text-foreground/55 text-center max-w-xs">
            Go to the Signals page, find a trade you like, and tap &ldquo;Track
            Trade&rdquo; to add it here.
          </div>
        </motion.div>
      ) : (
        <div className="space-y-10">
          {/* Active Trades */}
          {active.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-buy opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-signal-buy" />
                </span>
                <h2 className="text-lg font-display font-bold text-foreground">
                  In Progress
                </h2>
                <span className="text-sm font-mono text-foreground/50">
                  ({active.length})
                </span>
              </div>
              <AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {active.map((trade) => (
                    <TradeTrackCard
                      key={trade.signalId}
                      trade={trade}
                      onStop={() => onStopTracking(trade.signalId)}
                      onViewDetails={() =>
                        setDetailSignal(tradeToSignal(trade, livePrices))
                      }
                      livePrices={livePrices}
                      now={now}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          )}

          {/* Completed Trades */}
          {completed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-signal-buy">🎯</span>
                <h2 className="text-lg font-display font-bold text-foreground">
                  Target Hit
                </h2>
                <span className="text-sm font-mono text-foreground/50">
                  ({completed.length})
                </span>
              </div>
              <AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completed.map((trade) => (
                    <TradeTrackCard
                      key={trade.signalId}
                      trade={trade}
                      onStop={() => onStopTracking(trade.signalId)}
                      onViewDetails={() =>
                        setDetailSignal(tradeToSignal(trade, livePrices))
                      }
                      livePrices={livePrices}
                      now={now}
                    />
                  ))}
                </div>
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <SignalDetail
        signal={detailSignal}
        onClose={() => setDetailSignal(null)}
        onMarkAccuracy={(_id, _hit) => setDetailSignal(null)}
      />
    </div>
  );
}
