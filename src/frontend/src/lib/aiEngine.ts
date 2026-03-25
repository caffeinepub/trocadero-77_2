// ============================================================
// Trocadero 77 -- AI Trading Engine
// Fully autonomous learning system for maximum TP hit rate
// BUY-biased, tight TP, high certainty filter
// ============================================================

export interface SignalIndicators {
  rsi: number;
  macd: number; // positive = bullish, negative = bearish
  macdSignal: number;
  volume24h: number;
  priceChange24h: number;
  priceChange1h?: number;
  marketCap?: number;
  symbol: string;
  category?: string;
  entryPrice: number;
  tp: number;
  sl: number;
  signalType: "BUY" | "SELL";
  timestamp: number;
}

export interface TradeOutcome {
  symbol: string;
  signalType: "BUY" | "SELL";
  result: "WIN" | "LOSS";
  rsiAtEntry: number;
  macdAtEntry: number;
  volumeAtEntry: number;
  priceChange24hAtEntry: number;
  hourOfDay: number;
  category: string;
  confidenceAtEntry: number;
  tpProbabilityAtEntry: number;
  timestamp: number;
  holdDurationMs: number;
}

export interface AILesson {
  id: string;
  timestamp: number;
  symbol: string;
  direction: "long" | "short";
  result: "WIN" | "LOSS";
  rsi: number;
  macdState: string;
  volumeLevel: string;
  hourOfDay: number;
  insight: string;
  weightAdjustments: Record<string, number>;
}

export interface AIChangeLogEntry {
  id: string;
  timestamp: number;
  type:
    | "threshold_adjust"
    | "coin_blacklist"
    | "coin_boost"
    | "lesson_applied"
    | "circuit_breaker";
  description: string;
  before?: number | string;
  after?: number | string;
}

export interface FeatureWeights {
  rsiWeight: number;
  macdWeight: number;
  volumeWeight: number;
  momentumWeight: number;
  newsWeight: number;
}

export interface AIState {
  coinReputation: Record<
    string,
    { wins: number; total: number; lastLoss: number }
  >;
  patternWeights: {
    rsiRanges: Record<string, { wins: number; total: number }>;
    macdBullish: { wins: number; total: number };
    macdBearish: { wins: number; total: number };
    highVolume: { wins: number; total: number };
    lowVolume: { wins: number; total: number };
    strongUptrend: { wins: number; total: number };
    weakUptrend: { wins: number; total: number };
  };
  hourlyStats: Record<number, { wins: number; total: number }>;
  categoryStats: Record<string, { wins: number; total: number }>;
  currentThreshold: number;
  recentOutcomes: TradeOutcome[];
  consecutiveLosses: number;
  circuitBreakerUntil: number;
  totalLearned: number;
  marketPhase: "BULL" | "BEAR" | "SIDEWAYS";
  marketPhaseConfidence: number;
  filteredCoins: number;
  lastUpdated: number;
  featureWeights: FeatureWeights;
}

const STORAGE_KEY = "trocadero77_ai_state";
const LESSONS_KEY = "t77_lessons";
const CHANGELOG_KEY = "t77_changelog";
const MAX_OUTCOMES = 500;
const MAX_LESSONS = 200;
const MAX_CHANGELOG = 200;

function defaultFeatureWeights(): FeatureWeights {
  return {
    rsiWeight: 1.0,
    macdWeight: 1.0,
    volumeWeight: 1.0,
    momentumWeight: 1.0,
    newsWeight: 1.0,
  };
}

function defaultState(): AIState {
  return {
    coinReputation: {},
    patternWeights: {
      rsiRanges: {},
      macdBullish: { wins: 0, total: 0 },
      macdBearish: { wins: 0, total: 0 },
      highVolume: { wins: 0, total: 0 },
      lowVolume: { wins: 0, total: 0 },
      strongUptrend: { wins: 0, total: 0 },
      weakUptrend: { wins: 0, total: 0 },
    },
    hourlyStats: {},
    categoryStats: {},
    currentThreshold: 85,
    recentOutcomes: [],
    consecutiveLosses: 0,
    circuitBreakerUntil: 0,
    totalLearned: 0,
    marketPhase: "SIDEWAYS",
    marketPhaseConfidence: 50,
    filteredCoins: 0,
    lastUpdated: Date.now(),
    featureWeights: defaultFeatureWeights(),
  };
}

function loadState(): AIState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AIState;
    return {
      ...defaultState(),
      ...parsed,
      featureWeights: {
        ...defaultFeatureWeights(),
        ...(parsed.featureWeights ?? {}),
      },
    };
  } catch {
    return defaultState();
  }
}

function saveState(state: AIState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    state.recentOutcomes = state.recentOutcomes.slice(-100);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
}

let _state: AIState | null = null;

export function getAIState(): AIState {
  if (!_state) _state = loadState();
  return _state;
}

// ---------------------------------------------------------------
// LESSONS SYSTEM
// ---------------------------------------------------------------
export function getLessons(): AILesson[] {
  try {
    const raw = localStorage.getItem(LESSONS_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as AILesson[]).slice(0, 50);
  } catch {
    return [];
  }
}

function saveLessons(lessons: AILesson[]): void {
  try {
    localStorage.setItem(
      LESSONS_KEY,
      JSON.stringify(lessons.slice(0, MAX_LESSONS)),
    );
  } catch {
    /* ignore */
  }
}

export function getChangeLog(): AIChangeLogEntry[] {
  try {
    const raw = localStorage.getItem(CHANGELOG_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as AIChangeLogEntry[]).slice(0, 100);
  } catch {
    return [];
  }
}

function saveChangeLog(entries: AIChangeLogEntry[]): void {
  try {
    localStorage.setItem(
      CHANGELOG_KEY,
      JSON.stringify(entries.slice(0, MAX_CHANGELOG)),
    );
  } catch {
    /* ignore */
  }
}

export function addToChangeLog(
  type: AIChangeLogEntry["type"],
  description: string,
  before?: number | string,
  after?: number | string,
): void {
  const entries = getChangeLog();
  entries.unshift({
    id: `cl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    type,
    description,
    before,
    after,
  });
  saveChangeLog(entries);
}

export function getFeatureWeights(): FeatureWeights {
  return getAIState().featureWeights;
}

function writeLesson(outcome: TradeOutcome): void {
  const state = getAIState();
  const isWin = outcome.result === "WIN";
  const fw = state.featureWeights;
  const macdState = outcome.macdAtEntry > 0 ? "bullish" : "bearish";
  const volumeLevel =
    outcome.volumeAtEntry > 50_000_000
      ? "high"
      : outcome.volumeAtEntry > 5_000_000
        ? "medium"
        : "low";

  // Build human-readable insight
  let insight = "";
  const adjustments: Record<string, number> = {};

  if (isWin) {
    if (
      outcome.rsiAtEntry >= 35 &&
      outcome.rsiAtEntry <= 55 &&
      macdState === "bullish"
    ) {
      insight = `Strong oversold reversal pattern confirmed. RSI ${outcome.rsiAtEntry} in prime buy zone with MACD bullish alignment.`;
      adjustments.rsiWeight = 0.02;
      fw.rsiWeight = Math.min(2.0, fw.rsiWeight + 0.02);
      adjustments.macdWeight = 0.02;
      fw.macdWeight = Math.min(2.0, fw.macdWeight + 0.02);
    } else if (volumeLevel === "high") {
      insight = `High volume confirmation drove momentum. Volume gate effective at ${(outcome.volumeAtEntry / 1_000_000).toFixed(1)}M USD.`;
      adjustments.volumeWeight = 0.02;
      fw.volumeWeight = Math.min(2.0, fw.volumeWeight + 0.02);
    } else if (outcome.priceChange24hAtEntry > 2) {
      insight = `Positive momentum aligned — 24h change +${outcome.priceChange24hAtEntry.toFixed(1)}% supported entry. Momentum gate validated.`;
      adjustments.momentumWeight = 0.02;
      fw.momentumWeight = Math.min(2.0, fw.momentumWeight + 0.02);
    } else {
      insight = `Successful ${outcome.signalType} trade on ${outcome.symbol}. RSI ${outcome.rsiAtEntry}, MACD ${macdState}. Reinforcing pattern weights.`;
    }
  } else {
    // Loss analysis
    if (outcome.rsiAtEntry > 65) {
      insight = `Overbought entry at RSI ${outcome.rsiAtEntry} led to reversal. Raising RSI sensitivity threshold.`;
      adjustments.rsiWeight = -0.01;
      fw.rsiWeight = Math.max(0.5, fw.rsiWeight - 0.01);
      state.currentThreshold = Math.min(93, state.currentThreshold + 0.5);
      addToChangeLog(
        "threshold_adjust",
        "RSI overbought loss detected. Raised confidence threshold.",
        state.currentThreshold - 0.5,
        state.currentThreshold,
      );
    } else if (macdState === "bearish" && outcome.signalType === "BUY") {
      insight = `MACD bearish crossover at entry for ${outcome.symbol} BUY trade. Strengthening MACD gate.`;
      adjustments.macdWeight = -0.01;
      fw.macdWeight = Math.max(0.5, fw.macdWeight - 0.01);
    } else if (volumeLevel === "low") {
      insight = `Low volume (${(outcome.volumeAtEntry / 1_000_000).toFixed(1)}M) led to insufficient momentum. Tightening volume requirement.`;
      adjustments.volumeWeight = 0.01;
      fw.volumeWeight = Math.min(2.0, fw.volumeWeight + 0.01);
    } else {
      insight = `Loss on ${outcome.symbol} at RSI ${outcome.rsiAtEntry}. Analyzing pattern to prevent recurrence.`;
    }
  }

  // Cap all weights
  fw.rsiWeight = Math.max(0.5, Math.min(2.0, fw.rsiWeight));
  fw.macdWeight = Math.max(0.5, Math.min(2.0, fw.macdWeight));
  fw.volumeWeight = Math.max(0.5, Math.min(2.0, fw.volumeWeight));
  fw.momentumWeight = Math.max(0.5, Math.min(2.0, fw.momentumWeight));
  fw.newsWeight = Math.max(0.5, Math.min(2.0, fw.newsWeight));
  state.featureWeights = fw;

  const lesson: AILesson = {
    id: `ls_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    symbol: outcome.symbol,
    direction: outcome.signalType === "BUY" ? "long" : "short",
    result: outcome.result,
    rsi: outcome.rsiAtEntry,
    macdState,
    volumeLevel,
    hourOfDay: outcome.hourOfDay,
    insight,
    weightAdjustments: adjustments,
  };

  const lessons = getLessons();
  lessons.unshift(lesson);
  saveLessons(lessons);

  addToChangeLog(
    "lesson_applied",
    `${outcome.result} lesson applied for ${outcome.symbol}: ${insight.slice(0, 80)}...`,
  );

  saveState(state);
}

// ---------------------------------------------------------------
// MARKET PHASE DETECTION
// ---------------------------------------------------------------
export function updateMarketPhase(
  signals: Array<{ priceChange24h: number; volume24h: number }>,
): void {
  const state = getAIState();
  if (signals.length === 0) return;

  const avgChange =
    signals.reduce((s, x) => s + x.priceChange24h, 0) / signals.length;
  const positiveCount = signals.filter((x) => x.priceChange24h > 0).length;
  const bullRatio = positiveCount / signals.length;

  if (avgChange > 2 && bullRatio > 0.65) {
    state.marketPhase = "BULL";
    state.marketPhaseConfidence = Math.min(99, 60 + bullRatio * 40);
  } else if (avgChange < -2 && bullRatio < 0.35) {
    state.marketPhase = "BEAR";
    state.marketPhaseConfidence = Math.min(99, 60 + (1 - bullRatio) * 40);
  } else {
    state.marketPhase = "SIDEWAYS";
    state.marketPhaseConfidence = 50 + Math.abs(avgChange) * 5;
  }

  state.lastUpdated = Date.now();
  saveState(state);
}

// ---------------------------------------------------------------
// TP PROBABILITY SCORE
// Tuned for BUY-biased, tight-TP, high-certainty signals
// Now uses featureWeights for each component
// ---------------------------------------------------------------
export function computeTPProbability(
  ind: SignalIndicators,
  newsSentiment = 0,
): number {
  const state = getAIState();
  const fw = state.featureWeights;
  let score = 50;

  // RSI component (multiplied by rsiWeight)
  let rsiComponent = 0;
  if (ind.signalType === "BUY") {
    if (ind.rsi >= 35 && ind.rsi <= 55) rsiComponent = 15;
    else if (ind.rsi >= 30 && ind.rsi < 35) rsiComponent = 10;
    else if (ind.rsi > 55 && ind.rsi <= 65) rsiComponent = 7;
    else if (ind.rsi > 65 && ind.rsi <= 72) rsiComponent = 2;
    else if (ind.rsi > 72) rsiComponent = -12;
    else if (ind.rsi < 30) rsiComponent = -3;
  } else {
    if (ind.rsi > 65) rsiComponent = 14;
    else if (ind.rsi > 55) rsiComponent = 7;
    else if (ind.rsi < 45) rsiComponent = -12;
  }
  score += rsiComponent * fw.rsiWeight;

  // MACD component (multiplied by macdWeight)
  const macdDiff = ind.macd - ind.macdSignal;
  let macdComponent = 0;
  if (ind.signalType === "BUY") {
    macdComponent = macdDiff > 0 ? 12 : -6;
  } else {
    macdComponent = macdDiff < 0 ? 12 : -6;
  }
  score += macdComponent * fw.macdWeight;

  // Volume component (multiplied by volumeWeight)
  let volumeComponent = 0;
  if (ind.volume24h > 100_000_000) volumeComponent = 10;
  else if (ind.volume24h > 50_000_000) volumeComponent = 7;
  else if (ind.volume24h > 10_000_000) volumeComponent = 4;
  else if (ind.volume24h < 1_000_000) volumeComponent = -10;
  score += volumeComponent * fw.volumeWeight;

  // Momentum component (multiplied by momentumWeight)
  let momentumComponent = 0;
  if (ind.signalType === "BUY") {
    if (ind.priceChange24h >= 1 && ind.priceChange24h <= 8)
      momentumComponent = 8;
    else if (ind.priceChange24h > 8) momentumComponent = 3;
    else if (ind.priceChange24h < -6) momentumComponent = -10;
    else if (ind.priceChange24h < -2) momentumComponent = -4;
  } else {
    if (ind.priceChange24h < -1) momentumComponent = 8;
    else if (ind.priceChange24h > 6) momentumComponent = -10;
  }
  score += momentumComponent * fw.momentumWeight;

  // News component (multiplied by newsWeight)
  score += newsSentiment * 8 * fw.newsWeight;

  // TP distance -- TIGHTER TP = MUCH higher hit probability
  const tpDistance = Math.abs((ind.tp - ind.entryPrice) / ind.entryPrice) * 100;
  if (tpDistance <= 2.5) score += 18;
  else if (tpDistance <= 4) score += 14;
  else if (tpDistance <= 6) score += 8;
  else if (tpDistance <= 8) score += 3;
  else if (tpDistance <= 10) score -= 2;
  else score -= 15;

  // Risk/reward ratio
  const slDistance = Math.abs((ind.sl - ind.entryPrice) / ind.entryPrice) * 100;
  const rrRatio = tpDistance / (slDistance || 1);
  if (rrRatio >= 2 && rrRatio <= 3.5) score += 6;
  else if (rrRatio > 3.5) score -= 2;

  // Market phase adjustment
  if (ind.signalType === "BUY" && state.marketPhase === "BULL") score += 10;
  else if (ind.signalType === "BUY" && state.marketPhase === "BEAR") score -= 8;
  else if (ind.signalType === "SELL" && state.marketPhase === "BEAR")
    score += 10;
  else if (ind.signalType === "SELL" && state.marketPhase === "BULL")
    score -= 12;

  // Coin reputation
  const rep = state.coinReputation[ind.symbol];
  if (rep && rep.total >= 3) {
    const hitRate = rep.wins / rep.total;
    if (hitRate >= 0.8) score += 14;
    else if (hitRate >= 0.65) score += 7;
    else if (hitRate < 0.4) score -= 18;
    else if (hitRate < 0.55) score -= 8;
  }

  // Pattern learning
  const rsiKey = getRSIRangeKey(ind.rsi);
  const rsiStat = state.patternWeights.rsiRanges[rsiKey];
  if (rsiStat && rsiStat.total >= 3) {
    const rsiWinRate = rsiStat.wins / rsiStat.total;
    score += (rsiWinRate - 0.5) * 20;
  }

  // Hourly pattern
  const hour = new Date(ind.timestamp).getHours();
  const hourStat = state.hourlyStats[hour];
  if (hourStat && hourStat.total >= 5) {
    const hourWinRate = hourStat.wins / hourStat.total;
    score += (hourWinRate - 0.5) * 10;
  }

  // Category stats
  if (ind.category) {
    const catStat = state.categoryStats[ind.category];
    if (catStat && catStat.total >= 5) {
      const catWinRate = catStat.wins / catStat.total;
      score += (catWinRate - 0.5) * 10;
    }
  }

  return Math.max(0, Math.min(99, Math.round(score)));
}

// ---------------------------------------------------------------
// SIGNAL FILTER -- "TP must hit" gate
// ---------------------------------------------------------------
export function shouldShowSignal(
  ind: SignalIndicators,
  baseConfidence: number,
  newsSentiment = 0,
): {
  allowed: boolean;
  reason?: string;
  tpProbability: number;
  adjustedConfidence: number;
} {
  const state = getAIState();

  // Circuit breaker
  if (Date.now() < state.circuitBreakerUntil) {
    return {
      allowed: false,
      reason: "Circuit breaker active",
      tpProbability: 0,
      adjustedConfidence: 0,
    };
  }

  const tpProbability = computeTPProbability(ind, newsSentiment);

  if (tpProbability < 75) {
    return {
      allowed: false,
      reason: `TP probability too low (${tpProbability}%)`,
      tpProbability,
      adjustedConfidence: baseConfidence,
    };
  }

  // Coin reputation gate
  const rep = state.coinReputation[ind.symbol];
  if (rep && rep.total >= 5) {
    const hitRate = rep.wins / rep.total;
    if (hitRate < 0.4) {
      return {
        allowed: false,
        reason: `${ind.symbol} has low win rate (${Math.round(hitRate * 100)}%)`,
        tpProbability,
        adjustedConfidence: baseConfidence,
      };
    }
  }

  // Bear market gate
  if (
    ind.signalType === "BUY" &&
    state.marketPhase === "BEAR" &&
    state.marketPhaseConfidence > 85 &&
    tpProbability < 80
  ) {
    return {
      allowed: false,
      reason: "Strong bear market filter active",
      tpProbability,
      adjustedConfidence: baseConfidence,
    };
  }

  // Negative news gate
  if (newsSentiment < -0.6) {
    return {
      allowed: false,
      reason: "Strongly negative news detected",
      tpProbability,
      adjustedConfidence: baseConfidence,
    };
  }

  // Adjust confidence
  let adjustedConfidence = baseConfidence;
  adjustedConfidence += (tpProbability - 75) * 0.3;
  adjustedConfidence += newsSentiment * 5;
  adjustedConfidence = Math.max(
    0,
    Math.min(99, Math.round(adjustedConfidence)),
  );

  if (adjustedConfidence < state.currentThreshold) {
    return {
      allowed: false,
      reason: `Confidence below threshold (${adjustedConfidence}% < ${state.currentThreshold}%)`,
      tpProbability,
      adjustedConfidence,
    };
  }

  return { allowed: true, tpProbability, adjustedConfidence };
}

// ---------------------------------------------------------------
// LEARNING -- record trade outcome
// ---------------------------------------------------------------
export function recordTradeOutcome(outcome: TradeOutcome): void {
  const state = getAIState();
  const isWin = outcome.result === "WIN";

  // Write lesson first
  writeLesson(outcome);

  // Update coin reputation
  const rep = state.coinReputation[outcome.symbol] || {
    wins: 0,
    total: 0,
    lastLoss: 0,
  };
  rep.total++;
  if (isWin) rep.wins++;
  else rep.lastLoss = Date.now();
  state.coinReputation[outcome.symbol] = rep;

  if (!isWin && rep.total >= 5 && rep.wins / rep.total < 0.4) {
    addToChangeLog(
      "coin_blacklist",
      `${outcome.symbol} flagged for poor win rate (${Math.round((rep.wins / rep.total) * 100)}%). Suppressing signals.`,
    );
  } else if (isWin && rep.total >= 5 && rep.wins / rep.total >= 0.8) {
    addToChangeLog(
      "coin_boost",
      `${outcome.symbol} boosted — excellent win rate (${Math.round((rep.wins / rep.total) * 100)}%).`,
    );
  }

  // Update RSI pattern
  const rsiKey = getRSIRangeKey(outcome.rsiAtEntry);
  const rsiStat = state.patternWeights.rsiRanges[rsiKey] || {
    wins: 0,
    total: 0,
  };
  rsiStat.total++;
  if (isWin) rsiStat.wins++;
  state.patternWeights.rsiRanges[rsiKey] = rsiStat;

  // Update MACD pattern
  if (outcome.macdAtEntry > 0) {
    state.patternWeights.macdBullish.total++;
    if (isWin) state.patternWeights.macdBullish.wins++;
  } else {
    state.patternWeights.macdBearish.total++;
    if (isWin) state.patternWeights.macdBearish.wins++;
  }

  // Update volume pattern
  if (outcome.volumeAtEntry > 50_000_000) {
    state.patternWeights.highVolume.total++;
    if (isWin) state.patternWeights.highVolume.wins++;
  } else {
    state.patternWeights.lowVolume.total++;
    if (isWin) state.patternWeights.lowVolume.wins++;
  }

  // Update trend patterns
  if (outcome.priceChange24hAtEntry > 3) {
    state.patternWeights.strongUptrend.total++;
    if (isWin) state.patternWeights.strongUptrend.wins++;
  } else if (outcome.priceChange24hAtEntry > 0) {
    state.patternWeights.weakUptrend.total++;
    if (isWin) state.patternWeights.weakUptrend.wins++;
  }

  // Update hourly stats
  const hour = outcome.hourOfDay;
  const hourStat = state.hourlyStats[hour] || { wins: 0, total: 0 };
  hourStat.total++;
  if (isWin) hourStat.wins++;
  state.hourlyStats[hour] = hourStat;

  // Update category stats
  const catStat = state.categoryStats[outcome.category] || {
    wins: 0,
    total: 0,
  };
  catStat.total++;
  if (isWin) catStat.wins++;
  state.categoryStats[outcome.category] = catStat;

  // Circuit breaker
  if (isWin) {
    state.consecutiveLosses = 0;
  } else {
    state.consecutiveLosses++;
    if (state.consecutiveLosses >= 3) {
      state.circuitBreakerUntil = Date.now() + 10 * 60 * 1000;
      state.consecutiveLosses = 0;
      addToChangeLog(
        "circuit_breaker",
        "Circuit breaker tripped after 3 consecutive losses. Signals paused for 10 minutes.",
      );
    }
  }

  // Add to recent outcomes
  state.recentOutcomes.push(outcome);
  if (state.recentOutcomes.length > MAX_OUTCOMES) {
    state.recentOutcomes = state.recentOutcomes.slice(-MAX_OUTCOMES);
  }

  const prevThreshold = state.currentThreshold;
  autoAdjustThreshold(state);
  if (state.currentThreshold !== prevThreshold) {
    addToChangeLog(
      "threshold_adjust",
      "Auto-adjusted confidence threshold based on recent performance.",
      prevThreshold,
      state.currentThreshold,
    );
  }

  state.totalLearned++;
  state.lastUpdated = Date.now();
  saveState(state);
}

function autoAdjustThreshold(state: AIState): void {
  const recent = state.recentOutcomes.slice(-20);
  if (recent.length < 5) return;

  const winRate =
    recent.filter((o) => o.result === "WIN").length / recent.length;

  if (winRate < 0.6) {
    state.currentThreshold = Math.min(93, state.currentThreshold + 1);
  } else if (winRate > 0.85 && state.currentThreshold > 83) {
    state.currentThreshold = Math.max(83, state.currentThreshold - 0.5);
  }
}

// ---------------------------------------------------------------
// AI Q&A -- generate answer for a tracked trade question
// ---------------------------------------------------------------
export function generateTradeAnswer(
  trade: {
    symbol: string;
    direction: "long" | "short";
    entryPrice: number;
    takeProfit: number;
    stopLoss: number;
    currentPrice: number;
    trackedAt: number;
    estimatedHours?: number;
    rsi?: number;
    macd?: string;
    volume?: string;
    confidence?: number;
    tpProbability?: number;
    profitPercent?: number;
  },
  question: string,
): string {
  const q = question.toLowerCase();
  const isBuy = trade.direction === "long";
  const tpRange = trade.takeProfit - trade.entryPrice;
  const rawProgress = isBuy
    ? ((trade.currentPrice - trade.entryPrice) / tpRange) * 100
    : ((trade.entryPrice - trade.currentPrice) / Math.abs(tpRange)) * 100;
  const progress = Math.max(0, Math.min(100, rawProgress));
  const rsi = trade.rsi ?? 50;
  const macdBullish = (trade.macd ?? "neutral") === "bullish";
  const dumpRisk =
    isBuy &&
    (trade.currentPrice - trade.entryPrice) / trade.entryPrice < -0.015;
  const nearTP = progress >= 70;
  const confidence = trade.confidence ?? 85;
  const tpProb = trade.tpProbability ?? 75;

  // Check lessons for this symbol
  const lessons = getLessons().filter((l) => l.symbol === trade.symbol);
  const winLessons = lessons.filter((l) => l.result === "WIN").length;
  const totalLessons = lessons.length;
  const symbolHistory =
    totalLessons > 0
      ? ` ${trade.symbol} has ${winLessons}/${totalLessons} historical wins.`
      : "";

  const strengthLabel =
    progress >= 70 ? "Strong" : progress >= 40 ? "Moderate" : "Early";
  const estRemaining = trade.estimatedHours
    ? Math.max(0.5, trade.estimatedHours * (1 - progress / 100))
    : null;

  const tpProbLabel = tpProb >= 80 ? "HIGH" : tpProb >= 65 ? "MEDIUM" : "LOW";

  if (
    q.includes("hit tp") ||
    q.includes("will it hit") ||
    q.includes("reach tp") ||
    q.includes("hit target")
  ) {
    if (progress >= 95)
      return `✅ Essentially at TP now — ${progress.toFixed(1)}% complete. Take profit immediately.`;
    if (progress >= 70 && !dumpRisk)
      return `🟢 HIGH probability of TP hit. ${progress.toFixed(1)}% complete with ${strengthLabel} momentum. TP probability: ${tpProb}% (${tpProbLabel}). ${estRemaining ? `Est. ${estRemaining.toFixed(1)}h remaining.` : ""}${symbolHistory}`;
    if (dumpRisk)
      return "🔴 WARNING: Price is below entry — dump risk active. TP hit unlikely without recovery. Consider safe exit.";
    return `🟡 ${progress.toFixed(1)}% toward TP. TP probability: ${tpProb}% (${tpProbLabel}). RSI ${rsi}, MACD ${macdBullish ? "bullish" : "bearish"}. ${confidence >= 88 ? "Strong signal — hold position." : "Monitor closely."}${symbolHistory}`;
  }

  if (
    q.includes("exit") ||
    q.includes("close") ||
    q.includes("should i sell")
  ) {
    if (dumpRisk) {
      const safeExit = isBuy
        ? trade.entryPrice * 0.988
        : trade.entryPrice * 1.012;
      return `⚠️ DUMP RISK DETECTED. Recommend exiting at Safe Exit $${safeExit.toFixed(4)} to protect capital. Price ${(((trade.currentPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2)}% from entry.`;
    }
    if (nearTP)
      return `✅ ${progress.toFixed(1)}% to TP — recommend holding. You're ${(100 - progress).toFixed(1)}% away from full profit. Only exit if momentum breaks.`;
    return `📊 Current progress: ${progress.toFixed(1)}%. RSI ${rsi} — ${rsi > 70 ? "overbought, consider partial exit" : "still in healthy range, hold"}. TP probability: ${tpProb}%.`;
  }

  if (q.includes("safe") || q.includes("risk")) {
    const riskLevel = dumpRisk ? "HIGH" : rsi > 70 ? "MEDIUM" : "LOW";
    return `🔒 Risk Level: ${riskLevel}. RSI ${rsi} (${rsi > 70 ? "overbought" : rsi < 35 ? "oversold" : "neutral"}), MACD ${macdBullish ? "bullish ✓" : "bearish ✗"}, Progress ${progress.toFixed(1)}%. ${dumpRisk ? "Dump risk active — consider exit." : nearTP ? "Near TP — minimal risk." : "Trade within normal parameters."}${symbolHistory}`;
  }

  if (q.includes("time") || q.includes("how long") || q.includes("when")) {
    if (estRemaining !== null) {
      const h = Math.floor(estRemaining);
      const m = Math.round((estRemaining - h) * 60);
      return `⏱️ Estimated ${h}h ${m}m remaining based on current velocity (${progress.toFixed(1)}% complete). ${tpProbLabel} probability of TP hit. ${nearTP ? "Very close — could hit anytime." : ""}${symbolHistory}`;
    }
    return `⏱️ ${progress.toFixed(1)}% complete. Cannot estimate remaining time without entry data. Monitor price action closely.`;
  }

  if (q.includes("profit") || q.includes("how much") || q.includes("gain")) {
    const profitPct =
      trade.profitPercent ??
      Math.abs(
        ((trade.takeProfit - trade.entryPrice) / trade.entryPrice) * 100,
      );
    const currentGain = isBuy
      ? ((trade.currentPrice - trade.entryPrice) / trade.entryPrice) * 100
      : ((trade.entryPrice - trade.currentPrice) / trade.entryPrice) * 100;
    return `💰 Target profit: +${profitPct.toFixed(2)}% at TP. Current unrealized: ${currentGain >= 0 ? "+" : ""}${currentGain.toFixed(2)}%. At ${progress.toFixed(1)}% of the way. Entry $${trade.entryPrice.toFixed(4)} → TP $${trade.takeProfit.toFixed(4)}.`;
  }

  // Default: general analysis
  return `📡 ${trade.symbol} trade analysis: ${progress.toFixed(1)}% toward TP, RSI ${rsi} (${rsi > 70 ? "overbought" : rsi < 35 ? "oversold" : "optimal"}), MACD ${macdBullish ? "bullish" : "bearish"}, confidence ${confidence}%. ${dumpRisk ? "⚠️ Dump risk active." : nearTP ? "✅ Near TP — strong position." : "Trade progressing normally."}${symbolHistory}`;
}

// ---------------------------------------------------------------
// AUTO-LEARNING FROM TRACKED TRADES
// ---------------------------------------------------------------
export function checkTrackedTradeOutcome(trade: {
  symbol: string;
  signalType: "BUY" | "SELL";
  entryPrice: number;
  tp: number;
  sl: number;
  currentPrice: number;
  trackedAt: number;
  rsiAtEntry?: number;
  macdAtEntry?: number;
  volumeAtEntry?: number;
  priceChange24hAtEntry?: number;
  category?: string;
  confidence?: number;
  tpProbability?: number;
}): "WIN" | "LOSS" | null {
  const { currentPrice, tp, sl, signalType } = trade;

  let hitTP = false;
  let hitSL = false;

  if (signalType === "BUY") {
    hitTP = currentPrice >= tp;
    hitSL = currentPrice <= sl;
  } else {
    hitTP = currentPrice <= tp;
    hitSL = currentPrice >= sl;
  }

  if (hitTP || hitSL) {
    const result = hitTP ? "WIN" : "LOSS";
    recordTradeOutcome({
      symbol: trade.symbol,
      signalType: trade.signalType,
      result,
      rsiAtEntry: trade.rsiAtEntry ?? 50,
      macdAtEntry: trade.macdAtEntry ?? 0,
      volumeAtEntry: trade.volumeAtEntry ?? 0,
      priceChange24hAtEntry: trade.priceChange24hAtEntry ?? 0,
      hourOfDay: new Date(trade.trackedAt).getHours(),
      category: trade.category ?? "other",
      confidenceAtEntry: trade.confidence ?? 85,
      tpProbabilityAtEntry: trade.tpProbability ?? 75,
      timestamp: trade.trackedAt,
      holdDurationMs: Date.now() - trade.trackedAt,
    });
    return result;
  }

  return null;
}

// ---------------------------------------------------------------
// TRAILING STOP LOGIC
// ---------------------------------------------------------------
export function computeTrailingStop(
  signalType: "BUY" | "SELL",
  entryPrice: number,
  originalSL: number,
  currentPrice: number,
  tp: number,
): number {
  const progress =
    signalType === "BUY"
      ? (currentPrice - entryPrice) / (tp - entryPrice)
      : (entryPrice - currentPrice) / (entryPrice - tp);

  if (progress < 0.3) return originalSL;

  if (signalType === "BUY") {
    const trailDistance = (currentPrice - originalSL) * 0.3;
    const trailedStop = currentPrice - trailDistance;
    return Math.max(originalSL, trailedStop);
  }
  const trailDistance = (originalSL - currentPrice) * 0.3;
  const trailedStop = currentPrice + trailDistance;
  return Math.min(originalSL, trailedStop);
}

// ---------------------------------------------------------------
// DUMP RISK DETECTOR
// ---------------------------------------------------------------
export function computeDumpRisk(
  ind: Pick<
    SignalIndicators,
    | "rsi"
    | "macd"
    | "macdSignal"
    | "priceChange24h"
    | "priceChange1h"
    | "signalType"
  >,
): "LOW" | "MEDIUM" | "HIGH" {
  let riskScore = 0;

  if (ind.signalType === "BUY") {
    if (ind.rsi < 32) riskScore += 2;
    else if (ind.rsi < 38) riskScore += 1;
    if (ind.rsi > 74) riskScore += 3;

    const macdDiff = ind.macd - ind.macdSignal;
    if (macdDiff < -0.001) riskScore += 2;

    if (ind.priceChange24h < -6) riskScore += 3;
    else if (ind.priceChange24h < -3) riskScore += 1;
    if (ind.priceChange1h !== undefined && ind.priceChange1h < -2)
      riskScore += 2;
  }

  if (riskScore >= 5) return "HIGH";
  if (riskScore >= 2) return "MEDIUM";
  return "LOW";
}

// ---------------------------------------------------------------
// SIGNAL STRENGTH
// ---------------------------------------------------------------
export function computeSignalStrength(
  ind: Pick<
    SignalIndicators,
    | "rsi"
    | "macd"
    | "macdSignal"
    | "volume24h"
    | "priceChange24h"
    | "signalType"
  >,
): "STRONG" | "WEAKENING" | "AT_RISK" {
  let score = 0;

  if (ind.signalType === "BUY") {
    if (ind.rsi >= 38 && ind.rsi <= 65) score += 2;
    else if (ind.rsi < 32 || ind.rsi > 74) score -= 2;

    if (ind.macd > ind.macdSignal) score += 2;
    else score -= 1;

    if (ind.volume24h > 10_000_000) score += 1;
    if (ind.priceChange24h > 0.5) score += 1;
    else if (ind.priceChange24h < -4) score -= 2;
  }

  if (score >= 4) return "STRONG";
  if (score >= 1) return "WEAKENING";
  return "AT_RISK";
}

// ---------------------------------------------------------------
// AI CONFIDENCE BREAKDOWN
// ---------------------------------------------------------------
export interface ConfidenceBreakdown {
  base: number;
  rsiBoost: number;
  macdBoost: number;
  volumeBoost: number;
  coinRepBoost: number;
  newsBoost: number;
  marketPhaseBoost: number;
  patternBoost: number;
  final: number;
  tpProbability: number;
  topFactors: string[];
}

export function getConfidenceBreakdown(
  ind: SignalIndicators,
  baseConfidence: number,
  newsSentiment = 0,
): ConfidenceBreakdown {
  const state = getAIState();
  const topFactors: string[] = [];

  let rsiBoost = 0;
  if (ind.rsi >= 38 && ind.rsi <= 62) {
    rsiBoost = 5;
    topFactors.push("RSI in optimal range");
  } else if (ind.rsi > 72) {
    rsiBoost = -8;
    topFactors.push("RSI overbought warning");
  } else if (ind.rsi < 30) {
    rsiBoost = -3;
    topFactors.push("RSI oversold caution");
  }

  const macdDiff = ind.macd - ind.macdSignal;
  let macdBoost = 0;
  if (ind.signalType === "BUY" && macdDiff > 0) {
    macdBoost = 6;
    topFactors.push("MACD bullish crossover confirmed");
  } else if (ind.signalType === "BUY" && macdDiff < 0) {
    macdBoost = -5;
    topFactors.push("MACD bearish divergence");
  }

  let volumeBoost = 0;
  if (ind.volume24h > 100_000_000) {
    volumeBoost = 6;
    topFactors.push("Very high volume -- strong conviction");
  } else if (ind.volume24h > 50_000_000) {
    volumeBoost = 4;
    topFactors.push("High volume confirmation");
  } else if (ind.volume24h < 1_000_000) {
    volumeBoost = -5;
    topFactors.push("Low volume caution");
  }

  let coinRepBoost = 0;
  const rep = state.coinReputation[ind.symbol];
  if (rep && rep.total >= 3) {
    const hr = rep.wins / rep.total;
    if (hr >= 0.8) {
      coinRepBoost = 7;
      topFactors.push(`${ind.symbol} proven track record`);
    } else if (hr < 0.5) {
      coinRepBoost = -8;
      topFactors.push(`${ind.symbol} poor history`);
    }
  }

  const newsBoost = Math.round(newsSentiment * 5);
  if (newsSentiment > 0.3) topFactors.push("Positive news sentiment");
  else if (newsSentiment < -0.3) topFactors.push("Negative news detected");

  let marketPhaseBoost = 0;
  if (ind.signalType === "BUY" && state.marketPhase === "BULL") {
    marketPhaseBoost = 5;
    topFactors.push("Bull market phase active");
  } else if (ind.signalType === "BUY" && state.marketPhase === "BEAR") {
    marketPhaseBoost = -5;
    topFactors.push("Bear market headwind");
  }

  const rsiKey = getRSIRangeKey(ind.rsi);
  const rsiStat = state.patternWeights.rsiRanges[rsiKey];
  let patternBoost = 0;
  if (rsiStat && rsiStat.total >= 3) {
    patternBoost = Math.round((rsiStat.wins / rsiStat.total - 0.5) * 10);
    if (patternBoost > 2) topFactors.push("AI learned: this pattern wins");
    else if (patternBoost < -2)
      topFactors.push("AI learned: this pattern risky");
  }

  const final = Math.max(
    0,
    Math.min(
      99,
      Math.round(
        baseConfidence +
          rsiBoost +
          macdBoost +
          volumeBoost +
          coinRepBoost +
          newsBoost +
          marketPhaseBoost +
          patternBoost,
      ),
    ),
  );

  const tpProbability = computeTPProbability(ind, newsSentiment);

  return {
    base: baseConfidence,
    rsiBoost,
    macdBoost,
    volumeBoost,
    coinRepBoost,
    newsBoost,
    marketPhaseBoost,
    patternBoost,
    final,
    tpProbability,
    topFactors: topFactors.slice(0, 4),
  };
}

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------
function getRSIRangeKey(rsi: number): string {
  if (rsi < 20) return "<20";
  if (rsi < 30) return "20-30";
  if (rsi < 40) return "30-40";
  if (rsi < 50) return "40-50";
  if (rsi < 60) return "50-60";
  if (rsi < 70) return "60-70";
  if (rsi < 80) return "70-80";
  return ">80";
}

export function getTopPerformingCoins(
  limit = 5,
): Array<{ symbol: string; winRate: number; total: number }> {
  const state = getAIState();
  return Object.entries(state.coinReputation)
    .filter(([, v]) => v.total >= 3)
    .map(([symbol, v]) => ({
      symbol,
      winRate: v.wins / v.total,
      total: v.total,
    }))
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, limit);
}

export function getAIStats() {
  const state = getAIState();
  const recent = state.recentOutcomes.slice(-50);
  const winRate =
    recent.length > 0
      ? Math.round(
          (recent.filter((o) => o.result === "WIN").length / recent.length) *
            100,
        )
      : 0;
  const circuitActive = Date.now() < state.circuitBreakerUntil;
  const circuitMinLeft = circuitActive
    ? Math.ceil((state.circuitBreakerUntil - Date.now()) / 60000)
    : 0;

  return {
    marketPhase: state.marketPhase,
    marketPhaseConfidence: Math.round(state.marketPhaseConfidence),
    currentThreshold: Math.round(state.currentThreshold),
    totalLearned: state.totalLearned,
    winRate,
    topCoins: getTopPerformingCoins(3),
    filteredCoins: state.filteredCoins,
    circuitActive,
    circuitMinLeft,
    consecutiveLosses: state.consecutiveLosses,
    lastUpdated: state.lastUpdated,
  };
}

export function updateFilteredCount(count: number): void {
  const state = getAIState();
  state.filteredCoins = count;
  saveState(state);
}
