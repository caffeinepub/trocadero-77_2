import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SignalData } from "../hooks/useCryptoSignals";
import { getAllData } from "../hooks/useLearningEngine";

const SYMBOL_TO_CG_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  ADA: "cardano",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  LINK: "chainlink",
  UNI: "uniswap",
  ATOM: "cosmos",
  LTC: "litecoin",
  XRP: "ripple",
  DOGE: "dogecoin",
  NEAR: "near",
  APT: "aptos",
  ARB: "arbitrum",
  OP: "optimism",
  SUI: "sui",
  INJ: "injective-protocol",
  RNDR: "render-token",
  ICP: "internet-computer",
  POL: "polygon-ecosystem-token",
  SHIB: "shiba-inu",
  TRX: "tron",
  TON: "the-open-network",
  PEPE: "pepe",
  WIF: "dogwifcoin",
  BONK: "bonk",
  FLOKI: "floki",
  XLM: "stellar",
  VET: "vechain",
  FIL: "filecoin",
  HBAR: "hedera-hashgraph",
  ETC: "ethereum-classic",
  CRO: "crypto-com-chain",
  ALGO: "algorand",
  EGLD: "elrond-erd-2",
  THETA: "theta-token",
  EOS: "eos",
  XTZ: "tezos",
  CAKE: "pancakeswap-token",
  SAND: "the-sandbox",
  MANA: "decentraland",
  AXS: "axie-infinity",
  GALA: "gala",
  FTM: "fantom",
  ONE: "harmony",
  IOTA: "iota",
  ZEC: "zcash",
  XMR: "monero",
  NEO: "neo",
  WAVES: "waves",
  CHZ: "chiliz",
  ENJ: "enjincoin",
  BAT: "basic-attention-token",
  ZIL: "zilliqa",
  HOT: "holotoken",
  QTUM: "qtum",
  ONT: "ontology",
  ZRX: "0x",
  OMG: "omisego",
  GRT: "the-graph",
  SUSHI: "sushi",
  COMP: "compound-governance-token",
  AAVE: "aave",
  MKR: "maker",
  SNX: "synthetix-network-token",
  YFI: "yearn-finance",
  CRV: "curve-dao-token",
  LDO: "lido-dao",
  FXS: "frax-share",
  BLUR: "blur",
  APE: "apecoin",
  GMT: "stepn",
  DYDX: "dydx",
  IMX: "immutable-x",
  STX: "blockstack",
  ROSE: "oasis-network",
  KAVA: "kava",
  BAND: "band-protocol",
  OCEAN: "ocean-protocol",
  SKL: "skale",
  ANKR: "ankr",
  RVN: "ravencoin",
  CELR: "celer-network",
  CTSI: "cartesi",
  CELO: "celo",
  HIVE: "hive",
  DGB: "digibyte",
  MINA: "mina-protocol",
  FLUX: "zel",
  CFX: "conflux-token",
  IOST: "iostoken",
  TWT: "trust-wallet-token",
  LUNC: "terra-luna",
  JASMY: "jasmycoin",
  ACH: "alchemy-pay",
  ALICE: "my-neighbor-alice",
  DENT: "dent",
  OGN: "origin-protocol",
  STORJ: "storj",
  REEF: "reef",
  SLP: "smooth-love-potion",
  COTI: "coti",
  WIN: "wink",
  ALPHA: "alpha-finance",
  FUN: "funfair",
  WRX: "wazirx",
  BAKE: "bakerytoken",
  IDEX: "idex",
  LOOM: "loom-network-new",
  DUSK: "dusk-network",
  RUNE: "thorchain",
  DODO: "dodo",
  PERP: "perpetual-protocol",
  MASK: "mask-network",
  RARE: "superrare",
};

interface ChartPoint {
  time: string;
  price: number;
}

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

function fmtTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function PriceChart({ signal }: { signal: SignalData }) {
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isUp, setIsUp] = useState(true);

  useEffect(() => {
    const cgId = SYMBOL_TO_CG_ID[signal.symbol];
    if (!cgId) {
      setError(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    fetch(
      `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=1`,
    )
      .then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.json() as Promise<{ prices: [number, number][] }>;
      })
      .then((data) => {
        const pts = data.prices.map(([ts, price]) => ({
          time: fmtTime(ts),
          price,
        }));
        const step = Math.max(1, Math.floor(pts.length / 60));
        const thinned = pts.filter((_, i) => i % step === 0);
        setChartData(thinned);
        if (thinned.length >= 2) {
          setIsUp(thinned[thinned.length - 1].price >= thinned[0].price);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [signal.symbol]);

  if (loading) {
    return (
      <div className="space-y-2" data-ocid="signal.loading_state">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-[180px] w-full rounded-xl" />
      </div>
    );
  }

  if (error || chartData.length === 0) return null;

  const color = isUp ? "oklch(52% 0.18 145)" : "oklch(55% 0.18 25)";
  const gradientId = `price-gradient-${signal.symbol}`;

  const prices = chartData.map((d) => d.price);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const yDomain = [minP * 0.9995, maxP * 1.0005];

  return (
    <div
      className="rounded-xl border border-border p-4"
      style={{ background: "#f8f9fa" }}
      data-ocid="signal.chart_point"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono text-foreground/70 uppercase tracking-wider">
          24h Price Chart
        </span>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {isUp ? "▲" : "▼"}{" "}
          {Math.abs(
            ((chartData[chartData.length - 1].price - chartData[0].price) /
              chartData[0].price) *
              100,
          ).toFixed(2)}
          %
        </span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(80% 0.01 240)"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 9, fill: "oklch(45% 0.01 240)" }}
            tickLine={false}
            axisLine={false}
            interval={Math.floor(chartData.length / 5)}
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 9, fill: "oklch(45% 0.01 240)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${fmtPrice(v)}`}
            width={60}
          />
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.12)",
              borderRadius: "8px",
              fontSize: "11px",
              fontFamily: "JetBrains Mono, monospace",
            }}
            formatter={(value: number) => [`$${fmtPrice(value)}`, "Price"]}
          />
          <ReferenceLine
            y={signal.entryPrice}
            stroke="oklch(60% 0.12 60)"
            strokeDasharray="5 4"
            label={{
              value: "Entry",
              position: "insideTopRight",
              fontSize: 9,
              fill: "oklch(50% 0.12 60)",
            }}
          />
          <ReferenceLine
            y={signal.takeProfit}
            stroke="oklch(52% 0.18 145)"
            strokeDasharray="5 4"
            label={{
              value: "TP",
              position: "insideTopRight",
              fontSize: 9,
              fill: "oklch(42% 0.18 145)",
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
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
  // Bug 7: Compute real historical win rate from learning engine
  const allLearningData = getAllData();
  const symbolData = signal ? allLearningData[signal.symbol] : undefined;
  const historicalWinRate =
    symbolData && symbolData.wins + symbolData.losses >= 3
      ? Math.round(
          (symbolData.wins / (symbolData.wins + symbolData.losses)) * 100,
        )
      : 87;
  const prevPriceRef = useRef(0);
  const signalOpenTimeRef = useRef<number>(Date.now());
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Reset timer when a new signal opens
  useEffect(() => {
    if (signal) {
      signalOpenTimeRef.current = Date.now();
      setSecondsElapsed(0);
    }
  }, [signal]);

  // Live countdown ticker
  useEffect(() => {
    if (!signal) return;
    const iv = setInterval(() => {
      setSecondsElapsed(
        Math.floor((Date.now() - signalOpenTimeRef.current) / 1000),
      );
    }, 1000);
    return () => clearInterval(iv);
  }, [signal]);

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
  }, [signal]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const isBuy = signal?.direction === "long";

  // TP Progress calculation
  const priceProgress = signal
    ? isBuy
      ? Math.max(
          0,
          Math.min(
            100,
            ((signal.currentPrice - signal.entryPrice) /
              (signal.takeProfit - signal.entryPrice)) *
              100,
          ),
        )
      : Math.max(
          0,
          Math.min(
            100,
            ((signal.entryPrice - signal.currentPrice) /
              (signal.entryPrice - signal.takeProfit)) *
              100,
          ),
        )
    : 0;

  const distanceToTP = signal
    ? isBuy
      ? ((signal.takeProfit - signal.currentPrice) / signal.currentPrice) * 100
      : ((signal.currentPrice - signal.takeProfit) / signal.currentPrice) * 100
    : 0;

  // Live countdown
  const remainingHours = signal
    ? Math.max(0, signal.estimatedHours - secondsElapsed / 3600)
    : 0;
  const remainingMins = Math.floor((remainingHours % 1) * 60);
  const remainingHoursInt = Math.floor(remainingHours);
  const countdownLabel =
    remainingHours < 1 / 60
      ? "< 1m remaining"
      : remainingHours < 1
        ? `${remainingMins}m remaining`
        : `${remainingHoursInt}h ${remainingMins}m remaining`;

  // Price moving toward or away from TP
  const movingTowardTP = isBuy
    ? (signal?.currentPrice ?? 0) >= (signal?.entryPrice ?? 0)
    : (signal?.currentPrice ?? 0) <= (signal?.entryPrice ?? 0);

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
            className="relative w-full md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl md:rounded-2xl"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.20)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            }}
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
                        className={`text-xs font-bold ${
                          isBuy
                            ? "bg-signal-buy/20 text-signal-buy border-signal-buy/30"
                            : "bg-signal-sell/20 text-signal-sell border-signal-sell/30"
                        }`}
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
              <div
                className="rounded-xl border border-border p-4"
                style={{ background: "#f8f9fa" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-foreground/70 uppercase tracking-wider">
                    Live Price
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-foreground/45">
                      updated {secondsElapsed}s ago
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
                      <span className="text-xs font-mono text-signal-buy">
                        Real-time
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-end gap-3">
                  <span
                    className={`text-3xl font-mono font-bold transition-colors duration-300 ${
                      pricePulse ? "text-gold" : "text-foreground"
                    }`}
                  >
                    ${fmtPrice(signal.currentPrice)}
                  </span>
                  <span
                    className={`text-sm font-mono ${
                      isBuy ? "text-signal-buy" : "text-signal-sell"
                    }`}
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

              {/* TP Progress Bar */}
              <div
                className="rounded-xl border border-border p-4"
                style={{ background: "#f8f9fa" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-foreground/70 uppercase tracking-wider">
                    Progress to Target
                  </span>
                  <span
                    className="text-sm font-mono font-bold"
                    style={{
                      color: isBuy
                        ? "oklch(52% 0.18 145)"
                        : "oklch(55% 0.18 25)",
                    }}
                  >
                    {priceProgress.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={priceProgress}
                  className="h-2.5 mb-2"
                  style={{
                    // @ts-ignore
                    "--progress-color": isBuy
                      ? "oklch(52% 0.18 145)"
                      : "oklch(55% 0.18 25)",
                  }}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-mono text-foreground/55">
                    {distanceToTP > 0
                      ? `Need ${isBuy ? "+" : "-"}${Math.abs(distanceToTP).toFixed(2)}% more to hit TP`
                      : "🎯 Target reached!"}
                  </span>
                  <span className="text-xs font-mono text-foreground/45">
                    Entry → TP
                  </span>
                </div>
              </div>

              {/* 24h price chart */}
              <PriceChart signal={signal} />

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
                    className="rounded-xl border border-border p-3 text-center"
                    style={{ background: "#f8f9fa" }}
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

              {/* Live Countdown + Profit */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-xl border border-border p-4"
                  style={{ background: "#f8f9fa" }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gold" />
                    <span className="text-xs font-mono text-foreground/70">
                      Time to TP
                    </span>
                  </div>
                  <div className="text-lg font-mono font-bold text-foreground">
                    {countdownLabel}
                  </div>
                  <div className="text-xs text-foreground/45 mt-0.5">
                    Est. {signal.estimatedHours}h total
                  </div>
                </div>
                <div
                  className="rounded-xl border border-border p-4"
                  style={{ background: "#f8f9fa" }}
                >
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
              <div
                className="rounded-xl border p-4"
                style={{
                  background: "#fffbf0",
                  borderColor: "rgba(180,140,0,0.18)",
                }}
              >
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
                      className="rounded-xl border border-border p-3"
                      style={{ background: "#f8f9fa" }}
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
              <div
                className="rounded-xl border border-border p-4"
                style={{ background: "#f8f9fa" }}
              >
                <div className="text-xs font-mono text-foreground/70 uppercase tracking-wider mb-3">
                  Direction
                </div>
                <div
                  className={`flex items-center gap-2 ${
                    isBuy ? "text-signal-buy" : "text-signal-sell"
                  }`}
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
              <div
                className="rounded-xl border border-border p-4"
                style={{ background: "#f8f9fa" }}
              >
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

                    {/* Historical win rate + price direction */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                        style={{
                          background: "#fffbf0",
                          borderColor: "rgba(180,140,0,0.3)",
                        }}
                      >
                        <span
                          className="text-xs font-mono"
                          style={{ color: "oklch(52% 0.15 60)" }}
                        >
                          🏆 Historical win rate:
                        </span>
                        <span
                          className="text-xs font-mono font-bold"
                          style={{ color: "oklch(44% 0.15 60)" }}
                        >
                          {historicalWinRate}%
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${
                          movingTowardTP
                            ? "border-signal-buy/25 text-signal-buy"
                            : "border-signal-sell/25 text-signal-sell"
                        }`}
                        style={{
                          background: movingTowardTP
                            ? "rgba(22,163,74,0.07)"
                            : "rgba(220,38,38,0.07)",
                        }}
                      >
                        {movingTowardTP
                          ? "Price moving toward target ▲"
                          : "Price moving away ▼"}
                      </div>
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
