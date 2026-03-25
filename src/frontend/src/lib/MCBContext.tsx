import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "t77_mcb_states";
const CONSEC_LOSSES_KEY = "t77_consecutive_losses";

export interface MCBState {
  // DB1 - Main
  SERVER: boolean;
  AI: boolean;
  UPS: boolean;
  AC: boolean;
  MARKET: boolean;
  NETWORK: boolean;
  // DB2 - Market
  STABILIZER: boolean;
  BULLISH: boolean;
  BEARISH: boolean;
  LOW_CONFIDENCE: boolean;
  HIGH_CONFIDENCE: boolean;
  CONSECUTIVE_LOSSES: boolean;
}

const DEFAULT_STATE: MCBState = {
  SERVER: true,
  AI: true,
  UPS: true,
  AC: true,
  MARKET: true,
  NETWORK: true,
  STABILIZER: true,
  BULLISH: true,
  BEARISH: true,
  LOW_CONFIDENCE: false,
  HIGH_CONFIDENCE: true,
  CONSECUTIVE_LOSSES: true,
};

function loadState(): MCBState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const saved = JSON.parse(raw);
    // Always reset CONSECUTIVE_LOSSES on load — it should only trip during the active session
    return { ...DEFAULT_STATE, ...saved, CONSECUTIVE_LOSSES: true };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function saveState(s: MCBState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export interface MCBContextValue {
  mcb: MCBState;
  toggle: (key: keyof MCBState) => void;
  trip: (key: keyof MCBState) => void;
  reset: (key: keyof MCBState) => void;
  consecutiveLosses: number;
  addLoss: () => void;
  resetLosses: () => void;
  stabilizerTrippedReason: string | null;
  setStabilizerTrippedReason: (r: string | null) => void;
}

const MCBContext = createContext<MCBContextValue | null>(null);

export function MCBProvider({ children }: { children: React.ReactNode }) {
  const [mcb, setMCB] = useState<MCBState>(loadState);
  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);
  const [stabilizerTrippedReason, setStabilizerTrippedReason] = useState<
    string | null
  >(null);
  const prevMCB = useRef(mcb);

  // Reset consecutive losses counter on each new session
  useEffect(() => {
    localStorage.setItem(CONSEC_LOSSES_KEY, "0");
    setConsecutiveLosses(0);
  }, []);

  useEffect(() => {
    prevMCB.current = mcb;
    saveState(mcb);
  }, [mcb]);

  const toggle = useCallback((key: keyof MCBState) => {
    setMCB((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const trip = useCallback((key: keyof MCBState) => {
    setMCB((prev) => ({ ...prev, [key]: false }));
  }, []);

  const reset = useCallback((key: keyof MCBState) => {
    setMCB((prev) => ({ ...prev, [key]: true }));
  }, []);

  const addLoss = useCallback(() => {
    setConsecutiveLosses((prev) => {
      const next = prev + 1;
      localStorage.setItem(CONSEC_LOSSES_KEY, String(next));
      if (next >= 5) {
        setMCB((m) => ({ ...m, CONSECUTIVE_LOSSES: false }));
      }
      return next;
    });
  }, []);

  const resetLosses = useCallback(() => {
    setConsecutiveLosses(0);
    localStorage.setItem(CONSEC_LOSSES_KEY, "0");
  }, []);

  return (
    <MCBContext.Provider
      value={{
        mcb,
        toggle,
        trip,
        reset,
        consecutiveLosses,
        addLoss,
        resetLosses,
        stabilizerTrippedReason,
        setStabilizerTrippedReason,
      }}
    >
      {children}
    </MCBContext.Provider>
  );
}

export function useMCB(): MCBContextValue {
  const ctx = useContext(MCBContext);
  if (!ctx) throw new Error("useMCB must be used inside MCBProvider");
  return ctx;
}
