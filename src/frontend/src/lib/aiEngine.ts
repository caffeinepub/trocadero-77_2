// ============================================================
// Trocadero 77 -- AI Trading Engine
// Fully autonomous learning system for maximum TP hit rate
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
  category?: string; // 'layer1' | 'defi' | 'meme' | 'exchange' | 'other'
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

export interface AIState {
  // Per-coin reputation: symbol -> { wins, total }
  coinReputation: Record<
    string,
    { wins: number; total: number; lastLoss: number }
  >;
  // Pattern weights learned from outcomes
  patternWeights: {
    rsiRanges: Record<string, { wins: number; total: number }>; // '30-40', '40-50', etc.
    macdBullish: { wins: number; total: number };
    macdBearish: { wins: number; total: number };
    highVolume: { wins: number; total: number }; // volume > 1.5x avg
    lowVolume: { wins: number; total: number };
    strongUptrend: { wins: number; total: number };
    weakUptrend: { wins: number; total: number };
  };
  // Hourly win rates
  hourlyStats: Record<number, { wins: number; total: number }>;
  // Category stats
  categoryStats: Record<string, { wins: number; total: number }>;
  // Auto-adjusting threshold
  currentThreshold: number;
  recentOutcomes: TradeOutcome[];
  // Circuit breaker
  consecutiveLosses: number;
  circuitBreakerUntil: number;
  // Total outcomes auto-learned
  totalLearned: number;
  // Market phase
  marketPhase: "BULL" | "BEAR" | "SIDEWAYS";
  marketPhaseConfidence: number;
  // Filtered coins count
  filteredCoins: number;
  lastUpdated: number;
}

const STORAGE_KEY = "trocadero77_ai_state";
const MAX_OUTCOMES = 500;

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
  };
}

function loadState(): AIState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AIState;
    // Merge with defaults to handle new fields
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

function saveState(state: AIState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full -- trim outcomes
    state.recentOutcomes = state.recentOutcomes.slice(-100);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
}

// Singleton state -- loaded once per session
let _state: AIState | null = null;

export function getAIState(): AIState {
  if (!_state) _state = loadState();
  return _state;
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
// TP PROBABILITY SCORE -- Key filter for "TP must hit"
// ---------------------------------------------------------------
export function computeTPProbability(
  ind: SignalIndicators,
  newsSentiment = 0,
): number {
  const state = getAIState();
  let score = 50; // base

  // RSI scoring for BUY signals
  if (ind.signalType === "BUY") {
    if (ind.rsi >= 40 && ind.rsi <= 60)
      score += 12; // Sweet spot
    else if (ind.rsi >= 30 && ind.rsi < 40)
      score += 8; // Oversold recovery
    else if (ind.rsi > 60 && ind.rsi <= 70) score += 4;
    else if (ind.rsi > 70)
      score -= 15; // Overbought -- high dump risk
    else if (ind.rsi < 30) score -= 5; // Possibly still falling
  } else {
    // SELL signal
    if (ind.rsi > 65) score += 12;
    else if (ind.rsi > 55) score += 6;
    else if (ind.rsi < 40) score -= 15;
  }

  // MACD scoring
  const macdDiff = ind.macd - ind.macdSignal;
  if (ind.signalType === "BUY") {
    if (macdDiff > 0)
      score += 10; // Bullish crossover
    else score -= 8;
  } else {
    if (macdDiff < 0) score += 10;
    else score -= 8;
  }

  // Volume scoring -- high volume = conviction
  if (ind.volume24h > 50_000_000) score += 8;
  else if (ind.volume24h > 10_000_000) score += 4;
  else if (ind.volume24h < 1_000_000) score -= 8; // Low liquidity = unreliable

  // Price momentum
  if (ind.signalType === "BUY") {
    if (ind.priceChange24h > 3)
      score += 6; // Momentum up
    else if (ind.priceChange24h < -8)
      score -= 12; // Strong downtrend
    else if (ind.priceChange24h < -3) score -= 5;
  } else {
    if (ind.priceChange24h < -3) score += 6;
    else if (ind.priceChange24h > 8) score -= 12;
  }

  // TP/SL distance -- tighter TP is more likely to hit
  const tpDistance = Math.abs((ind.tp - ind.entryPrice) / ind.entryPrice) * 100;
  if (tpDistance <= 3) score += 10;
  else if (tpDistance <= 5) score += 5;
  else if (tpDistance <= 8) score += 0;
  else if (tpDistance <= 15) score -= 5;
  else score -= 12; // Very far TP -- less likely

  // Risk/reward ratio bonus (higher R:R with close TP = better)
  const slDistance = Math.abs((ind.sl - ind.entryPrice) / ind.entryPrice) * 100;
  const rrRatio = tpDistance / (slDistance || 1);
  if (rrRatio >= 2.5 && rrRatio <= 4)
    score += 5; // Optimal range
  else if (rrRatio > 4) score -= 3; // Too good to be true

  // Market phase adjustment
  if (ind.signalType === "BUY" && state.marketPhase === "BULL") score += 8;
  else if (ind.signalType === "BUY" && state.marketPhase === "BEAR")
    score -= 15;
  else if (ind.signalType === "SELL" && state.marketPhase === "BEAR")
    score += 8;
  else if (ind.signalType === "SELL" && state.marketPhase === "BULL")
    score -= 15;

  // Coin reputation boost
  const rep = state.coinReputation[ind.symbol];
  if (rep && rep.total >= 3) {
    const hitRate = rep.wins / rep.total;
    if (hitRate >= 0.8) score += 12;
    else if (hitRate >= 0.65) score += 6;
    else if (hitRate < 0.4) score -= 20;
    else if (hitRate < 0.55) score -= 10;
  }

  // Pattern learning adjustments
  const rsiKey = getRSIRangeKey(ind.rsi);
  const rsiStat = state.patternWeights.rsiRanges[rsiKey];
  if (rsiStat && rsiStat.total >= 3) {
    const rsiWinRate = rsiStat.wins / rsiStat.total;
    score += (rsiWinRate - 0.5) * 20; // -10 to +10
  }

  // News sentiment
  score += newsSentiment * 8; // -1 to +1 => -8 to +8

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
// SIGNAL FILTER -- decides if a signal should be shown
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

  // Circuit breaker check
  if (Date.now() < state.circuitBreakerUntil) {
    return {
      allowed: false,
      reason: "Circuit breaker active",
      tpProbability: 0,
      adjustedConfidence: 0,
    };
  }

  const tpProbability = computeTPProbability(ind, newsSentiment);

  // TP probability gate -- this is the "TP must hit" filter
  if (tpProbability < 72) {
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
    if (hitRate < 0.45) {
      return {
        allowed: false,
        reason: `${ind.symbol} has low win rate (${Math.round(hitRate * 100)}%)`,
        tpProbability,
        adjustedConfidence: baseConfidence,
      };
    }
  }

  // Market phase gate
  if (
    ind.signalType === "BUY" &&
    state.marketPhase === "BEAR" &&
    state.marketPhaseConfidence > 70
  ) {
    return {
      allowed: false,
      reason: "Bear market filter active",
      tpProbability,
      adjustedConfidence: baseConfidence,
    };
  }

  // Negative news gate
  if (newsSentiment < -0.5) {
    return {
      allowed: false,
      reason: "Negative news detected",
      tpProbability,
      adjustedConfidence: baseConfidence,
    };
  }

  // Adjust confidence based on TP probability and news
  let adjustedConfidence = baseConfidence;
  adjustedConfidence += (tpProbability - 75) * 0.3;
  adjustedConfidence += newsSentiment * 5;
  adjustedConfidence = Math.max(
    0,
    Math.min(99, Math.round(adjustedConfidence)),
  );

  // Apply auto-adjusting threshold
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

  // Update uptrend pattern
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
      state.circuitBreakerUntil = Date.now() + 10 * 60 * 1000; // 10 min pause
      state.consecutiveLosses = 0;
    }
  }

  // Add to recent outcomes
  state.recentOutcomes.push(outcome);
  if (state.recentOutcomes.length > MAX_OUTCOMES) {
    state.recentOutcomes = state.recentOutcomes.slice(-MAX_OUTCOMES);
  }

  // Auto-adjust confidence threshold
  autoAdjustThreshold(state);

  state.totalLearned++;
  state.lastUpdated = Date.now();
  saveState(state);
}

function autoAdjustThreshold(state: AIState): void {
  const recent = state.recentOutcomes.slice(-20); // Last 20 trades
  if (recent.length < 5) return;

  const winRate =
    recent.filter((o) => o.result === "WIN").length / recent.length;

  if (winRate < 0.6) {
    // Losing too much -- raise bar
    state.currentThreshold = Math.min(93, state.currentThreshold + 1);
  } else if (winRate > 0.85 && state.currentThreshold > 83) {
    // Doing very well -- can slightly lower bar to get more signals
    state.currentThreshold = Math.max(83, state.currentThreshold - 0.5);
  }
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

  if (progress < 0.3) return originalSL; // Not enough movement yet

  if (signalType === "BUY") {
    // Trail stop up as price moves up
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
    if (ind.rsi < 35) riskScore += 2;
    else if (ind.rsi < 40) riskScore += 1;
    if (ind.rsi > 72) riskScore += 3; // Overbought

    const macdDiff = ind.macd - ind.macdSignal;
    if (macdDiff < -0.001) riskScore += 2;

    if (ind.priceChange24h < -5) riskScore += 2;
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
    if (ind.rsi >= 40 && ind.rsi <= 65) score += 2;
    else if (ind.rsi < 35 || ind.rsi > 72) score -= 2;

    if (ind.macd > ind.macdSignal) score += 2;
    else score -= 1;

    if (ind.volume24h > 10_000_000) score += 1;
    if (ind.priceChange24h > 1) score += 1;
    else if (ind.priceChange24h < -3) score -= 2;
  }

  if (score >= 4) return "STRONG";
  if (score >= 1) return "WEAKENING";
  return "AT_RISK";
}

// ---------------------------------------------------------------
// AI CONFIDENCE BREAKDOWN -- for modal display
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
  if (ind.rsi >= 40 && ind.rsi <= 60) {
    rsiBoost = 4;
    topFactors.push("RSI in optimal range");
  } else if (ind.rsi > 70) {
    rsiBoost = -8;
    topFactors.push("RSI overbought warning");
  } else if (ind.rsi < 30) {
    rsiBoost = -4;
    topFactors.push("RSI oversold caution");
  }

  const macdDiff = ind.macd - ind.macdSignal;
  let macdBoost = 0;
  if (ind.signalType === "BUY" && macdDiff > 0) {
    macdBoost = 5;
    topFactors.push("MACD bullish crossover");
  } else if (ind.signalType === "BUY" && macdDiff < 0) {
    macdBoost = -5;
    topFactors.push("MACD bearish warning");
  }

  let volumeBoost = 0;
  if (ind.volume24h > 50_000_000) {
    volumeBoost = 4;
    topFactors.push("High volume confirmation");
  } else if (ind.volume24h < 1_000_000) {
    volumeBoost = -4;
    topFactors.push("Low volume caution");
  }

  let coinRepBoost = 0;
  const rep = state.coinReputation[ind.symbol];
  if (rep && rep.total >= 3) {
    const hr = rep.wins / rep.total;
    if (hr >= 0.8) {
      coinRepBoost = 6;
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
    marketPhaseBoost = 4;
    topFactors.push("Bull market phase");
  } else if (ind.signalType === "BUY" && state.marketPhase === "BEAR") {
    marketPhaseBoost = -8;
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
