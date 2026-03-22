import { useCallback, useState } from "react";
import type { SignalData } from "./useCryptoSignals";

export interface TrackedTrade {
  signalId: string;
  symbol: string;
  coinName: string;
  direction: "long" | "short";
  entryPrice: number;
  takeProfit: number;
  stopLoss: number;
  safeExitPrice: number;
  profitPercent: number;
  trackedAt: number;
  // Signal quality fields stored at track time
  confidence?: number;
  rsi?: number;
  macd?: "bullish" | "bearish" | "neutral";
  volume?: "high" | "medium" | "low";
  tpProbability?: number;
  dumpRisk?: number;
  learningBoost?: number;
}

function getStorageKey(username?: string): string {
  if (username) return `t77_tracked_${username}`;
  return "t77_tracked_guest";
}

function loadTrades(username?: string): TrackedTrade[] {
  try {
    const raw = localStorage.getItem(getStorageKey(username));
    return raw ? (JSON.parse(raw) as TrackedTrade[]) : [];
  } catch {
    return [];
  }
}

function saveTrades(trades: TrackedTrade[], username?: string) {
  try {
    localStorage.setItem(getStorageKey(username), JSON.stringify(trades));
  } catch {
    // ignore
  }
}

export function useTrackTrades(username?: string) {
  const [trackedTrades, setTrackedTrades] = useState<TrackedTrade[]>(() =>
    loadTrades(username),
  );

  const trackedIds = new Set(trackedTrades.map((t) => t.signalId));

  const addTrade = useCallback(
    (signal: SignalData) => {
      setTrackedTrades((prev) => {
        if (prev.some((t) => t.signalId === signal.id)) return prev;
        const next: TrackedTrade[] = [
          ...prev,
          {
            signalId: signal.id,
            symbol: signal.symbol,
            coinName: signal.coinName,
            direction: signal.direction,
            entryPrice: signal.entryPrice,
            takeProfit: signal.takeProfit,
            stopLoss: signal.stopLoss,
            safeExitPrice: signal.safeExitPrice,
            profitPercent: signal.profitPercent,
            trackedAt: Date.now(),
            confidence: signal.confidence,
            rsi: signal.rsi,
            macd: signal.macd,
            volume: signal.volume,
            tpProbability: signal.tpProbability,
            dumpRisk: signal.dumpRisk,
            learningBoost: signal.learningBoost,
          },
        ];
        saveTrades(next, username);
        return next;
      });
    },
    [username],
  );

  const removeTrade = useCallback(
    (signalId: string) => {
      setTrackedTrades((prev) => {
        const next = prev.filter((t) => t.signalId !== signalId);
        saveTrades(next, username);
        return next;
      });
    },
    [username],
  );

  return { trackedTrades, trackedIds, addTrade, removeTrade };
}
