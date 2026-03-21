import { Toaster } from "@/components/ui/sonner";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import AdminPanel from "./components/AdminPanel";
import CreditGate from "./components/CreditGate";
import EnterNowSection from "./components/EnterNowSection";
import FastTradingSection from "./components/FastTradingSection";
import FounderSection from "./components/FounderSection";
import HeroSection from "./components/HeroSection";
import HighProfitSection from "./components/HighProfitSection";
import LoginModal from "./components/LoginModal";
import Navbar from "./components/Navbar";
import PostsFeed from "./components/PostsFeed";
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
import { getCurrentUser, logout } from "./lib/authManager";

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
    coinList,
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

  // Auth state
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    isAdmin: boolean;
  } | null>(() => {
    const u = getCurrentUser();
    if (!u || u.isExpired) return null;
    return { username: u.username, isAdmin: u.isAdmin };
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

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
    if (coinList && coinList.length > 0) {
      buildSignals(coinList, livePrices, marketSentiment);
    }
  }, [buildSignals, coinList, livePrices, marketSentiment]);

  const handleLoginSuccess = useCallback(
    (username: string, isAdmin: boolean) => {
      setCurrentUser({ username, isAdmin });
      setShowLoginModal(false);
      toast.success(
        isAdmin
          ? `Welcome back, ${username}! Admin access granted.`
          : `Welcome back, ${username}!`,
      );
      if (isAdmin) scrollTo("adminpanel");
    },
    [scrollTo],
  );

  const handleLogout = useCallback(() => {
    logout();
    setCurrentUser(null);
    scrollTo("home");
    toast.success("Logged out successfully");
  }, [scrollTo]);

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
              sessionWinRate={statsWithSession.winRate}
            />
            <PostsFeed />
            <FounderSection />
          </main>
        );
      case "tradenow":
        return (
          <main>
            <CreditGate
              sectionName="Trade Now"
              onLogin={() => setShowLoginModal(true)}
            >
              <EnterNowSection
                signals={signals}
                onSelectSignal={setSelectedSignal}
                onTrack={addTrade}
                trackedIds={trackedIds}
              />
            </CreditGate>
          </main>
        );
      case "fasttrades":
        return (
          <main>
            <CreditGate
              sectionName="Fast Trades"
              onLogin={() => setShowLoginModal(true)}
            >
              <FastTradingSection
                signals={signals}
                onSelectSignal={setSelectedSignal}
                onTrack={addTrade}
                trackedIds={trackedIds}
              />
            </CreditGate>
          </main>
        );
      case "signals":
        return (
          <main>
            <CreditGate
              sectionName="Active Signals"
              onLogin={() => setShowLoginModal(true)}
            >
              <SignalCardSection
                signals={signals}
                onSelectSignal={setSelectedSignal}
                lastScanTime={lastScanTime}
                onTrack={addTrade}
                trackedIds={trackedIds}
                isLoading={isLoading}
              />
            </CreditGate>
          </main>
        );
      case "highprofit":
        return (
          <main>
            <CreditGate
              sectionName="High Profit"
              onLogin={() => setShowLoginModal(true)}
            >
              <HighProfitSection
                signals={highProfitSignals}
                onSelectSignal={setSelectedSignal}
                onTrack={addTrade}
                trackedIds={trackedIds}
              />
            </CreditGate>
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
      case "adminpanel":
        if (!currentUser?.isAdmin) return null;
        return (
          <main>
            <AdminPanel adminUsername={currentUser.username} />
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
              sessionWinRate={statsWithSession.winRate}
            />
            <PostsFeed />
            <FounderSection />
          </main>
        );
    }
  };

  const showFooter =
    activeSection !== "tracking" && activeSection !== "adminpanel";

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
        currentUser={currentUser}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => scrollTo("adminpanel")}
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
            <div className="text-xs text-foreground/50">
              © {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground/70 transition-colors"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </footer>
      )}

      <SignalDetail
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onMarkAccuracy={handleMarkAccuracy}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
