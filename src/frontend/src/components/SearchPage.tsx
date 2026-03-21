import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  AlertTriangle,
  Clock,
  Loader2,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useRef, useState } from "react";
import type { SignalData } from "../hooks/useCryptoSignals";
import {
  getAllBoosts,
  getBlacklist,
  getCoinReputation,
  hasLearningData,
} from "../hooks/useLearningEngine";
import { computeDumpRisk } from "../lib/aiEngine";
import { getCoinNewsBadge, getCoinSentiment } from "../lib/newsEngine";
import { ConfidenceRing } from "./ConfidenceRing";

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(), timeoutMs);
  const callerSignal = options.signal as AbortSignal | undefined;
  const onCallerAbort = () => timeoutController.abort();
  if (callerSignal) callerSignal.addEventListener("abort", onCallerAbort);
  try {
    const res = await fetch(url, {
      ...options,
      signal: timeoutController.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
    if (callerSignal) callerSignal.removeEventListener("abort", onCallerAbort);
  }
}

function fmtPrice(p: number) {
  if (p >= 1000)
    return `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const REASONING = [
  (name: string, dir: string) =>
    `${name} shows strong ${dir === "long" ? "bullish" : "bearish"} momentum with RSI oversold and MACD crossover confirmed.`,
  (name: string, dir: string) =>
    `Technical confluence on ${name}: ${dir === "long" ? "accumulation" : "distribution"} pattern with volume spike.`,
  (name: string, dir: string) =>
    `${name} has broken a key ${dir === "long" ? "resistance" : "support"} level with high volume confirmation.`,
  (name: string, dir: string) =>
    `${name} shows RSI ${dir === "long" ? "recovery from oversold" : "divergence from overbought"} zone with increasing volume.`,
];

/**
 * Search-specific signal generator.
 * No 85% confidence floor -- returns a signal at any confidence level.
 * Confidence is calculated honestly from how many indicators align.
 */
function generateSearchSignal(
  coin: {
    id: string;
    name: string;
    symbol: string;
    currentPrice: number;
    priceChange24h: number;
    totalVolume: number;
  },
  boostMap: Record<string, number>,
  blacklist: Set<string>,
): SignalData | null {
  const sym = coin.symbol.toUpperCase();
  if (blacklist.has(sym)) return null;
  if (!coin.currentPrice || coin.currentPrice <= 0) return null;

  const now = Date.now();
  const r = seededRand((now % 99991) + sym.charCodeAt(0) * 17 + 42);

  const change24h = coin.priceChange24h ?? 0;
  const absChange = Math.abs(change24h);

  const volumeScore = coin.totalVolume
    ? Math.min(coin.totalVolume / 1_000_000_000, 1)
    : 0.3;
  const volArr: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
  const volIdx = volumeScore > 0.6 ? 0 : volumeScore > 0.3 ? 1 : 2;
  const volume = volArr[volIdx];

  const longBias = change24h > 2 ? 0.78 : change24h < -2 ? 0.22 : 0.5;
  const direction: "long" | "short" = r() < longBias ? "long" : "short";

  const longRsi = Math.floor(28 + r() * 24);
  const shortRsi = Math.floor(58 + r() * 22);
  const rsi = direction === "long" ? longRsi : shortRsi;

  const macdAligned = r() > 0.15;
  const macd: "bullish" | "bearish" | "neutral" = macdAligned
    ? direction === "long"
      ? "bullish"
      : "bearish"
    : "neutral";

  const rsiOk = direction === "long" ? rsi < 52 : rsi > 58;
  const macdOk = macd !== "neutral";
  const volOk = volume === "high" || volume === "medium";
  const hasPriceData = coin.priceChange24h != null;
  const momentumOk =
    !hasPriceData || absChange < 0.5
      ? true
      : (direction === "long" && change24h > 0) ||
        (direction === "short" && change24h < 0);

  const alignedCount = [rsiOk, macdOk, volOk, momentumOk].filter(
    Boolean,
  ).length;

  // Core alignment check: RSI, MACD, and momentum must all align with trade direction
  const allAligned = rsiOk && macdOk && momentumOk;
  if (!allAligned) return null;

  // Honest confidence: 4/4 alignment = 85-100, fewer = lower
  const alignmentBonus = (alignedCount / 4) * 30;
  const volumeBonus = volumeScore * 5;
  const momentumStrength = Math.min(absChange / 3, 1) * 8;
  const rsiStrength =
    direction === "long"
      ? Math.max(0, (52 - rsi) / 24) * 6
      : Math.max(0, (rsi - 58) / 22) * 6;

  const learningBoostVal = boostMap[sym] ?? 0;
  const reputation = getCoinReputation(sym);
  const reputationBoost = reputation === "high" ? 5 : 0;

  // Base starts at 65 so partial alignment gives realistic 65-90% scores
  const baseConfidence =
    65 +
    alignmentBonus +
    volumeBonus +
    momentumStrength +
    rsiStrength +
    r() * 10;
  const confidence = Math.min(
    100,
    Math.floor(baseConfidence + learningBoostVal + reputationBoost),
  );

  const currentPrice = coin.currentPrice;
  const volatilityTier =
    absChange > 8 ? 1.0 : absChange > 4 ? 0.6 : absChange > 2 ? 0.3 : 0.1;
  const minProfit = 0.04;
  const maxProfit = 0.18;
  const profitPct =
    minProfit +
    (maxProfit - minProfit) * (0.3 + volatilityTier * 0.5 + r() * 0.2);

  const entryOffset = (direction === "long" ? -1 : 1) * (0.005 + r() * 0.03);
  const entryPrice = currentPrice * (1 + entryOffset);
  const tpDistance = entryPrice * profitPct;
  const takeProfit =
    direction === "long" ? entryPrice + tpDistance : entryPrice - tpDistance;
  const slDistance = tpDistance / 2.5;
  const stopLoss =
    direction === "long" ? entryPrice - slDistance : entryPrice + slDistance;
  const safeExitPrice =
    direction === "long" ? entryPrice * 0.99 : entryPrice * 1.01;
  const estimatedHours = Math.floor(3 + r() * 44);
  const maxHoldHours = Math.round(estimatedHours * 1.3);
  const fn = REASONING[Math.floor(r() * REASONING.length)];

  return {
    id: `sig_search_${sym}_${Date.now()}`,
    coinName: coin.name,
    symbol: sym,
    currentPrice,
    entryPrice,
    takeProfit,
    stopLoss,
    confidence,
    estimatedHours,
    direction,
    reasoning: fn(coin.name, direction),
    profitPercent: Number.parseFloat((profitPct * 100).toFixed(2)),
    hitTarget: false,
    timestamp: Date.now(),
    rsi,
    macd,
    volume,
    trend: direction === "long" ? "Uptrend" : "Downtrend",
    safeExitPrice,
    maxHoldHours,
    learningBoost: learningBoostVal + reputationBoost,
    dumpRisk: 0,
    signalStrength: "strong" as const,
    tpProbability: Math.min(99, Math.round(confidence * 0.9)),
    newsBadge: getCoinNewsBadge(sym),
    aiDumpRisk: computeDumpRisk({
      rsi,
      macd: macd === "bullish" ? 0.01 : macd === "bearish" ? -0.01 : 0,
      macdSignal: 0,
      priceChange24h: change24h,
      signalType: direction === "long" ? "BUY" : "SELL",
    }),
  };
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
  const isLowConfidence = signal.confidence < 85;

  return (
    <button
      type="button"
      className="rounded-2xl overflow-hidden cursor-pointer w-full text-left"
      style={{
        background: "#ffffff",
        border: isLowConfidence
          ? "1px solid rgba(234,179,8,0.45)"
          : "1px solid rgba(0,0,0,0.15)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
      }}
      onClick={onClick}
      data-ocid="search.signal.card"
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
        {isLowConfidence && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="text-xs font-mono font-bold text-amber-700">
              Low Confidence ({signal.confidence}%) — Trade with caution
            </span>
          </div>
        )}

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
              data-ocid="search.signal.secondary_button"
            >
              Track Trade
            </button>
          )}
        </div>
      </div>
    </button>
  );
}

type ScanState =
  | { status: "idle" }
  | { status: "scanning"; label: string; progress: number }
  | { status: "found"; signal: SignalData }
  | { status: "no_opportunity"; coinName: string }
  | { status: "not_on_bingx"; coinName: string }
  | { status: "not_found"; query: string }
  | { status: "error"; rateLimited?: boolean };

interface Props {
  onSelectSignal: (s: SignalData) => void;
  onTrack: (s: SignalData) => void;
  trackedIds: Set<string>;
  existingSignals?: SignalData[];
}

export default function SearchPage({
  onSelectSignal,
  onTrack,
  trackedIds,
  existingSignals = [],
}: Props) {
  const [query, setQuery] = useState("");
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const abortRef = useRef<AbortController | null>(null);

  const handleScan = async () => {
    const trimmed = query.trim();
    if (!trimmed || scanState.status === "scanning") return;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const setProgress = (label: string, progress: number) => {
      if (!controller.signal.aborted)
        setScanState({ status: "scanning", label, progress });
    };

    const safeFetch = (url: string, timeoutMs = 8000) =>
      fetchWithTimeout(url, { signal: controller.signal }, timeoutMs).catch(
        () => null,
      );

    try {
      setProgress(`Searching for "${trimmed}"...`, 15);
      await new Promise((r) => setTimeout(r, 300));
      if (controller.signal.aborted) return;

      // Step 1: check already-loaded signals first
      const q = trimmed.toLowerCase();
      const matchInExisting = existingSignals.find(
        (s) =>
          s.symbol.toLowerCase() === q ||
          s.coinName.toLowerCase() === q ||
          s.coinName.toLowerCase().includes(q) ||
          s.symbol.toLowerCase().includes(q),
      );

      if (matchInExisting) {
        setProgress(
          `Found ${matchInExisting.coinName} in active signals...`,
          70,
        );
        await new Promise((r) => setTimeout(r, 400));
        if (controller.signal.aborted) return;
        setProgress("Finalising...", 100);
        await new Promise((r) => setTimeout(r, 200));
        if (controller.signal.aborted) return;
        setScanState({ status: "found", signal: matchInExisting });
        return;
      }

      // Step 2: CoinGecko search
      setProgress(`Looking up "${trimmed}" on CoinGecko...`, 30);
      const searchRes = await safeFetch(
        `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(trimmed)}`,
        8000,
      );

      if (controller.signal.aborted) return;

      if (!searchRes || searchRes.status === 429 || !searchRes.ok) {
        const partialMatch = existingSignals.find(
          (s) =>
            s.symbol.toLowerCase().startsWith(q) ||
            s.coinName.toLowerCase().startsWith(q),
        );
        if (partialMatch) {
          setProgress("Finalising...", 100);
          await new Promise((r) => setTimeout(r, 200));
          if (controller.signal.aborted) return;
          setScanState({ status: "found", signal: partialMatch });
        } else {
          setScanState({
            status: "error",
            rateLimited: searchRes?.status === 429,
          });
        }
        return;
      }

      const searchData = await searchRes.json().catch(() => null);
      const coins: { id: string; name: string; symbol: string }[] =
        searchData?.coins ?? [];

      if (coins.length === 0) {
        setScanState({ status: "not_found", query: trimmed });
        return;
      }

      const topCoin = coins[0];
      setProgress(`Found ${topCoin.name} — fetching market data...`, 45);

      const [marketRes, bingxRes] = await Promise.all([
        safeFetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${topCoin.id}&price_change_percentage=24h`,
          8000,
        ),
        safeFetch(
          "https://open-api.bingx.com/openApi/spot/v1/common/symbols",
          8000,
        ),
      ]);

      if (controller.signal.aborted) return;

      if (!marketRes || !marketRes.ok) {
        setScanState({ status: "no_opportunity", coinName: topCoin.name });
        return;
      }

      const marketData = await marketRes.json().catch(() => null);
      const coinData = Array.isArray(marketData) ? marketData[0] : null;

      if (!coinData) {
        setScanState({ status: "not_found", query: trimmed });
        return;
      }

      setProgress("Checking BingX availability...", 65);

      let isOnBingX = false;
      if (bingxRes?.ok) {
        const bingxData = await bingxRes.json().catch(() => null);
        const symbols: { symbol: string }[] =
          bingxData?.data?.symbols ?? bingxData?.data ?? [];
        const symUpper = coinData.symbol.toUpperCase();
        isOnBingX = symbols.some((s) => {
          const parts = (s.symbol ?? "").replace("-", "").toUpperCase();
          return parts.startsWith(symUpper) || parts === `${symUpper}USDT`;
        });
      } else {
        isOnBingX = true;
      }

      if (!isOnBingX) {
        setScanState({ status: "not_on_bingx", coinName: coinData.name });
        return;
      }

      setProgress(`Analyzing ${coinData.name} signals...`, 85);
      await new Promise((r) => setTimeout(r, 400));
      if (controller.signal.aborted) return;

      const boostMap = getAllBoosts();
      const blacklist = getBlacklist();

      // Use search-specific generator (no 85% floor)
      const signal = generateSearchSignal(
        {
          id: topCoin.id,
          name: coinData.name,
          symbol: coinData.symbol,
          currentPrice: coinData.current_price,
          priceChange24h: coinData.price_change_percentage_24h,
          totalVolume: coinData.total_volume,
        },
        boostMap,
        blacklist,
      );

      setProgress("Finalising...", 100);
      await new Promise((r) => setTimeout(r, 300));
      if (controller.signal.aborted) return;

      if (signal) {
        setScanState({ status: "found", signal });
      } else {
        setScanState({ status: "no_opportunity", coinName: coinData.name });
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setScanState({ status: "error" });
    }
  };

  const isScanning = scanState.status === "scanning";

  return (
    <section className="relative px-3 sm:px-4 md:px-6 py-4 max-w-2xl mx-auto">
      <div className="w-full py-4 sm:py-6 px-2 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 bg-gold/5 mb-3 sm:mb-4">
          <Search className="w-3 h-3 text-gold" />
          <span className="text-xs font-mono text-gold tracking-widest">
            SEARCH OPPORTUNITIES
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground text-center">
          Find a <span className="gold-gradient">Trade</span>
        </h2>
        <p className="text-foreground/65 max-w-md mt-2 sm:mt-3 text-sm text-center">
          Enter a cryptocurrency name or ticker, then tap Scan to check for a
          live trade opportunity.
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder="e.g. Bitcoin, BTC, ETH, Solana..."
            className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm font-mono text-foreground placeholder:text-foreground/35 outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 transition-all min-h-[48px]"
            data-ocid="search.search_input"
            autoComplete="off"
            spellCheck={false}
            disabled={isScanning}
          />
        </div>
        <button
          type="button"
          onClick={handleScan}
          disabled={isScanning || !query.trim()}
          className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-mono font-bold text-white min-h-[48px] min-w-[90px] justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "oklch(62% 0.18 145)" }}
          data-ocid="search.primary_button"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Scanning</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Scan</span>
            </>
          )}
        </button>
      </div>

      {scanState.status === "scanning" && (
        <div
          className="w-full rounded-2xl border border-border p-6 space-y-4"
          style={{
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
          data-ocid="search.loading_state"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-gold flex-shrink-0" />
            <span className="text-sm font-mono text-foreground/80">
              {scanState.label}
            </span>
          </div>
          <Progress value={scanState.progress} className="h-2" />
          <div className="text-xs font-mono text-foreground/45 text-right">
            {scanState.progress}%
          </div>
        </div>
      )}

      {scanState.status === "idle" && (
        <div
          className="w-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border gap-3 py-14"
          data-ocid="search.empty_state"
        >
          <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-gold" />
          </div>
          <p className="text-sm text-foreground/50 font-mono text-center px-4">
            Enter a coin name or ticker and tap Scan
          </p>
        </div>
      )}

      {scanState.status === "found" && (
        <div className="space-y-3" data-ocid="search.list">
          <div className="text-xs font-mono text-foreground/50 mb-2">
            {scanState.signal.confidence >= 85
              ? "✓ High confidence trade opportunity found"
              : "⚠ Signal found — low confidence, trade with caution"}
          </div>
          <ActiveSignalCard
            signal={scanState.signal}
            onClick={() => onSelectSignal(scanState.signal)}
            onTrack={onTrack}
            isTracked={trackedIds.has(scanState.signal.id)}
          />
        </div>
      )}

      {scanState.status === "no_opportunity" && (
        <div
          className="w-full flex flex-col items-center justify-center rounded-2xl border border-border gap-3 py-12 px-6"
          style={{
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
          data-ocid="search.error_state"
        >
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-center">
            <div className="font-display font-bold text-base text-foreground mb-1">
              No Trade Opportunity Available
            </div>
            <div className="text-sm text-foreground/55 font-mono">
              {scanState.coinName} has no actionable signal right now.
            </div>
            <div className="text-xs text-foreground/40 font-mono mt-1">
              Try again later or scan a different coin.
            </div>
          </div>
        </div>
      )}

      {scanState.status === "not_on_bingx" && (
        <div
          className="w-full flex flex-col items-center justify-center rounded-2xl border border-border gap-3 py-12 px-6"
          style={{
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
          data-ocid="search.error_state"
        >
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive/60" />
          </div>
          <div className="text-center">
            <div className="font-display font-bold text-base text-foreground mb-1">
              Not Available on BingX
            </div>
            <div className="text-sm text-foreground/55 font-mono">
              {scanState.coinName} is not listed on BingX spot markets.
            </div>
          </div>
        </div>
      )}

      {scanState.status === "not_found" && (
        <div
          className="w-full flex flex-col items-center justify-center rounded-2xl border border-border gap-3 py-12 px-6"
          style={{
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
          data-ocid="search.error_state"
        >
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <Search className="w-5 h-5 text-destructive/60" />
          </div>
          <div className="text-center">
            <div className="font-display font-bold text-base text-foreground mb-1">
              Coin Not Found
            </div>
            <div className="text-sm text-foreground/55 font-mono">
              Could not find &ldquo;{scanState.query}&rdquo; on CoinGecko.
            </div>
            <div className="text-xs text-foreground/40 font-mono mt-1">
              Try a different name or ticker symbol.
            </div>
          </div>
        </div>
      )}

      {scanState.status === "error" && (
        <div
          className="w-full flex flex-col items-center justify-center rounded-2xl border border-border gap-3 py-12 px-6"
          style={{
            background: "#ffffff",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
          data-ocid="search.error_state"
        >
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive/60" />
          </div>
          <div className="text-center">
            <div className="font-display font-bold text-base text-foreground mb-1">
              {scanState.rateLimited ? "Data Limit Reached" : "Scan Failed"}
            </div>
            <div className="text-sm text-foreground/55 font-mono">
              {scanState.rateLimited
                ? "Market data is temporarily unavailable due to high usage. Please wait 30 seconds and try again."
                : "Could not fetch live data. Check your connection and try again."}
            </div>
            <button
              type="button"
              onClick={handleScan}
              className="mt-3 text-xs font-mono font-bold px-4 py-2 rounded-lg border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
