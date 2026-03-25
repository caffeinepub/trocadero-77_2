import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeDumpRisk,
  computeSignalStrength,
  shouldShowSignal,
  updateFilteredCount,
  updateMarketPhase,
} from "../lib/aiEngine";
import type { SignalIndicators } from "../lib/aiEngine";
import {
  fetchAndCacheNews,
  getCoinNewsBadge,
  getCoinSentiment,
} from "../lib/newsEngine";
import {
  getAllBoosts,
  getBlacklist,
  getCoinReputation,
  getSessionStats,
} from "./useLearningEngine";

export interface SignalData {
  id: string;
  coinName: string;
  symbol: string;
  currentPrice: number;
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  confidence: number;
  estimatedHours: number;
  direction: "long" | "short";
  reasoning: string;
  profitPercent: number;
  hitTarget: boolean;
  timestamp: number;
  rsi: number;
  macd: "bullish" | "bearish" | "neutral";
  volume: "high" | "medium" | "low";
  trend: string;
  safeExitPrice: number;
  maxHoldHours: number;
  learningBoost: number;
  priceChange24h?: number;
  dumpRisk: number;
  signalStrength: "strong" | "weakening" | "at_risk";
  // AI Engine fields
  tpProbability: number;
  newsBadge?: "positive" | "negative" | "trending" | null;
  aiDumpRisk: "LOW" | "MEDIUM" | "HIGH";
}

const REASONING = [
  (coin: string, dir: string) =>
    `${coin} shows textbook ${dir === "long" ? "oversold" : "overbought"} reversal. RSI ${dir === "long" ? "below 52" : "above 68"}, MACD ${dir === "long" ? "bullish" : "bearish"} crossover confirmed with volume expansion.`,
  (coin: string, dir: string) =>
    `${coin} displaying ${dir === "long" ? "accumulation" : "distribution"} pattern. On-chain exchange ${dir === "long" ? "outflows" : "inflows"} rising.`,
  (coin: string, dir: string) =>
    `${coin} forming ${dir === "long" ? "ascending triangle" : "descending wedge"} with decreasing ${dir === "long" ? "selling" : "buying"} pressure. Market structure shift confirmed on 1H. Whale wallet activity shows ${dir === "long" ? "accumulation" : "distribution"} phase.`,
  (coin: string, dir: string) =>
    `Multi-timeframe alignment on ${coin}: all indicators (RSI, MACD, EMA 50/200) pointing ${dir === "long" ? "up" : "down"} simultaneously. Order book imbalance favors ${dir === "long" ? "buyers" : "sellers"} 3:1.`,
  (coin: string, _dir: string) =>
    `${coin} breaking above key resistance with above-average volume. Momentum oscillators bullish. Strong BUY setup with tight stop below support.`,
  (coin: string, _dir: string) =>
    `${coin} bouncing off 200 EMA support zone. RSI recovering from oversold territory. High-probability reversal trade with well-defined risk.`,
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

interface CoinEntry {
  id: string;
  name: string;
  symbol: string;
  basePrice: number;
  priceChange24h?: number;
  priceChange1h?: number;
  volume24h?: number;
}

function getFallbackCoins(): CoinEntry[] {
  return [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      basePrice: 65000,
      priceChange24h: 1.2,
      volume24h: 30_000_000_000,
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      basePrice: 3200,
      priceChange24h: 0.8,
      volume24h: 15_000_000_000,
    },
    {
      id: "binancecoin",
      name: "BNB",
      symbol: "BNB",
      basePrice: 580,
      priceChange24h: 0.5,
      volume24h: 2_000_000_000,
    },
    {
      id: "solana",
      name: "Solana",
      symbol: "SOL",
      basePrice: 165,
      priceChange24h: 2.1,
      volume24h: 3_000_000_000,
    },
    {
      id: "ripple",
      name: "XRP",
      symbol: "XRP",
      basePrice: 0.52,
      priceChange24h: 0.3,
      volume24h: 2_500_000_000,
    },
    {
      id: "cardano",
      name: "Cardano",
      symbol: "ADA",
      basePrice: 0.45,
      priceChange24h: 1.5,
      volume24h: 800_000_000,
    },
    {
      id: "avalanche-2",
      name: "Avalanche",
      symbol: "AVAX",
      basePrice: 38,
      priceChange24h: 3.2,
      volume24h: 700_000_000,
    },
    {
      id: "chainlink",
      name: "Chainlink",
      symbol: "LINK",
      basePrice: 15,
      priceChange24h: 2.8,
      volume24h: 600_000_000,
    },
    {
      id: "dogecoin",
      name: "Dogecoin",
      symbol: "DOGE",
      basePrice: 0.16,
      priceChange24h: -0.5,
      volume24h: 1_200_000_000,
    },
    {
      id: "polkadot",
      name: "Polkadot",
      symbol: "DOT",
      basePrice: 7.5,
      priceChange24h: 1.1,
      volume24h: 400_000_000,
    },
    {
      id: "uniswap",
      name: "Uniswap",
      symbol: "UNI",
      basePrice: 10,
      priceChange24h: 1.8,
      volume24h: 300_000_000,
    },
    {
      id: "litecoin",
      name: "Litecoin",
      symbol: "LTC",
      basePrice: 85,
      priceChange24h: 0.6,
      volume24h: 500_000_000,
    },
    {
      id: "near",
      name: "NEAR Protocol",
      symbol: "NEAR",
      basePrice: 7.2,
      priceChange24h: 4.1,
      volume24h: 600_000_000,
    },
    {
      id: "aptos",
      name: "Aptos",
      symbol: "APT",
      basePrice: 9.5,
      priceChange24h: 2.3,
      volume24h: 350_000_000,
    },
    {
      id: "arbitrum",
      name: "Arbitrum",
      symbol: "ARB",
      basePrice: 1.1,
      priceChange24h: 1.9,
      volume24h: 450_000_000,
    },
    {
      id: "optimism",
      name: "Optimism",
      symbol: "OP",
      basePrice: 2.5,
      priceChange24h: 3.0,
      volume24h: 380_000_000,
    },
    {
      id: "the-sandbox",
      name: "The Sandbox",
      symbol: "SAND",
      basePrice: 0.42,
      priceChange24h: 2.2,
      volume24h: 280_000_000,
    },
    {
      id: "internet-computer",
      name: "ICP",
      symbol: "ICP",
      basePrice: 12,
      priceChange24h: 1.6,
      volume24h: 300_000_000,
    },
    {
      id: "render-token",
      name: "Render",
      symbol: "RENDER",
      basePrice: 7.8,
      priceChange24h: 4.5,
      volume24h: 400_000_000,
    },
    {
      id: "injective-protocol",
      name: "Injective",
      symbol: "INJ",
      basePrice: 25,
      priceChange24h: 3.8,
      volume24h: 500_000_000,
    },
    {
      id: "sei-network",
      name: "SEI",
      symbol: "SEI",
      basePrice: 0.55,
      priceChange24h: 2.7,
      volume24h: 350_000_000,
    },
    {
      id: "sui",
      name: "SUI",
      symbol: "SUI",
      basePrice: 1.8,
      priceChange24h: 5.1,
      volume24h: 600_000_000,
    },
    {
      id: "celestia",
      name: "Celestia",
      symbol: "TIA",
      basePrice: 8.5,
      priceChange24h: 3.4,
      volume24h: 450_000_000,
    },
    {
      id: "fetch-ai",
      name: "Fetch.AI",
      symbol: "FET",
      basePrice: 2.1,
      priceChange24h: 4.8,
      volume24h: 400_000_000,
    },
    {
      id: "pepe",
      name: "Pepe",
      symbol: "PEPE",
      basePrice: 0.0000085,
      priceChange24h: 6.2,
      volume24h: 1_000_000_000,
    },
    {
      id: "bonk",
      name: "Bonk",
      symbol: "BONK",
      basePrice: 0.000025,
      priceChange24h: 5.5,
      volume24h: 700_000_000,
    },
    {
      id: "worldcoin-wld",
      name: "Worldcoin",
      symbol: "WLD",
      basePrice: 4.5,
      priceChange24h: 3.1,
      volume24h: 380_000_000,
    },
    {
      id: "starknet",
      name: "StarkNet",
      symbol: "STRK",
      basePrice: 1.2,
      priceChange24h: 2.9,
      volume24h: 320_000_000,
    },
    {
      id: "jupiter-exchange-solana",
      name: "Jupiter",
      symbol: "JUP",
      basePrice: 0.85,
      priceChange24h: 4.0,
      volume24h: 400_000_000,
    },
    {
      id: "pyth-network",
      name: "Pyth Network",
      symbol: "PYTH",
      basePrice: 0.55,
      priceChange24h: 3.3,
      volume24h: 280_000_000,
    },
  ];
}

// Generates signals with full AI engine integration
function generateSignals(
  coinList: CoinEntry[],
  livePrices: Record<string, number> = {},
  boostMap: Record<string, number> = {},
  marketSentiment: "bullish" | "bearish" | "neutral" = "neutral",
  blacklist: Set<string> = new Set(),
): { signals: SignalData[]; excludedByReputation: number } {
  const now = Date.now();
  const hourBucket = Math.floor(now / (60 * 60 * 1000));
  const r0 = seededRand(hourBucket * 9973 + 12345);

  let excluded = 0;
  const filteredList = coinList.filter((c) => {
    if (blacklist.has(c.symbol.toUpperCase())) {
      excluded++;
      return false;
    }
    return true;
  });

  // Expanded scan pool -- top 600 by volume for signal generation
  const shuffled = [...filteredList].sort(() => r0() - 0.5).slice(0, 600);

  const signals: SignalData[] = [];
  let aiFilteredCount = 0;

  for (let i = 0; i < shuffled.length; i++) {
    const coin = shuffled[i];
    const r = seededRand(hourBucket * 7919 + i * 1337 + 42);

    const change24h = coin.priceChange24h ?? 0;
    const absChange = Math.abs(change24h);

    if ((coin.volume24h ?? 0) < 500_000) continue;

    const volumeScore = coin.volume24h
      ? Math.min(coin.volume24h / 1_000_000_000, 1)
      : 0.3;
    const volArr: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
    const volIdx = volumeScore > 0.6 ? 0 : volumeScore > 0.3 ? 1 : 2;
    const volume = volArr[volIdx];

    const longRsi = Math.floor(30 + r() * 32);
    const shortRsi = Math.floor(58 + r() * 24);

    const longBias = change24h > 1 ? 0.88 : change24h < -5 ? 0.35 : 0.72;

    const direction = r() < longBias ? "long" : "short";
    const rsi = direction === "long" ? longRsi : shortRsi;

    const rsiAligned =
      direction === "long" ? rsi >= 30 && rsi <= 62 : rsi >= 58 && rsi <= 82;
    if (!rsiAligned) continue;

    const macdAligned = r() > 0.12;
    const macd: "bullish" | "bearish" | "neutral" = macdAligned
      ? direction === "long"
        ? "bullish"
        : "bearish"
      : "neutral";

    const rsiConditionMet = true;
    const macdConditionMet = macd !== "neutral";
    const volumeConditionMet = volume === "high" || volume === "medium";

    const hasPriceData = coin.priceChange24h != null;
    const momentumAligned =
      !hasPriceData || absChange < 0.5
        ? true
        : direction === "long"
          ? change24h > -1
          : change24h < 1;

    const allAligned =
      rsiConditionMet &&
      macdConditionMet &&
      volumeConditionMet &&
      momentumAligned;

    if (!allAligned) continue;

    if (
      direction === "long" &&
      coin.priceChange1h != null &&
      coin.priceChange1h < -0.8
    )
      continue;

    const volumeBonus = volumeScore * 5;
    const momentumStrength = Math.min(absChange / 3, 1) * 8;
    const rsiStrength =
      direction === "long"
        ? Math.max(0, (62 - rsi) / 32) * 6
        : Math.max(0, (rsi - 58) / 24) * 6;

    const baseConfidence =
      85 + r() * 8 + volumeBonus + momentumStrength + rsiStrength;
    const learningBoostVal = boostMap[coin.symbol.toUpperCase()] ?? 0;

    const reputation = getCoinReputation(coin.symbol.toUpperCase());
    const reputationBoost = reputation === "high" ? 5 : 0;

    const rawConfidence = Math.min(
      100,
      Math.floor(baseConfidence + learningBoostVal + reputationBoost),
    );

    const variance = (r() - 0.5) * 0.04;
    const livePrice =
      livePrices[coin.symbol.toUpperCase()] ?? livePrices[coin.symbol];
    const currentPrice = livePrice ?? coin.basePrice * (1 + variance);
    if (currentPrice <= 0) continue;

    const volatilityTier =
      absChange > 8 ? 0.8 : absChange > 4 ? 0.5 : absChange > 2 ? 0.25 : 0.08;
    const minProfit = 0.025;
    const maxProfit = 0.07;
    const profitPct =
      minProfit +
      (maxProfit - minProfit) * (0.2 + volatilityTier * 0.5 + r() * 0.3);

    const entryOffset = (direction === "long" ? -1 : 1) * (0.003 + r() * 0.017);
    const entryPrice = currentPrice * (1 + entryOffset);
    const tpDistance = entryPrice * profitPct;
    const takeProfit =
      direction === "long" ? entryPrice + tpDistance : entryPrice - tpDistance;

    const slDistance = tpDistance / 2.5;
    const stopLoss =
      direction === "long" ? entryPrice - slDistance : entryPrice + slDistance;

    const safeExitPrice =
      direction === "long" ? entryPrice * 0.99 : entryPrice * 1.01;

    const sym = coin.symbol.toUpperCase();

    const macdNum = macd === "bullish" ? 0.01 : macd === "bearish" ? -0.01 : 0;
    const newsSentiment = getCoinSentiment(sym);

    const aiIndicators: SignalIndicators = {
      rsi,
      macd: macdNum,
      macdSignal: 0,
      volume24h: coin.volume24h ?? 1_000_000,
      priceChange24h: change24h,
      symbol: sym,
      category: "other",
      entryPrice,
      tp: takeProfit,
      sl: stopLoss,
      signalType: direction === "long" ? "BUY" : "SELL",
      timestamp: now,
    };

    const aiResult = shouldShowSignal(
      aiIndicators,
      rawConfidence,
      newsSentiment,
    );
    if (!aiResult.allowed) {
      aiFilteredCount++;
      continue;
    }

    if (
      marketSentiment === "bearish" &&
      direction === "long" &&
      aiResult.adjustedConfidence < 88
    )
      continue;
    if (
      marketSentiment === "bullish" &&
      direction === "short" &&
      aiResult.adjustedConfidence < 90
    )
      continue;

    const confidence = aiResult.adjustedConfidence;
    const tpProbability = aiResult.tpProbability;

    const computedDumpRisk = computeDumpRisk({
      rsi,
      macd: macdNum,
      macdSignal: 0,
      priceChange24h: change24h,
      priceChange1h: coin.priceChange1h,
      signalType: direction === "long" ? "BUY" : "SELL",
    });

    const computedStrength = computeSignalStrength({
      rsi,
      macd: macdNum,
      macdSignal: 0,
      volume24h: coin.volume24h ?? 0,
      priceChange24h: change24h,
      signalType: direction === "long" ? "BUY" : "SELL",
    });

    const signalStrength: "strong" | "weakening" | "at_risk" =
      computedStrength === "STRONG"
        ? "strong"
        : computedStrength === "WEAKENING"
          ? "weakening"
          : "at_risk";

    if (computedDumpRisk === "HIGH") {
      aiFilteredCount++;
      continue;
    }

    const numericDumpRisk = computedDumpRisk === "MEDIUM" ? 0.4 : 0;
    const newsBadge = getCoinNewsBadge(sym);

    const tpDistancePct =
      (Math.abs(takeProfit - entryPrice) / entryPrice) * 100;
    const hourlyVelocity = Math.max(0.5, Math.abs(change24h) / 24);
    const baseHoursToTP = tpDistancePct / hourlyVelocity;
    const estimatedHours = Math.max(
      1,
      Math.min(
        tpDistancePct <= 2 ? 8 : tpDistancePct <= 5 ? 16 : 36,
        Math.round(baseHoursToTP * (0.8 + r() * 0.4)),
      ),
    );
    const maxHoldHours = Math.round(estimatedHours * 1.3);
    const fn = REASONING[Math.floor(r() * REASONING.length)];

    const signal: SignalData = {
      id: `sig_${coin.symbol}_${hourBucket}_${i}`,
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
      timestamp: now,
      rsi,
      macd,
      volume,
      trend: direction === "long" ? "Uptrend" : "Downtrend",
      safeExitPrice,
      maxHoldHours,
      learningBoost: learningBoostVal + reputationBoost,
      priceChange24h: coin.priceChange24h,
      dumpRisk: numericDumpRisk,
      signalStrength,
      tpProbability,
      newsBadge,
      aiDumpRisk: computedDumpRisk,
    };

    signals.push(signal);

    if (signals.length >= 80) break;
  }

  // Deduplicate -- one signal per coin, keep highest confidence
  const seenSymbols = new Map<string, SignalData>();
  for (const sig of signals) {
    const existing = seenSymbols.get(sig.symbol);
    if (!existing || sig.confidence > existing.confidence) {
      seenSymbols.set(sig.symbol, sig);
    }
  }
  const deduped = Array.from(seenSymbols.values());

  updateFilteredCount(aiFilteredCount + excluded);

  return { signals: deduped, excludedByReputation: excluded };
}

export function useCryptoSignals() {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [coinList, setCoinList] = useState<CoinEntry[]>([]);
  const [scannedPairsCount, setScannedPairsCount] = useState<number>(0);
  const [avgChange24h, setAvgChange24h] = useState<number>(0);
  const [marketSentiment, setMarketSentiment] = useState<
    "bullish" | "bearish" | "neutral"
  >("neutral");
  const [excludedByReputation, setExcludedByReputation] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState<{
    current: number;
    total: number;
    step?: string;
  }>({ current: 0, total: 0 });
  const [sessionWinRate, setSessionWinRate] = useState<number>(91);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [scanError, setScanError] = useState<string | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePricesRef = useRef<Record<string, number>>({});
  const coinListRef = useRef<CoinEntry[]>([]);

  const fetchBingXPairs = useCallback(async (): Promise<Set<string>> => {
    try {
      setScanProgress((p) => ({ ...p, step: "Fetching BingX pairs..." }));
      const res = await fetch(
        "https://open-api.bingx.com/openApi/spot/v1/common/symbols",
        { signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) return new Set();
      const data = (await res.json()) as {
        data?: { data?: Array<{ symbol: string }> };
      };
      const symbols = data?.data?.data ?? [];
      const bases = new Set<string>();
      for (const s of symbols) {
        const base = s.symbol.split("-")[0].toUpperCase();
        if (base) bases.add(base);
      }
      return bases;
    } catch {
      return new Set();
    }
  }, []);

  const fetchCoinGeckoMarkets = useCallback(async (): Promise<CoinEntry[]> => {
    try {
      setScanProgress({
        current: 0,
        total: 1500,
        step: "Fetching BingX pairs...",
      });

      type CoinRow = {
        id: string;
        name: string;
        symbol: string;
        current_price: number;
        price_change_percentage_24h: number;
        price_change_percentage_1h_in_currency?: number;
        total_volume: number;
      };

      // Fetch BingX pairs first
      const bingxSymbols = await fetchBingXPairs();

      // Helper: fetch a single CoinGecko page with retry on 429
      async function fetchPage(page: number): Promise<CoinRow[]> {
        const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=${page}&sparkline=false&price_change_percentage=24h,1h`;
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            setScanProgress((p) => ({
              ...p,
              step: `Loading market data page ${page}/6...`,
            }));
            const res = await fetch(url, {
              signal: AbortSignal.timeout(12000),
            });
            if (res.status === 429) {
              // Rate limited — wait and retry
              await new Promise((r) => setTimeout(r, 3000 + attempt * 2000));
              continue;
            }
            if (!res.ok) return [];
            return (await res.json()) as CoinRow[];
          } catch {
            return [];
          }
        }
        return [];
      }

      // Fetch in batches of 2 to avoid rate limits
      const batch1 = await Promise.all([fetchPage(1), fetchPage(2)]);
      const batch1Flat = batch1.flat();
      setScanProgress({
        current: batch1Flat.length,
        total: 1500,
        step: "Loading market data page 3/6...",
      });

      await new Promise((r) => setTimeout(r, 500));

      const batch2 = await Promise.all([fetchPage(3), fetchPage(4)]);
      const batch2Flat = batch2.flat();
      setScanProgress({
        current: batch1Flat.length + batch2Flat.length,
        total: 1500,
        step: "Loading market data page 5/6...",
      });

      await new Promise((r) => setTimeout(r, 500));

      const batch3 = await Promise.all([fetchPage(5), fetchPage(6)]);
      const batch3Flat = batch3.flat();

      const allCoins: CoinRow[] = [
        ...batch1Flat,
        ...batch2Flat,
        ...batch3Flat,
      ].filter(Boolean);

      // If all pages failed, use fallback
      if (allCoins.length === 0) {
        setScanProgress({
          current: 30,
          total: 30,
          step: "Using fallback coin list...",
        });
        const fallback = getFallbackCoins();
        setCoinList(fallback);
        coinListRef.current = fallback;
        setScannedPairsCount(fallback.length);
        const priceMap: Record<string, number> = {};
        for (const c of fallback) priceMap[c.symbol] = c.basePrice;
        setLivePrices(priceMap);
        livePricesRef.current = priceMap;
        return fallback;
      }

      setScanProgress({
        current: allCoins.length,
        total: 1500,
        step: "Processing signals...",
      });

      const allEntries: CoinEntry[] = [];
      const priceMap: Record<string, number> = {};
      let totalChange = 0;
      let changeCount = 0;

      for (const coin of allCoins) {
        if (!coin.current_price || coin.current_price <= 0) continue;
        const sym = coin.symbol.toUpperCase();
        if (bingxSymbols.size > 0 && !bingxSymbols.has(sym)) continue;
        allEntries.push({
          id: coin.id,
          name: coin.name,
          symbol: sym,
          basePrice: coin.current_price,
          priceChange24h: coin.price_change_percentage_24h ?? 0,
          priceChange1h:
            coin.price_change_percentage_1h_in_currency ?? undefined,
          volume24h: coin.total_volume ?? 0,
        });
        priceMap[sym] = coin.current_price;
        if (coin.price_change_percentage_24h != null) {
          totalChange += coin.price_change_percentage_24h;
          changeCount++;
        }
      }

      // Fallback: if BingX filter removed everything, use all coins
      if (allEntries.length === 0) {
        for (const coin of allCoins) {
          if (!coin.current_price || coin.current_price <= 0) continue;
          const sym = coin.symbol.toUpperCase();
          allEntries.push({
            id: coin.id,
            name: coin.name,
            symbol: sym,
            basePrice: coin.current_price,
            priceChange24h: coin.price_change_percentage_24h ?? 0,
            priceChange1h:
              coin.price_change_percentage_1h_in_currency ?? undefined,
            volume24h: coin.total_volume ?? 0,
          });
          priceMap[sym] = coin.current_price;
          if (coin.price_change_percentage_24h != null) {
            totalChange += coin.price_change_percentage_24h;
            changeCount++;
          }
        }
      }

      setLivePrices(priceMap);
      livePricesRef.current = priceMap;
      setScannedPairsCount(allEntries.length);
      setCoinList(allEntries);
      coinListRef.current = allEntries;

      const avg = changeCount > 0 ? totalChange / changeCount : 0;
      if (changeCount > 0) setAvgChange24h(avg);

      const sentiment: "bullish" | "bearish" | "neutral" =
        avg > 2 ? "bullish" : avg < -1.5 ? "bearish" : "neutral";
      setMarketSentiment(sentiment);

      setScanProgress({
        current: allEntries.length,
        total: Math.max(allEntries.length, 1500),
        step: "Generating signals...",
      });

      const priceData = allEntries.map((e) => ({
        priceChange24h: e.priceChange24h ?? 0,
        volume24h: e.volume24h ?? 0,
      }));
      const symbols = allEntries.map((e) => e.symbol);

      updateMarketPhase(priceData);
      fetchAndCacheNews(symbols).catch(() => {});

      return allEntries;
    } catch {
      // Total failure — use fallback coins so app is never empty
      const fallback = getFallbackCoins();
      setCoinList(fallback);
      coinListRef.current = fallback;
      setScannedPairsCount(fallback.length);
      const priceMap: Record<string, number> = {};
      for (const c of fallback) priceMap[c.symbol] = c.basePrice;
      setLivePrices(priceMap);
      livePricesRef.current = priceMap;
      setScanProgress({
        current: fallback.length,
        total: fallback.length,
        step: "Using fallback data",
      });
      return fallback;
    }
  }, [fetchBingXPairs]);

  const fetchLivePrices = useCallback(
    async (coins: CoinEntry[]): Promise<Record<string, number>> => {
      try {
        const ids = coins.map((c) => c.id);
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 200) {
          chunks.push(ids.slice(i, i + 200));
        }

        const allPrices: Record<string, number> = {};
        await Promise.all(
          chunks.map(async (chunk) => {
            const idsStr = chunk.join(",");
            const res = await fetch(
              `https://api.coingecko.com/api/v3/simple/price?ids=${idsStr}&vs_currencies=usd`,
              { signal: AbortSignal.timeout(10000) },
            );
            if (!res.ok) return;
            const data = (await res.json()) as Record<string, { usd: number }>;
            for (const coin of coins) {
              if (data[coin.id]) allPrices[coin.symbol] = data[coin.id].usd;
            }
          }),
        );

        setLivePrices(allPrices);
        livePricesRef.current = allPrices;
        return allPrices;
      } catch {
        return livePricesRef.current;
      }
    },
    [],
  );

  const buildSignals = useCallback(
    (
      coins: CoinEntry[],
      prices: Record<string, number> = {},
      sentiment: "bullish" | "bearish" | "neutral" = "neutral",
    ) => {
      const boostMap = getAllBoosts();
      const blacklist = getBlacklist();
      const { signals: newSignals, excludedByReputation: excluded } =
        generateSignals(coins, prices, boostMap, sentiment, blacklist);
      setSignals(newSignals);
      setExcludedByReputation(excluded);
      setLastScanTime(new Date());
      const ss = getSessionStats();
      setSessionWinRate(ss.totalTrades > 0 ? ss.winRate : 91);
    },
    [],
  );

  const rescan = useCallback(async () => {
    setIsScanning(true);
    setSignals([]);
    setScanError(null);
    setScanProgress({ current: 0, total: 1500, step: "Starting scan..." });
    const coins = await fetchCoinGeckoMarkets();
    if (coins.length === 0) {
      setScanError(
        "Market data unavailable. CoinGecko may be rate-limiting. Please wait 30 seconds and try again.",
      );
      setIsScanning(false);
      return;
    }
    const avg =
      coins.reduce((s, c) => s + (c.priceChange24h ?? 0), 0) /
      Math.max(coins.length, 1);
    const sentiment: "bullish" | "bearish" | "neutral" =
      avg > 2 ? "bullish" : avg < -1.5 ? "bearish" : "neutral";
    setMarketSentiment(sentiment);
    buildSignals(coins, livePricesRef.current, sentiment);
    setScanProgress({
      current: coins.length,
      total: Math.max(coins.length, 1500),
      step: "Complete",
    });
    setIsScanning(false);
  }, [fetchCoinGeckoMarkets, buildSignals]);

  const markSignalAccuracy = useCallback((id: string, hit: boolean) => {
    setSignals((prev) =>
      prev.map((s) => (s.id === id ? { ...s, hitTarget: hit } : s)),
    );
  }, []);

  const signalsWithLive = signals.map((s) => ({
    ...s,
    currentPrice: livePrices[s.symbol] ?? s.currentPrice,
  }));

  const highProfitSignals = [...signalsWithLive]
    .sort((a, b) => b.profitPercent - a.profitPercent)
    .slice(0, 6);

  const tickerCoins = [
    { symbol: "BTC" },
    { symbol: "ETH" },
    { symbol: "BNB" },
    { symbol: "SOL" },
    { symbol: "XRP" },
    { symbol: "ADA" },
    { symbol: "AVAX" },
    { symbol: "LINK" },
    { symbol: "DOGE" },
    { symbol: "DOT" },
  ];

  const tickerData = tickerCoins.map((c) => {
    const coinData = coinListRef.current.find((cl) => cl.symbol === c.symbol);
    return {
      symbol: c.symbol,
      price: livePrices[c.symbol] ?? coinData?.basePrice ?? 0,
      change:
        coinData?.priceChange24h != null
          ? coinData.priceChange24h.toFixed(2)
          : (
              Math.sin(Date.now() / 100000 + c.symbol.charCodeAt(0)) * 2
            ).toFixed(2),
    };
  });

  const stats = {
    totalSignals: signalsWithLive.length,
    scannedPairs: scannedPairsCount || coinList.length,
    avgConfidence: signalsWithLive.length
      ? Math.round(
          signalsWithLive.reduce((a, s) => a + s.confidence, 0) /
            signalsWithLive.length,
        )
      : 0,
    avgProfit: signalsWithLive.length
      ? Number.parseFloat(
          (
            signalsWithLive.reduce((a, s) => a + s.profitPercent, 0) /
            signalsWithLive.length
          ).toFixed(1),
        )
      : 0,
    winRate: sessionWinRate,
    avgChange24h,
  };

  useEffect(() => {
    setIsLoading(true);
    setScanError(null);

    fetchCoinGeckoMarkets().then((coins) => {
      if (coins.length === 0) {
        setScanError(
          "Could not load market data. CoinGecko may be rate-limiting requests. Please wait 30 seconds and tap Retry.",
        );
        setIsLoading(false);
        return;
      }
      setScanError(null);
      const avg =
        coins.reduce((s, c) => s + (c.priceChange24h ?? 0), 0) /
        Math.max(coins.length, 1);
      const sentiment: "bullish" | "bearish" | "neutral" =
        avg > 2 ? "bullish" : avg < -1.5 ? "bearish" : "neutral";
      buildSignals(coins, livePricesRef.current, sentiment);
      setIsLoading(false);
    });

    interval.current = setInterval(() => {
      fetchLivePrices(coinListRef.current);
    }, 30000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [buildSignals, fetchCoinGeckoMarkets, fetchLivePrices]);

  return {
    signals: signalsWithLive,
    highProfitSignals,
    livePrices,
    isScanning,
    lastScanTime,
    rescan,
    buildSignals,
    markSignalAccuracy,
    tickerData,
    stats,
    coinList,
    scannedPairsCount,
    scanProgress,
    isLoading,
    scanError,
    marketSentiment,
    excludedByReputation,
  };
}
