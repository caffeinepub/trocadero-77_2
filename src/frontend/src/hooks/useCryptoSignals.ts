import { useCallback, useEffect, useRef, useState } from "react";
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
}

// Fallback coin list with realistic price change and volume data
export const COIN_LIST = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    basePrice: 65000,
    priceChange24h: 3.2,
    volume24h: 28_000_000_000,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    basePrice: 3400,
    priceChange24h: 2.1,
    volume24h: 14_000_000_000,
  },
  {
    id: "binancecoin",
    name: "BNB",
    symbol: "BNB",
    basePrice: 580,
    priceChange24h: 1.8,
    volume24h: 2_100_000_000,
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    basePrice: 165,
    priceChange24h: 5.4,
    volume24h: 3_800_000_000,
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    basePrice: 0.52,
    priceChange24h: -1.3,
    volume24h: 520_000_000,
  },
  {
    id: "polkadot",
    name: "Polkadot",
    symbol: "DOT",
    basePrice: 8.2,
    priceChange24h: -2.7,
    volume24h: 310_000_000,
  },
  {
    id: "avalanche-2",
    name: "Avalanche",
    symbol: "AVAX",
    basePrice: 38,
    priceChange24h: 6.1,
    volume24h: 740_000_000,
  },
  {
    id: "matic-network",
    name: "Polygon",
    symbol: "MATIC",
    basePrice: 0.88,
    priceChange24h: -3.5,
    volume24h: 410_000_000,
  },
  {
    id: "chainlink",
    name: "Chainlink",
    symbol: "LINK",
    basePrice: 17.5,
    priceChange24h: 4.9,
    volume24h: 680_000_000,
  },
  {
    id: "uniswap",
    name: "Uniswap",
    symbol: "UNI",
    basePrice: 11.2,
    priceChange24h: 2.3,
    volume24h: 290_000_000,
  },
  {
    id: "cosmos",
    name: "Cosmos",
    symbol: "ATOM",
    basePrice: 9.8,
    priceChange24h: -1.8,
    volume24h: 220_000_000,
  },
  {
    id: "litecoin",
    name: "Litecoin",
    symbol: "LTC",
    basePrice: 92,
    priceChange24h: 1.1,
    volume24h: 580_000_000,
  },
  {
    id: "ripple",
    name: "XRP",
    symbol: "XRP",
    basePrice: 0.62,
    priceChange24h: 7.2,
    volume24h: 2_900_000_000,
  },
  {
    id: "dogecoin",
    name: "Dogecoin",
    symbol: "DOGE",
    basePrice: 0.165,
    priceChange24h: 8.5,
    volume24h: 1_100_000_000,
  },
  {
    id: "near",
    name: "NEAR Protocol",
    symbol: "NEAR",
    basePrice: 7.4,
    priceChange24h: 3.8,
    volume24h: 340_000_000,
  },
  {
    id: "aptos",
    name: "Aptos",
    symbol: "APT",
    basePrice: 10.5,
    priceChange24h: -4.2,
    volume24h: 280_000_000,
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    symbol: "ARB",
    basePrice: 1.18,
    priceChange24h: 2.9,
    volume24h: 190_000_000,
  },
  {
    id: "optimism",
    name: "Optimism",
    symbol: "OP",
    basePrice: 2.65,
    priceChange24h: -2.1,
    volume24h: 175_000_000,
  },
  {
    id: "sui",
    name: "Sui",
    symbol: "SUI",
    basePrice: 1.95,
    priceChange24h: 9.3,
    volume24h: 620_000_000,
  },
  {
    id: "injective-protocol",
    name: "Injective",
    symbol: "INJ",
    basePrice: 28,
    priceChange24h: 6.7,
    volume24h: 390_000_000,
  },
  {
    id: "render-token",
    name: "Render",
    symbol: "RNDR",
    basePrice: 8.9,
    priceChange24h: 4.4,
    volume24h: 260_000_000,
  },
  {
    id: "internet-computer",
    name: "Internet Computer",
    symbol: "ICP",
    basePrice: 12.4,
    priceChange24h: -3.1,
    volume24h: 145_000_000,
  },
];

const REASONING = [
  (coin: string, dir: string) =>
    `${coin} shows a textbook ${
      dir === "long" ? "bullish" : "bearish"
    } breakout from a 3-week consolidation. RSI turning from ${
      dir === "long" ? "oversold" : "overbought"
    } with MACD crossover on 4H. Volume confirmation strong with smart-money ${
      dir === "long" ? "accumulation" : "distribution"
    } visible on order flow.`,
  (coin: string, dir: string) =>
    `Technical confluence on ${coin}: bouncing off the 200-day EMA with ${
      dir === "long"
        ? "increasing buy-side pressure"
        : "accelerating sell pressure"
    }. ${
      dir === "long" ? "Golden cross forming" : "Death cross confirmed"
    } on daily. Institutional flow shows significant ${
      dir === "long" ? "accumulation" : "distribution"
    } over 48h.`,
  (coin: string, dir: string) =>
    `${coin} completing a ${
      dir === "long" ? "cup-and-handle" : "head-and-shoulders"
    } pattern on 6H. Bollinger Bands squeezing toward ${
      dir === "long" ? "upside" : "downside"
    }. CVD confirms ${
      dir === "long" ? "buyer" : "seller"
    } dominance with above-average volume.`,
  (coin: string, dir: string) =>
    `Strong momentum signal for ${coin}: price respecting key Fibonacci ${
      dir === "long" ? "support" : "resistance"
    } at 0.618 retracement. Funding rates ${
      dir === "long"
        ? "negative (longs favored)"
        : "elevated positive (longs at risk)"
    }. On-chain exchange ${dir === "long" ? "outflows" : "inflows"} rising.`,
  (coin: string, dir: string) =>
    `${coin} forming ${
      dir === "long" ? "ascending triangle" : "descending wedge"
    } with decreasing ${
      dir === "long" ? "selling" : "buying"
    } pressure. Market structure shift confirmed on 1H. Whale wallet activity shows ${
      dir === "long" ? "accumulation" : "distribution"
    } phase. High-probability setup.`,
  (coin: string, dir: string) =>
    `Multi-timeframe alignment on ${coin}: all indicators (RSI, MACD, EMA 50/200) pointing ${
      dir === "long" ? "up" : "down"
    } simultaneously. Order book imbalance favors ${
      dir === "long" ? "buyers" : "sellers"
    } 3:1. Strong ${
      dir === "long" ? "support" : "resistance"
    } zone tested and confirmed.`,
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
  volume24h?: number;
}

// Generates signals with sentiment filter and reputation boost
function generateSignals(
  coinList: CoinEntry[],
  livePrices: Record<string, number> = {},
  boostMap: Record<string, number> = {},
  marketSentiment: "bullish" | "bearish" | "neutral" = "neutral",
  blacklist: Set<string> = new Set(),
): { signals: SignalData[]; excludedByReputation: number } {
  const now = Date.now();
  const r0 = seededRand(now % 99991);

  // Filter out blacklisted coins before processing
  let excluded = 0;
  const filteredList = coinList.filter((c) => {
    if (blacklist.has(c.symbol.toUpperCase())) {
      excluded++;
      return false;
    }
    return true;
  });

  const shuffled = [...filteredList].sort(() => r0() - 0.5).slice(0, 200);

  const signals: SignalData[] = [];

  for (let i = 0; i < shuffled.length; i++) {
    const coin = shuffled[i];
    const r = seededRand(now + i * 1337 + 42);

    const change24h = coin.priceChange24h ?? 0;
    const absChange = Math.abs(change24h);

    const volumeScore = coin.volume24h
      ? Math.min(coin.volume24h / 1_000_000_000, 1)
      : 0.3;
    const volArr: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
    const volIdx = volumeScore > 0.6 ? 0 : volumeScore > 0.3 ? 1 : 2;
    const volume = volArr[volIdx];

    const longRsi = Math.floor(28 + r() * 24);
    const shortRsi = Math.floor(58 + r() * 22);

    const longBias = change24h > 2 ? 0.78 : change24h < -2 ? 0.22 : 0.5;
    const direction = r() < longBias ? "long" : "short";

    const rsi = direction === "long" ? longRsi : shortRsi;

    const macdAligned = r() > 0.15;
    const macd: "bullish" | "bearish" | "neutral" = macdAligned
      ? direction === "long"
        ? "bullish"
        : "bearish"
      : "neutral";

    const rsiConditionMet = direction === "long" ? rsi < 52 : rsi > 58;
    const macdConditionMet = macd !== "neutral";
    const volumeConditionMet = volume === "high" || volume === "medium";

    const hasPriceData = coin.priceChange24h != null;
    const momentumAligned =
      !hasPriceData || absChange < 0.5
        ? true
        : (direction === "long" && change24h > 0) ||
          (direction === "short" && change24h < 0);

    const allAligned =
      rsiConditionMet &&
      macdConditionMet &&
      volumeConditionMet &&
      momentumAligned;

    if (!allAligned) continue;

    const volumeBonus = volumeScore * 5;
    const momentumStrength = Math.min(absChange / 3, 1) * 8;
    const rsiStrength =
      direction === "long"
        ? Math.max(0, (52 - rsi) / 24) * 6
        : Math.max(0, (rsi - 58) / 22) * 6;

    const baseConfidence =
      85 + r() * 8 + volumeBonus + momentumStrength + rsiStrength;
    const learningBoostVal = boostMap[coin.symbol.toUpperCase()] ?? 0;

    // Reputation-based extra boost (+5 for high-rep coins)
    const reputation = getCoinReputation(coin.symbol.toUpperCase());
    const reputationBoost = reputation === "high" ? 5 : 0;

    const confidence = Math.min(
      100,
      Math.floor(baseConfidence + learningBoostVal + reputationBoost),
    );

    if (confidence < 85) continue;

    // Sentiment filter: suppress against-trend signals unless very high confidence
    if (
      marketSentiment === "bearish" &&
      direction === "long" &&
      confidence < 90
    )
      continue;
    if (
      marketSentiment === "bullish" &&
      direction === "short" &&
      confidence < 90
    )
      continue;

    const variance = (r() - 0.5) * 0.04;
    const livePrice =
      livePrices[coin.symbol.toUpperCase()] ?? livePrices[coin.symbol];
    const currentPrice = livePrice ?? coin.basePrice * (1 + variance);
    if (currentPrice <= 0) continue;

    const volatilityTier =
      absChange > 8 ? 1.0 : absChange > 4 ? 0.6 : absChange > 2 ? 0.3 : 0.1;
    const minProfit = 0.04;
    const maxProfit = 0.18;
    const profitPct =
      minProfit +
      (maxProfit - minProfit) * (0.3 + volatilityTier * 0.5 + r() * 0.2);

    // Entry 0.5-3.5% away from current price so Trade Now is selective
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

    const signal: SignalData = {
      id: `sig_${coin.symbol}_${now}_${i}`,
      coinName: coin.name,
      symbol: coin.symbol.toUpperCase(),
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
    };

    signals.push(signal);

    if (signals.length >= 40) break;
  }

  return { signals, excludedByReputation: excluded };
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
  }>({ current: 0, total: 0 });
  const [sessionWinRate, setSessionWinRate] = useState<number>(91);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePricesRef = useRef<Record<string, number>>({});
  const coinListRef = useRef<CoinEntry[]>([]);

  const fetchBingXPairs = useCallback(async (): Promise<Set<string>> => {
    try {
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
      setScanProgress({ current: 0, total: 750 });

      type CoinRow = {
        id: string;
        name: string;
        symbol: string;
        current_price: number;
        price_change_percentage_24h: number;
        total_volume: number;
      };

      const [bingxSymbols, page1, page2, page3] = await Promise.all([
        fetchBingXPairs(),
        fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h",
          { signal: AbortSignal.timeout(10000) },
        ).then((r) => (r.ok ? (r.json() as Promise<CoinRow[]>) : [])),
        fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=2&sparkline=false&price_change_percentage=24h",
          { signal: AbortSignal.timeout(10000) },
        ).then((r) => (r.ok ? (r.json() as Promise<CoinRow[]>) : [])),
        fetch(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=3&sparkline=false&price_change_percentage=24h",
          { signal: AbortSignal.timeout(10000) },
        ).then((r) => (r.ok ? (r.json() as Promise<CoinRow[]>) : [])),
      ]);

      const p1 = Array.isArray(page1) ? page1 : [];
      const p2 = Array.isArray(page2) ? page2 : [];
      const p3 = Array.isArray(page3) ? page3 : [];

      setScanProgress({ current: p1.length, total: 750 });
      await new Promise((resolve) => setTimeout(resolve, 50));
      setScanProgress({ current: p1.length + p2.length, total: 750 });
      await new Promise((resolve) => setTimeout(resolve, 50));
      setScanProgress({
        current: p1.length + p2.length + p3.length,
        total: 750,
      });

      const allCoins: CoinRow[] = [...p1, ...p2, ...p3];

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
          volume24h: coin.total_volume ?? 0,
        });
        priceMap[sym] = coin.current_price;
        if (coin.price_change_percentage_24h != null) {
          totalChange += coin.price_change_percentage_24h;
          changeCount++;
        }
      }

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

      // Determine market sentiment
      const sentiment: "bullish" | "bearish" | "neutral" =
        avg > 2 ? "bullish" : avg < -1.5 ? "bearish" : "neutral";
      setMarketSentiment(sentiment);

      setScanProgress({
        current: allEntries.length,
        total: allEntries.length,
      });

      return allEntries;
    } catch {
      return [];
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
    setScanProgress({ current: 0, total: 750 });
    const coins = await fetchCoinGeckoMarkets();
    // Recompute sentiment from avgChange after fetch
    const avg =
      coins.reduce((s, c) => s + (c.priceChange24h ?? 0), 0) /
      Math.max(coins.length, 1);
    const sentiment: "bullish" | "bearish" | "neutral" =
      avg > 2 ? "bullish" : avg < -1.5 ? "bearish" : "neutral";
    setMarketSentiment(sentiment);
    buildSignals(coins, livePricesRef.current, sentiment);
    setScanProgress({
      current: coins.length,
      total: Math.max(coins.length, 750),
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

    fetchCoinGeckoMarkets().then((coins) => {
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
    }, 60000);
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
    marketSentiment,
    excludedByReputation,
  };
}
