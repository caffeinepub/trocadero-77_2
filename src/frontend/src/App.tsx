import { Toaster } from "@/components/ui/sonner";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import EnterNowSection from "./components/EnterNowSection";
import FounderSection from "./components/FounderSection";
import HeroSection from "./components/HeroSection";
import HighProfitSection from "./components/HighProfitSection";
import Navbar from "./components/Navbar";
import SearchPage from "./components/SearchPage";
import SignalCardSection from "./components/SignalCard";
import SignalDetail from "./components/SignalDetail";
import TrackingPage from "./components/TrackingPage";
import { useCryptoSignals } from "./hooks/useCryptoSignals";
import type { SignalData } from "./hooks/useCryptoSignals";
import {
  getAutoLearnStats,
  getSessionStats,
  recordOutcome,
} from "./hooks/useLearningEngine";
import { useTrackTrades } from "./hooks/useTrackTrades";

export default function App() {
  const {
    signals,
    highProfitSignals,
    isScanning,
    lastScanTime,
    rescan,
    buildSignals,
    markSignalAccuracy,
    tickerData,
    stats,
    scanProgress,
    livePrices,
    isLoading,
    marketSentiment,
    excludedByReputation,
  } = useCryptoSignals();
  const [selectedSignal, setSelectedSignal] = useState<SignalData | null>(null);
  const [activeSection, setActiveSection] = useState("home");

  const [sessionStats, setSessionStats] = useState(() => getSessionStats());
  const [autoLearned, setAutoLearned] = useState(
    () => getAutoLearnStats().totalAutoLearned,
  );

  const { trackedTrades, trackedIds, addTrade, removeTrade } = useTrackTrades();

  const scrollTo = useCallback((id: string) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleRescan = useCallback(async () => {
    toast.loading("Scanning all BingX markets...", { id: "rescan" });
    await rescan();
    toast.success("Signals refreshed!", { id: "rescan" });
  }, [rescan]);

  const handleMarkAccuracy = useCallback(
    (id: string, hit: boolean) => {
      markSignalAccuracy(id, hit);
      const signal = signals.find((s) => s.id === id);
      if (signal) recordOutcome(signal.symbol, hit);
      setSessionStats(getSessionStats());
      toast.success(hit ? "Marked as target hit ✓" : "Marked as missed");
      setSelectedSignal((prev) =>
        prev?.id === id ? { ...prev, hitTarget: hit } : prev,
      );
    },
    [markSignalAccuracy, signals],
  );

  const handleAutoLearnUpdate = useCallback(() => {
    setAutoLearned(getAutoLearnStats().totalAutoLearned);
    setSessionStats(getSessionStats());
    buildSignals([], livePrices, marketSentiment);
  }, [buildSignals, livePrices, marketSentiment]);

  const statsWithSession = {
    ...stats,
    sessionWins: sessionStats.wins,
    sessionTotal: sessionStats.totalTrades,
  };

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return (
          <main>
            <HeroSection
              stats={statsWithSession}
              signals={signals}
              marketSentiment={marketSentiment}
              excludedByReputation={excludedByReputation}
              autoLearned={autoLearned}
            />
            <FounderSection />
          </main>
        );
      case "tradenow":
        return (
          <main>
            <HeroSection
              stats={statsWithSession}
              signals={signals}
              marketSentiment={marketSentiment}
              excludedByReputation={excludedByReputation}
              autoLearned={autoLearned}
            />
            <EnterNowSection
              signals={signals}
              onSelectSignal={setSelectedSignal}
              onTrack={addTrade}
              trackedIds={trackedIds}
            />
          </main>
        );
      case "signals":
        return (
          <main>
            <SignalCardSection
              signals={signals}
              onSelectSignal={setSelectedSignal}
              lastScanTime={lastScanTime}
              onTrack={addTrade}
              trackedIds={trackedIds}
              isLoading={isLoading}
            />
          </main>
        );
      case "highprofit":
        return (
          <main>
            <HighProfitSection
              signals={highProfitSignals}
              onSelectSignal={setSelectedSignal}
              onTrack={addTrade}
              trackedIds={trackedIds}
            />
          </main>
        );
      case "tracking":
        return (
          <TrackingPage
            trackedTrades={trackedTrades}
            onStopTracking={removeTrade}
            livePrices={livePrices}
            onAutoLearnUpdate={handleAutoLearnUpdate}
          />
        );
      case "search":
        return (
          <main>
            <SearchPage
              onSelectSignal={setSelectedSignal}
              onTrack={addTrade}
              trackedIds={trackedIds}
              existingSignals={signals}
            />
          </main>
        );
      case "founder":
        return (
          <main>
            <FounderSection />
          </main>
        );
      default:
        return (
          <main>
            <HeroSection
              stats={statsWithSession}
              signals={signals}
              marketSentiment={marketSentiment}
              excludedByReputation={excludedByReputation}
              autoLearned={autoLearned}
            />
            <FounderSection />
          </main>
        );
    }
  };

  const showFooter = activeSection !== "tracking";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="bottom-right" />
      <Navbar
        tickerData={tickerData}
        activeSection={activeSection}
        onNav={scrollTo}
        onRescan={handleRescan}
        isScanning={isScanning}
        scanProgress={scanProgress}
        trackedCount={trackedTrades.length}
      />

      {renderContent()}

      {showFooter && (
        <footer className="border-t border-border py-10 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-lg font-display font-bold shimmer-text">
                TROCADERO 77
              </div>
              <div className="w-px h-4 bg-border" />
              <div className="text-xs text-foreground/85 font-mono">
                Institutional-Grade Signals
              </div>
            </div>
            <div className="text-xs text-foreground/80 font-mono">
              Trading signals carry risk. DYOR.
            </div>
          </div>
        </footer>
      )}

      <SignalDetail
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onMarkAccuracy={handleMarkAccuracy}
      />
    </div>
  );
}
