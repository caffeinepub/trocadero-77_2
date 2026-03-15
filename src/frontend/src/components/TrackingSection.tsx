import { ChevronDown, TrendingDown, TrendingUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { TrackedTrade } from "../hooks/useTrackTrades";

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
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface TradeCardProps {
  trade: TrackedTrade;
  onStop: () => void;
  livePrices: Record<string, number>;
  now: number;
}

function TradeTrackCard({ trade, onStop, livePrices, now }: TradeCardProps) {
  const isBuy = trade.direction === "long";
  const currentPrice = livePrices[trade.symbol] ?? trade.entryPrice;
  const elapsed = now - trade.trackedAt;

  // Progress toward TP
  const tpRange = trade.takeProfit - trade.entryPrice;
  const rawProgress = isBuy
    ? ((currentPrice - trade.entryPrice) / tpRange) * 100
    : ((trade.entryPrice - currentPrice) / Math.abs(tpRange)) * 100;
  const progress = Math.max(0, Math.min(100, rawProgress));
  const isWaiting = rawProgress < 0;

  // Price direction color
  const isInProfit = isBuy
    ? currentPrice >= trade.entryPrice
    : currentPrice <= trade.entryPrice;

  // SL proximity
  const slDistance = Math.abs(trade.entryPrice - trade.stopLoss);
  const currentToSL = Math.abs(currentPrice - trade.stopLoss);
  const slProximityPct =
    slDistance > 0 ? (currentToSL / slDistance) * 100 : 100;
  const slVeryClose = slProximityPct <= 10;
  const slNear = !slVeryClose && slProximityPct <= 20;

  const priceDiffPct =
    ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;

  return (
    <div
      className="rounded-2xl overflow-hidden w-full"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.15)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
      }}
      data-ocid="tracking.card"
    >
      <div
        className="h-1"
        style={{
          background: isBuy
            ? "linear-gradient(90deg, oklch(62% 0.18 145), oklch(52% 0.12 145 / 0.3))"
            : "linear-gradient(90deg, oklch(60% 0.18 25), oklch(50% 0.12 25 / 0.3))",
        }}
      />
      <div className="p-5">
        {/* Header row */}
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

        {/* SL warning badges */}
        {(slVeryClose || slNear) && (
          <div className="mb-3">
            {slVeryClose && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-xs font-mono font-bold text-red-600">
                ⚠ SL Very Close
              </div>
            )}
            {slNear && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-mono font-bold text-amber-600">
                SL Near
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
                isWaiting ? "text-foreground/50" : "text-signal-buy"
              }`}
            >
              {isWaiting ? "Waiting for entry" : `${progress.toFixed(0)}%`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-signal-buy transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Footer: time + SL + stop button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-foreground/55">
              ⏱ {formatElapsed(elapsed)}
            </span>
            <span className="text-xs font-mono text-foreground/45">
              SL: {fmtPrice(trade.stopLoss)}
            </span>
          </div>
          <button
            type="button"
            onClick={onStop}
            data-ocid="tracking.stop_button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
          >
            <X className="w-3 h-3" />
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  trackedTrades: TrackedTrade[];
  onStopTracking: (signalId: string) => void;
  livePrices: Record<string, number>;
}

export default function TrackingSection({
  trackedTrades,
  onStopTracking,
  livePrices,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      className="px-4 sm:px-6 py-4 max-w-6xl mx-auto"
      data-ocid="tracking.section"
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex flex-wrap items-center gap-4 py-6 px-2 rounded-2xl cursor-pointer hover:bg-black/[0.02] transition-colors group"
        data-ocid="tracking.toggle"
      >
        <h2 className="text-2xl font-display font-bold text-foreground">
          📊 Trade Tracker
        </h2>
        {trackedTrades.length > 0 && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-signal-buy text-white text-xs font-bold">
            {trackedTrades.length}
          </span>
        )}
        {trackedTrades.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal-buy opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal-buy" />
            </span>
            <span className="text-xs font-mono text-signal-buy">
              Live tracking
            </span>
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="ml-auto text-foreground/40 group-hover:text-foreground/60 transition-colors"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="tracking-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="pb-10">
              {trackedTrades.length === 0 ? (
                <div
                  className="w-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border gap-4 py-16"
                  style={{ background: "#ffffff" }}
                  data-ocid="tracking.empty_state"
                >
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">
                    📊
                  </div>
                  <div className="text-center">
                    <div className="font-display text-lg mb-1 text-foreground">
                      No trades being tracked
                    </div>
                    <div className="text-sm text-foreground/60">
                      Tap &ldquo;Track&rdquo; on any signal card to start
                      tracking.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trackedTrades.map((trade) => (
                    <TradeTrackCard
                      key={trade.signalId}
                      trade={trade}
                      onStop={() => onStopTracking(trade.signalId)}
                      livePrices={livePrices}
                      now={now}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
