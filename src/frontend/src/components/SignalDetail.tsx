import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  BarChart2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { SignalData } from "../hooks/useCryptoSignals";

function fmtPrice(p: number) {
  if (p >= 1000)
    return p.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (p < 0.01) return p.toFixed(6);
  if (p < 1) return p.toFixed(4);
  return p.toFixed(2);
}

interface Props {
  signal: SignalData | null;
  onClose: () => void;
  onMarkAccuracy: (id: string, hit: boolean) => void;
}

export default function SignalDetail({
  signal,
  onClose,
  onMarkAccuracy,
}: Props) {
  const [pricePulse, setPricePulse] = useState(false);
  const prevPriceRef = { current: 0 };

  useEffect(() => {
    if (!signal) return;
    if (
      prevPriceRef.current !== 0 &&
      prevPriceRef.current !== signal.currentPrice
    ) {
      setPricePulse(true);
      setTimeout(() => setPricePulse(false), 600);
    }
    prevPriceRef.current = signal.currentPrice;
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const isBuy = signal?.direction === "long";

  const indicators = signal
    ? [
        {
          icon: Activity,
          label: "RSI",
          value: signal.rsi.toString(),
          status:
            signal.rsi < 40
              ? "Oversold"
              : signal.rsi > 65
                ? "Overbought"
                : "Neutral",
          color:
            signal.rsi < 40
              ? "text-signal-buy"
              : signal.rsi > 65
                ? "text-signal-sell"
                : "text-gold",
        },
        {
          icon: BarChart2,
          label: "MACD",
          value: signal.macd.charAt(0).toUpperCase() + signal.macd.slice(1),
          status:
            signal.macd === "bullish"
              ? "Bullish Cross"
              : signal.macd === "bearish"
                ? "Bearish Cross"
                : "No Cross",
          color:
            signal.macd === "bullish"
              ? "text-signal-buy"
              : signal.macd === "bearish"
                ? "text-signal-sell"
                : "text-gold",
        },
        {
          icon: Volume2,
          label: "Volume",
          value: signal.volume.charAt(0).toUpperCase() + signal.volume.slice(1),
          status:
            signal.volume === "high"
              ? "Confirming"
              : signal.volume === "medium"
                ? "Average"
                : "Weak",
          color:
            signal.volume === "high"
              ? "text-signal-buy"
              : signal.volume === "low"
                ? "text-signal-sell"
                : "text-gold",
        },
      ]
    : [];

  return (
    <AnimatePresence>
      {signal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6"
          data-ocid="signal.modal"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 40 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full md:max-w-2xl max-h-[90vh] overflow-y-auto glass-card gold-border-glow rounded-t-2xl md:rounded-2xl"
          >
            {/* Header */}
            <div
              className={`relative px-6 pt-6 pb-4 border-b border-border ${isBuy ? "buy-glow" : "sell-glow"}`}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{
                  background: isBuy
                    ? "linear-gradient(90deg, oklch(62% 0.18 145), oklch(52% 0.12 145 / 0.3))"
                    : "linear-gradient(90deg, oklch(60% 0.18 25), oklch(50% 0.12 25 / 0.3))",
                }}
              />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold font-display text-white"
                    style={{
                      background: isBuy
                        ? "oklch(62% 0.18 145)"
                        : "oklch(60% 0.18 25)",
                    }}
                  >
                    {signal.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xl font-display font-bold">
                      {signal.coinName}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-mono text-foreground/80">
                        {signal.symbol}/USDT
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold ${isBuy ? "bg-signal-buy/20 text-signal-buy border-signal-buy/30" : "bg-signal-sell/20 text-signal-sell border-signal-sell/30"}`}
                      >
                        {isBuy ? "▲ LONG" : "▼ SHORT"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  data-ocid="signal.close_button"
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-foreground/70 hover:text-foreground hover:border-gold/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Live price */}
              <div className="rounded-xl border border-border bg-surface-2/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-foreground/70 uppercase tracking-wider">
                    Live Price
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
                    <span className="text-xs font-mono text-signal-buy">
                      Real-time
                    </span>
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <span
                    className={`text-3xl font-mono font-bold transition-colors duration-300 ${pricePulse ? "text-gold" : "text-foreground"}`}
                  >
                    ${fmtPrice(signal.currentPrice)}
                  </span>
                  <span
                    className={`text-sm font-mono ${isBuy ? "text-signal-buy" : "text-signal-sell"}`}
                  >
                    {(
                      ((signal.currentPrice - signal.entryPrice) /
                        signal.entryPrice) *
                      100
                    ).toFixed(2)}
                    % vs entry
                  </span>
                </div>
              </div>

              {/* Price levels */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Entry Price",
                    value: signal.entryPrice,
                    Icon: TrendingUp,
                    color: "text-gold",
                  },
                  {
                    label: "Take Profit",
                    value: signal.takeProfit,
                    Icon: Target,
                    color: "text-signal-buy",
                  },
                  {
                    label: "Stop Loss",
                    value: signal.stopLoss,
                    Icon: ShieldAlert,
                    color: "text-signal-sell",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-surface-2/50 border border-border p-3 text-center"
                  >
                    <item.Icon
                      className={`w-4 h-4 ${item.color} mx-auto mb-1.5`}
                    />
                    <div
                      className={`text-sm font-mono font-bold ${item.color}`}
                    >
                      ${fmtPrice(item.value)}
                    </div>
                    <div className="text-xs text-foreground/65 mt-0.5">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time + Profit */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-2/50 border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gold" />
                    <span className="text-xs font-mono text-foreground/70">
                      Time to TP
                    </span>
                  </div>
                  <div className="text-xl font-mono font-bold">
                    {signal.estimatedHours}h
                  </div>
                  <div className="text-xs text-foreground/65">
                    ~
                    {signal.estimatedHours < 24
                      ? `${signal.estimatedHours} hours`
                      : `${Math.floor(signal.estimatedHours / 24)}d ${signal.estimatedHours % 24}h`}
                  </div>
                </div>
                <div className="rounded-xl bg-surface-2/50 border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-gold" />
                    <span className="text-xs font-mono text-foreground/70">
                      Est. Profit
                    </span>
                  </div>
                  <div className="text-xl font-mono font-bold text-signal-buy">
                    +{signal.profitPercent}%
                  </div>
                  <div className="text-xs text-foreground/65">
                    Confidence: {signal.confidence}%
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="rounded-xl border border-gold/15 bg-gold/5 p-4">
                <div className="text-xs font-mono text-gold/70 uppercase tracking-wider mb-3">
                  Why This Signal
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {signal.reasoning}
                </p>
              </div>

              {/* Indicators */}
              <div>
                <div className="text-xs font-mono text-foreground/70 uppercase tracking-wider mb-3">
                  Technical Indicators
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {indicators.map((ind) => (
                    <div
                      key={ind.label}
                      className="rounded-xl bg-surface-2/50 border border-border p-3"
                    >
                      <ind.icon className={`w-4 h-4 ${ind.color} mb-2`} />
                      <div className="text-xs text-foreground/70 mb-0.5">
                        {ind.label}
                      </div>
                      <div
                        className={`text-sm font-mono font-bold ${ind.color}`}
                      >
                        {ind.value}
                      </div>
                      <div className="text-xs text-foreground/65">
                        {ind.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direction indicator */}
              <div className="rounded-xl border border-border bg-surface-2/50 p-4">
                <div className="text-xs font-mono text-foreground/70 uppercase tracking-wider mb-3">
                  Direction
                </div>
                <div
                  className={`flex items-center gap-2 ${isBuy ? "text-signal-buy" : "text-signal-sell"}`}
                >
                  {isBuy ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  <span className="font-bold text-lg">
                    {isBuy ? "LONG / BUY" : "SHORT / SELL"}
                  </span>
                </div>
                <p className="text-xs text-foreground/65 mt-2">
                  Trend: {signal.trend}
                </p>
              </div>

              {/* Accuracy */}
              <div className="rounded-xl border border-border bg-surface-2/50 p-4">
                <div className="text-xs font-mono text-foreground/70 uppercase tracking-wider mb-3">
                  Signal Accuracy
                </div>
                {signal.hitTarget ? (
                  <div className="flex items-center gap-2 text-signal-buy">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Target Hit ✓</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-foreground/70">
                      <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                      <span className="text-sm">
                        In Progress — monitoring...
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid="signal.confirm_button"
                        className="flex-1 border-signal-buy/30 text-signal-buy hover:bg-signal-buy/10"
                        onClick={() => onMarkAccuracy(signal.id, true)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Hit
                        Target
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-ocid="signal.cancel_button"
                        className="flex-1 border-signal-sell/30 text-signal-sell hover:bg-signal-sell/10"
                        onClick={() => onMarkAccuracy(signal.id, false)}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1.5" /> Missed
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
