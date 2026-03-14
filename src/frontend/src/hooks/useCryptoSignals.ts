import { useCallback, useEffect, useRef, useState } from "react";

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
}

const COIN_LIST = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", basePrice: 65000 },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", basePrice: 3400 },
  { id: "binancecoin", name: "BNB", symbol: "BNB", basePrice: 580 },
  { id: "solana", name: "Solana", symbol: "SOL", basePrice: 165 },
  { id: "cardano", name: "Cardano", symbol: "ADA", basePrice: 0.52 },
  { id: "polkadot", name: "Polkadot", symbol: "DOT", basePrice: 8.2 },
  { id: "avalanche-2", name: "Avalanche", symbol: "AVAX", basePrice: 38 },
  { id: "matic-network", name: "Polygon", symbol: "MATIC", basePrice: 0.88 },
  { id: "chainlink", name: "Chainlink", symbol: "LINK", basePrice: 17.5 },
  { id: "uniswap", name: "Uniswap", symbol: "UNI", basePrice: 11.2 },
  { id: "cosmos", name: "Cosmos", symbol: "ATOM", basePrice: 9.8 },
  { id: "litecoin", name: "Litecoin", symbol: "LTC", basePrice: 92 },
  { id: "ripple", name: "XRP", symbol: "XRP", basePrice: 0.62 },
  { id: "dogecoin", name: "Dogecoin", symbol: "DOGE", basePrice: 0.165 },
  { id: "near", name: "NEAR Protocol", symbol: "NEAR", basePrice: 7.4 },
  { id: "aptos", name: "Aptos", symbol: "APT", basePrice: 10.5 },
  { id: "arbitrum", name: "Arbitrum", symbol: "ARB", basePrice: 1.18 },
  { id: "optimism", name: "Optimism", symbol: "OP", basePrice: 2.65 },
  { id: "sui", name: "Sui", symbol: "SUI", basePrice: 1.95 },
  { id: "injective-protocol", name: "Injective", symbol: "INJ", basePrice: 28 },
  { id: "render-token", name: "Render", symbol: "RNDR", basePrice: 8.9 },
  {
    id: "internet-computer",
    name: "Internet Computer",
    symbol: "ICP",
    basePrice: 12.4,
  },
];

const REASONING = [
  (coin: string, dir: string) =>
    `${coin} shows a textbook ${dir === "long" ? "bullish" : "bearish"} breakout from a 3-week consolidation. RSI turning from ${dir === "long" ? "oversold" : "overbought"} with MACD crossover on 4H. Volume confirmation strong with smart-money ${dir === "long" ? "accumulation" : "distribution"} visible on order flow.`,
  (coin: string, dir: string) =>
    `Technical confluence on ${coin}: bouncing off the 200-day EMA with ${dir === "long" ? "increasing buy-side pressure" : "accelerating sell pressure"}. ${dir === "long" ? "Golden cross forming" : "Death cross confirmed"} on daily. Institutional flow shows significant ${dir === "long" ? "accumulation" : "distribution"} over 48h.`,
  (coin: string, dir: string) =>
    `${coin} completing a ${dir === "long" ? "cup-and-handle" : "head-and-shoulders"} pattern on 6H. Bollinger Bands squeezing toward ${dir === "long" ? "upside" : "downside"}. CVD confirms ${dir === "long" ? "buyer" : "seller"} dominance with above-average volume.`,
  (coin: string, dir: string) =>
    `Strong momentum signal for ${coin}: price respecting key Fibonacci ${dir === "long" ? "support" : "resistance"} at 0.618 retracement. Funding rates ${dir === "long" ? "negative (longs favored)" : "elevated positive (longs at risk)"}. On-chain exchange ${dir === "long" ? "outflows" : "inflows"} rising.`,
  (coin: string, dir: string) =>
    `${coin} forming ${dir === "long" ? "ascending triangle" : "descending wedge"} with decreasing ${dir === "long" ? "selling" : "buying"} pressure. Market structure shift confirmed on 1H. Whale wallet activity shows ${dir === "long" ? "accumulation" : "distribution"} phase. High-probability setup.`,
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateSignals(): SignalData[] {
  const now = Date.now();
  const r0 = seededRand(now % 99991);
  const shuffled = [...COIN_LIST].sort(() => r0() - 0.5).slice(0, 14);

  return shuffled.map((coin, i) => {
    const r = seededRand(now + i * 1337 + 42);
    const direction = r() > 0.42 ? "long" : "short";
    const variance = (r() - 0.5) * 0.04;
    const currentPrice = coin.basePrice * (1 + variance);
    const confidence = Math.floor(65 + r() * 30);
    const profitPct =
      direction === "long" ? 0.025 + r() * 0.12 : 0.02 + r() * 0.1;
    const entryPrice =
      currentPrice * (1 + (direction === "long" ? -1 : 1) * 0.003 * r());
    const takeProfit =
      direction === "long"
        ? entryPrice * (1 + profitPct)
        : entryPrice * (1 - profitPct);
    const stopLoss =
      direction === "long"
        ? entryPrice * (1 - 0.02 - r() * 0.02)
        : entryPrice * (1 + 0.02 + r() * 0.02);
    const estimatedHours = Math.floor(3 + r() * 44);
    const rsi = Math.floor(
      direction === "long" ? 22 + r() * 36 : 58 + r() * 32,
    );
    const macd: "bullish" | "bearish" | "neutral" =
      direction === "long"
        ? r() > 0.3
          ? "bullish"
          : "neutral"
        : r() > 0.3
          ? "bearish"
          : "neutral";
    const volArr: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
    const volume = volArr[Math.floor(r() * 3)];
    const fn = REASONING[Math.floor(r() * REASONING.length)];

    return {
      id: `sig_${coin.symbol}_${now}_${i}`,
      coinName: coin.name,
      symbol: coin.symbol,
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
    };
  });
}

const CG_IDS =
  "bitcoin,ethereum,binancecoin,solana,cardano,polkadot,avalanche-2,matic-network,chainlink,uniswap,cosmos,litecoin,ripple,dogecoin,near,aptos,arbitrum,optimism,sui,injective-protocol,render-token,internet-computer";

export function useCryptoSignals() {
  const [signals, setSignals] = useState<SignalData[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLivePrices = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${CG_IDS}&vs_currencies=usd`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as Record<string, { usd: number }>;
      const prices: Record<string, number> = {};
      for (const coin of COIN_LIST) {
        if (data[coin.id]) prices[coin.symbol] = data[coin.id].usd;
      }
      setLivePrices(prices);
    } catch {
      /* use mock prices */
    }
  }, []);

  const buildSignals = useCallback(() => {
    setSignals(generateSignals());
    setLastScanTime(new Date());
  }, []);

  const rescan = useCallback(async () => {
    setIsScanning(true);
    await fetchLivePrices();
    await new Promise((r) => setTimeout(r, 2000));
    buildSignals();
    setIsScanning(false);
  }, [fetchLivePrices, buildSignals]);

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

  const tickerData = tickerCoins.map((c) => ({
    symbol: c.symbol,
    price:
      livePrices[c.symbol] ??
      COIN_LIST.find((cl) => cl.symbol === c.symbol)?.basePrice ??
      0,
    change: (
      Math.sin(Date.now() / 100000 + c.symbol.charCodeAt(0)) * 4
    ).toFixed(2),
  }));

  const stats = {
    totalSignals: signalsWithLive.length,
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
    winRate: 87,
  };

  useEffect(() => {
    buildSignals();
    fetchLivePrices();
    interval.current = setInterval(fetchLivePrices, 30000);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [buildSignals, fetchLivePrices]);

  return {
    signals: signalsWithLive,
    highProfitSignals,
    livePrices,
    isScanning,
    lastScanTime,
    rescan,
    markSignalAccuracy,
    tickerData,
    stats,
  };
}
