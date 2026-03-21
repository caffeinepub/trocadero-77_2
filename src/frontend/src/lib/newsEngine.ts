// ============================================================
// Trocadero 77 -- News Engine
// Fetches crypto news and computes per-coin sentiment
// ============================================================

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: number;
  sentiment: number; // -1 (very negative) to +1 (very positive)
  coins: string[]; // affected coin symbols e.g. ['BTC', 'ETH']
  categories: string[];
}

export interface CoinNewsSentiment {
  symbol: string;
  sentiment: number; // -1 to +1
  newsCount: number;
  topHeadline?: string;
  lastFetched: number;
}

const STORAGE_KEY = "trocadero77_news_cache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface NewsCache {
  items: NewsItem[];
  sentimentMap: Record<string, CoinNewsSentiment>;
  fetchedAt: number;
  marketSentiment: number;
}

let _cache: NewsCache | null = null;

function loadCache(): NewsCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NewsCache;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL) return null; // expired
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(cache: NewsCache): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

// Retry helper: retries a fetch up to maxRetries times with delayMs between attempts
async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  maxRetries = 3,
  delayMs = 2000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

// Sentiment keyword scoring
const POSITIVE_KEYWORDS = [
  "surge",
  "rally",
  "bullish",
  "gain",
  "pump",
  "breakout",
  "moon",
  "ath",
  "partnership",
  "adoption",
  "upgrade",
  "launch",
  "listing",
  "approved",
  "all-time high",
  "record",
  "institutional",
  "buy",
  "growth",
  "accumulate",
  "positive",
  "profit",
  "win",
  "strong",
  "recovery",
  "rebound",
  "rise",
  "soar",
  "milestone",
  "integration",
  "mainnet",
];

const NEGATIVE_KEYWORDS = [
  "crash",
  "dump",
  "bearish",
  "drop",
  "fall",
  "plunge",
  "hack",
  "exploit",
  "scam",
  "fraud",
  "ban",
  "regulation",
  "lawsuit",
  "sec",
  "delist",
  "rug",
  "liquidation",
  "sell-off",
  "collapse",
  "warning",
  "risk",
  "concern",
  "vulnerable",
  "loss",
  "decline",
  "fear",
  "panic",
  "investigation",
  "suspended",
  "insolvent",
  "bankruptcy",
];

const HIGH_IMPACT_NEGATIVE = [
  "hack",
  "exploit",
  "rug",
  "scam",
  "fraud",
  "bankruptcy",
  "insolvent",
  "ban",
];
const HIGH_IMPACT_POSITIVE = [
  "ath",
  "all-time high",
  "approved",
  "institutional",
  "mainnet",
  "record",
];

function scoreSentiment(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

  // High impact keywords have double weight
  for (const kw of HIGH_IMPACT_POSITIVE) {
    if (lower.includes(kw)) score += 0.4;
  }
  for (const kw of HIGH_IMPACT_NEGATIVE) {
    if (lower.includes(kw)) score -= 0.5;
  }

  // Regular keywords
  for (const kw of POSITIVE_KEYWORDS) {
    if (lower.includes(kw)) score += 0.15;
  }
  for (const kw of NEGATIVE_KEYWORDS) {
    if (lower.includes(kw)) score -= 0.15;
  }

  return Math.max(-1, Math.min(1, score));
}

function extractCoinsFromText(text: string, knownSymbols: string[]): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  // Common coin name mappings
  const NAME_MAP: Record<string, string> = {
    bitcoin: "BTC",
    ethereum: "ETH",
    solana: "SOL",
    cardano: "ADA",
    ripple: "XRP",
    dogecoin: "DOGE",
    polkadot: "DOT",
    avalanche: "AVAX",
    chainlink: "LINK",
    uniswap: "UNI",
    litecoin: "LTC",
    polygon: "MATIC",
    shiba: "SHIB",
    binance: "BNB",
    tron: "TRX",
    cosmos: "ATOM",
    near: "NEAR",
    algo: "ALGO",
    algorand: "ALGO",
    stellar: "XLM",
    monero: "XMR",
    aave: "AAVE",
    maker: "MKR",
    compound: "COMP",
    injective: "INJ",
    arbitrum: "ARB",
    optimism: "OP",
    aptos: "APT",
    sui: "SUI",
    pepe: "PEPE",
    floki: "FLOKI",
    bonk: "BONK",
  };

  for (const [name, sym] of Object.entries(NAME_MAP)) {
    if (lower.includes(name)) found.add(sym);
  }

  // Check for ticker symbols (e.g. $BTC or uppercase words matching known symbols)
  const tickerMatches = text.match(/\$([A-Z]{2,6})|\b([A-Z]{2,6})\b/g) || [];
  for (const match of tickerMatches) {
    const sym = match.replace("$", "");
    if (knownSymbols.includes(sym)) found.add(sym);
  }

  return Array.from(found);
}

// Fetch news from CryptoCompare (no API key needed for basic access)
async function fetchCryptoCompareNews(): Promise<
  Array<{
    title: string;
    url: string;
    source: string;
    publishedAt: number;
    body: string;
  }>
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetchWithRetry(() =>
      fetch(
        "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest",
        { signal: controller.signal },
      ),
    );
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.Data) return [];
    return (
      data.Data as Array<{
        title: string;
        url: string;
        source_info: { name: string };
        published_on: number;
        body: string;
      }>
    )
      .slice(0, 30)
      .map((item) => ({
        title: item.title,
        url: item.url,
        source: item.source_info?.name || "CryptoCompare",
        publishedAt: item.published_on * 1000,
        body: item.body || "",
      }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

// Fallback: use CoinGecko trending + search for sentiment signals
async function fetchCoinGeckoTrending(): Promise<
  Array<{
    title: string;
    url: string;
    source: string;
    publishedAt: number;
    body: string;
  }>
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetchWithRetry(() =>
      fetch("https://api.coingecko.com/api/v3/search/trending", {
        signal: controller.signal,
      }),
    );
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    // Convert trending coins to pseudo-news items
    const trending = (data.coins || []) as Array<{
      item: { symbol: string; name: string; market_cap_rank: number };
    }>;
    return trending.map(({ item }) => ({
      title: `${item.name} (${item.symbol.toUpperCase()}) is trending on CoinGecko`,
      url: `https://www.coingecko.com/en/coins/${item.name.toLowerCase().replace(/\s/g, "-")}`,
      source: "CoinGecko Trending",
      publishedAt: Date.now(),
      body: `${item.name} is among the most searched cryptocurrencies right now. Market cap rank: #${item.market_cap_rank || "N/A"}.`,
    }));
  } catch {
    clearTimeout(timeout);
    return [];
  }
}

export async function fetchAndCacheNews(
  knownSymbols: string[] = [],
): Promise<NewsCache> {
  // Return cached if fresh
  const cached = loadCache();
  if (cached) {
    _cache = cached;
    return cached;
  }

  // Fetch from both sources
  const [ccNews, cgTrending] = await Promise.allSettled([
    fetchCryptoCompareNews(),
    fetchCoinGeckoTrending(),
  ]);

  const rawItems = [
    ...(ccNews.status === "fulfilled" ? ccNews.value : []),
    ...(cgTrending.status === "fulfilled" ? cgTrending.value : []),
  ];

  // Process into NewsItems with sentiment
  const newsItems: NewsItem[] = rawItems.map((raw) => {
    const fullText = `${raw.title} ${raw.body}`;
    const sentiment = scoreSentiment(fullText);
    const coins = extractCoinsFromText(fullText, knownSymbols);
    return {
      title: raw.title,
      url: raw.url,
      source: raw.source,
      publishedAt: raw.publishedAt,
      sentiment,
      coins,
      categories: [],
    };
  });

  // Build per-coin sentiment map (only consider news from last 6 hours)
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  const sentimentMap: Record<string, CoinNewsSentiment> = {};

  for (const item of newsItems) {
    if (item.publishedAt < cutoff) continue;
    for (const symbol of item.coins) {
      const existing = sentimentMap[symbol];
      if (existing) {
        existing.sentiment =
          (existing.sentiment * existing.newsCount + item.sentiment) /
          (existing.newsCount + 1);
        existing.newsCount++;
        if (!existing.topHeadline) existing.topHeadline = item.title;
      } else {
        sentimentMap[symbol] = {
          symbol,
          sentiment: item.sentiment,
          newsCount: 1,
          topHeadline: item.title,
          lastFetched: Date.now(),
        };
      }
    }
  }

  // Overall market sentiment (average of all recent news)
  const recentNews = newsItems.filter((n) => n.publishedAt >= cutoff);
  const marketSentiment =
    recentNews.length > 0
      ? recentNews.reduce((s, n) => s + n.sentiment, 0) / recentNews.length
      : 0;

  const cache: NewsCache = {
    items: newsItems.slice(0, 20), // Keep top 20 for display
    sentimentMap,
    fetchedAt: Date.now(),
    marketSentiment,
  };

  saveCache(cache);
  _cache = cache;
  return cache;
}

export function getCoinSentiment(symbol: string): number {
  if (!_cache) {
    const cached = loadCache();
    if (cached) _cache = cached;
  }
  if (!_cache) return 0;
  return _cache.sentimentMap[symbol]?.sentiment ?? 0;
}

export function getCoinNewsBadge(
  symbol: string,
): "positive" | "negative" | "trending" | null {
  if (!_cache) return null;
  const item = _cache.sentimentMap[symbol];
  if (!item) return null;
  if (item.sentiment > 0.3) return "positive";
  if (item.sentiment < -0.2) return "negative";
  // Check if it's trending
  const trendingItem = _cache.items.find(
    (n) => n.coins.includes(symbol) && n.source === "CoinGecko Trending",
  );
  if (trendingItem) return "trending";
  return null;
}

export function getLatestNewsItems(limit = 8): NewsItem[] {
  if (!_cache) {
    const cached = loadCache();
    if (cached) _cache = cached;
  }
  if (!_cache) return [];
  return _cache.items.slice(0, limit);
}

export function getMarketSentiment(): number {
  if (!_cache) {
    const cached = loadCache();
    if (cached) _cache = cached;
  }
  return _cache?.marketSentiment ?? 0;
}
