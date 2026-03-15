import { useCallback, useState } from "react";
import type { SignalData } from "./useCryptoSignals";

const STORAGE_KEY = "trocadero_tracked_trades";

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
}

function loadTrades(): TrackedTrade[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TrackedTrade[]) : [];
  } catch {
    return [];
  }
}

function saveTrades(trades: TrackedTrade[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  } catch {
    // ignore
  }
}

export function useTrackTrades() {
  const [trackedTrades, setTrackedTrades] =
    useState<TrackedTrade[]>(loadTrades);

  const trackedIds = new Set(trackedTrades.map((t) => t.signalId));

  const addTrade = useCallback((signal: SignalData) => {
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
        },
      ];
      saveTrades(next);
      return next;
    });
  }, []);

  const removeTrade = useCallback((signalId: string) => {
    setTrackedTrades((prev) => {
      const next = prev.filter((t) => t.signalId !== signalId);
      saveTrades(next);
      return next;
    });
  }, []);

  return { trackedTrades, trackedIds, addTrade, removeTrade };
}
