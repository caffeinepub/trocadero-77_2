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
    return { ...defaultState(), ...parsed };
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
// ---------------------------------------------------------------
export function computeTPProbability(
  ind: SignalIndicators,
  newsSentiment = 0,
): number {
  const state = getAIState();
  let score = 50;

  if (ind.signalType === "BUY") {
    // Best RSI range for BUY: 35-60 (recovery/momentum zone)
    if (ind.rsi >= 35 && ind.rsi <= 55)
      score += 15; // Prime oversold-to-neutral zone
    else if (ind.rsi >= 30 && ind.rsi < 35)
      score += 10; // Oversold recovery
    else if (ind.rsi > 55 && ind.rsi <= 65)
      score += 7; // Moderate momentum
    else if (ind.rsi > 65 && ind.rsi <= 72)
      score += 2; // Getting stretched
    else if (ind.rsi > 72)
      score -= 12; // Overbought -- dump risk
    else if (ind.rsi < 30) score -= 3; // Could still be falling
  } else {
    if (ind.rsi > 65) score += 14;
    else if (ind.rsi > 55) score += 7;
    else if (ind.rsi < 45) score -= 12;
  }

  // MACD -- strong signal for direction
  const macdDiff = ind.macd - ind.macdSignal;
  if (ind.signalType === "BUY") {
    if (macdDiff > 0)
      score += 12; // Bullish crossover confirmed
    else score -= 6;
  } else {
    if (macdDiff < 0) score += 12;
    else score -= 6;
  }

  // Volume -- conviction behind the move
  if (ind.volume24h > 100_000_000)
    score += 10; // Very high volume
  else if (ind.volume24h > 50_000_000) score += 7;
  else if (ind.volume24h > 10_000_000) score += 4;
  else if (ind.volume24h < 1_000_000) score -= 10; // Low liquidity = unreliable

  // Price momentum alignment
  if (ind.signalType === "BUY") {
    if (ind.priceChange24h >= 1 && ind.priceChange24h <= 8)
      score += 8; // Healthy upward momentum
    else if (ind.priceChange24h > 8)
      score += 3; // Strong but may be exhausting
    else if (ind.priceChange24h < -6)
      score -= 10; // Heavy downtrend
    else if (ind.priceChange24h < -2) score -= 4;
  } else {
    if (ind.priceChange24h < -1) score += 8;
    else if (ind.priceChange24h > 6) score -= 10;
  }

  // TP distance -- TIGHTER TP = MUCH higher hit probability
  // This is the most important factor for "TP must hit"
  const tpDistance = Math.abs((ind.tp - ind.entryPrice) / ind.entryPrice) * 100;
  if (tpDistance <= 2.5)
    score += 18; // Very tight -- almost guaranteed
  else if (tpDistance <= 4) score += 14;
  else if (tpDistance <= 6) score += 8;
  else if (tpDistance <= 8) score += 3;
  else if (tpDistance <= 10) score -= 2;
  else score -= 15; // Far TP -- low hit probability

  // Risk/reward ratio
  const slDistance = Math.abs((ind.sl - ind.entryPrice) / ind.entryPrice) * 100;
  const rrRatio = tpDistance / (slDistance || 1);
  if (rrRatio >= 2 && rrRatio <= 3.5)
    score += 6; // Sweet spot
  else if (rrRatio > 3.5) score -= 2;

  // Market phase adjustment
  if (ind.signalType === "BUY" && state.marketPhase === "BULL") score += 10;
  else if (ind.signalType === "BUY" && state.marketPhase === "BEAR")
    score -= 8; // Reduced from -15: BUY can still work in bear (oversold bounces)
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

  // News sentiment
  score += newsSentiment * 8;

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

  // TP probability gate: 72% (was 78% -- lowered to allow more quality BUY signals)
  // The tight TP distance in signal generation ensures this is still high certainty
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
    if (hitRate < 0.4) {
      return {
        allowed: false,
        reason: `${ind.symbol} has low win rate (${Math.round(hitRate * 100)}%)`,
        tpProbability,
        adjustedConfidence: baseConfidence,
      };
    }
  }

  // Bear market gate: ONLY block BUY if confidence >= 80% AND market is strongly bearish
  // This allows oversold BUY bounces through even in a bear market
  if (
    ind.signalType === "BUY" &&
    state.marketPhase === "BEAR" &&
    state.marketPhaseConfidence > 85 && // Require very high bear confidence
    tpProbability < 80 // Allow through if TP probability is strong enough
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
  adjustedConfidence += (tpProbability - 72) * 0.3;
  adjustedConfidence += newsSentiment * 5;
  adjustedConfidence = Math.max(
    0,
    Math.min(99, Math.round(adjustedConfidence)),
  );

  // Auto-adjusting threshold gate
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
    }
  }

  // Add to recent outcomes
  state.recentOutcomes.push(outcome);
  if (state.recentOutcomes.length > MAX_OUTCOMES) {
    state.recentOutcomes = state.recentOutcomes.slice(-MAX_OUTCOMES);
  }

  autoAdjustThreshold(state);

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
    if (ind.rsi > 74) riskScore += 3; // Overbought

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
