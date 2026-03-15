const STORAGE_KEY = "trocadero_learning_v1";
const AUTOLEARN_KEY = "trocadero_autolearn_count";

export interface LearningEntry {
  wins: number;
  losses: number;
  lastUpdated: number;
}

function loadData(): Record<string, LearningEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, LearningEntry>;
  } catch {
    return {};
  }
}

function saveData(data: Record<string, LearningEntry>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function recordOutcome(symbol: string, hit: boolean): void {
  const data = loadData();
  const entry = data[symbol] ?? { wins: 0, losses: 0, lastUpdated: 0 };
  if (hit) entry.wins += 1;
  else entry.losses += 1;
  entry.lastUpdated = Date.now();
  data[symbol] = entry;
  saveData(data);
}

export function getLearningBoost(symbol: string): number {
  const data = loadData();
  const entry = data[symbol];
  if (!entry) return 0;
  const total = entry.wins + entry.losses;
  if (total < 3) return 0;
  const winRate = entry.wins / total;
  if (winRate >= 0.8) return 10;
  if (winRate >= 0.65) return 7;
  if (winRate >= 0.5) return 3;
  if (winRate < 0.4) return -5;
  return -2;
}

// Bug 11 fix: batch all boosts in one localStorage read
export function getAllBoosts(): Record<string, number> {
  const data = loadData();
  const result: Record<string, number> = {};
  for (const [symbol, entry] of Object.entries(data)) {
    const total = entry.wins + entry.losses;
    if (total < 3) {
      result[symbol] = 0;
      continue;
    }
    const winRate = entry.wins / total;
    if (winRate >= 0.8) result[symbol] = 10;
    else if (winRate >= 0.65) result[symbol] = 7;
    else if (winRate >= 0.5) result[symbol] = 3;
    else if (winRate < 0.4) result[symbol] = -5;
    else result[symbol] = -2;
  }
  return result;
}

export function getSessionStats(): {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
} {
  const data = loadData();
  let wins = 0;
  let losses = 0;
  for (const entry of Object.values(data)) {
    wins += entry.wins;
    losses += entry.losses;
  }
  const total = wins + losses;
  return {
    totalTrades: total,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
  };
}

export function getAllData(): Record<string, LearningEntry> {
  return loadData();
}

export function hasLearningData(symbol: string): boolean {
  const data = loadData();
  const entry = data[symbol];
  if (!entry) return false;
  return entry.wins + entry.losses >= 1;
}

/**
 * Returns coin reputation based on historical win rate.
 * 'high' = winRate >= 70% AND 5+ trades
 * 'medium' = winRate 50-70% AND 3+ trades
 * 'low' = winRate < 30% AND 5+ trades
 * 'new' = fewer than 3 recorded trades
 */
export function getCoinReputation(
  symbol: string,
): "high" | "medium" | "low" | "new" {
  const data = loadData();
  const entry = data[symbol.toUpperCase()] ?? data[symbol];
  if (!entry) return "new";
  const total = entry.wins + entry.losses;
  if (total < 3) return "new";
  const winRate = entry.wins / total;
  if (total >= 5 && winRate >= 0.7) return "high";
  if (total >= 3 && winRate >= 0.5) return "medium";
  if (total >= 5 && winRate < 0.3) return "low";
  return "new";
}

/**
 * Returns a Set of symbols that are blacklisted:
 * win rate < 30% AND 5+ total trades.
 */
export function getBlacklist(): Set<string> {
  const data = loadData();
  const blacklist = new Set<string>();
  for (const [symbol, entry] of Object.entries(data)) {
    const total = entry.wins + entry.losses;
    if (total >= 5 && entry.wins / total < 0.3) {
      blacklist.add(symbol.toUpperCase());
    }
  }
  return blacklist;
}

/**
 * Returns the count of outcomes that were auto-recorded by the tracking system.
 */
export function getAutoLearnStats(): { totalAutoLearned: number } {
  try {
    const raw = localStorage.getItem(AUTOLEARN_KEY);
    const count = raw ? Number.parseInt(raw, 10) : 0;
    return { totalAutoLearned: Number.isNaN(count) ? 0 : count };
  } catch {
    return { totalAutoLearned: 0 };
  }
}

/**
 * Increments the auto-learn counter stored in localStorage.
 */
export function incrementAutoLearnCount(): void {
  try {
    const current = getAutoLearnStats().totalAutoLearned;
    localStorage.setItem(AUTOLEARN_KEY, String(current + 1));
  } catch {
    // ignore storage errors
  }
}
