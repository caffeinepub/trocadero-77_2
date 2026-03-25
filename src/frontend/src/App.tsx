import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AIDashboardPage from "./components/AIDashboardPage";
import AdminPanel from "./components/AdminPanel";
import BullBearAnimation from "./components/BullBearAnimation";
import ControlRoomPage from "./components/ControlRoomPage";
import CreditGate from "./components/CreditGate";
import EnterNowSection from "./components/EnterNowSection";
import FastTradingSection from "./components/FastTradingSection";
import FounderSection from "./components/FounderSection";
import HamburgerDrawer from "./components/HamburgerDrawer";
import HeroSection from "./components/HeroSection";
import HighProfitSection from "./components/HighProfitSection";
import LoginModal from "./components/LoginModal";
import Navbar from "./components/Navbar";
import NewsPage from "./components/NewsPage";
import PostPage from "./components/PostPage";
import PostsFeed from "./components/PostsFeed";
import ProfilePage from "./components/ProfilePage";
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
import { MCBProvider, useMCB } from "./lib/MCBContext";
import { getCurrentUser, logout } from "./lib/authManager";

const DARK_MODE_KEY = "t77_darkMode";
const ANIMATION_KEY = "t77_animationShown";

function AppInner() {
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

  const { mcb } = useMCB();

  const [selectedSignal, setSelectedSignal] = useState<SignalData | null>(null);
  const [activeSection, setActiveSection] = useState("home");
  const [sessionStats, setSessionStats] = useState(() => getSessionStats());
  const [autoLearned, setAutoLearned] = useState(
    () => getAutoLearnStats().totalAutoLearned,
  );

  // Auth
  const [currentUser, setCurrentUser] = useState<{
    username: string;
    isAdmin: boolean;
  } | null>(() => {
    const u = getCurrentUser();
    if (!u || u.isExpired) return null;
    return { username: u.username, isAdmin: u.isAdmin };
  });
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem(DARK_MODE_KEY) === "true";
  });

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem(DARK_MODE_KEY, String(darkMode));
  }, [darkMode]);

  // Hamburger drawer
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Bull/Bear animation
  const [showAnimation, setShowAnimation] = useState(() => {
    return !sessionStorage.getItem(ANIMATION_KEY);
  });

  const handleAnimationDone = useCallback(() => {
    setShowAnimation(false);
    sessionStorage.setItem(ANIMATION_KEY, "1");
  }, []);

  const { trackedTrades, trackedIds, addTrade, removeTrade } = useTrackTrades(
    currentUser?.username,
  );

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

  // MCB-filtered signals
  const filteredSignals = signals.filter((s) => {
    if (!mcb.CONSECUTIVE_LOSSES) return false;
    if (!mcb.SERVER) return false;
    if (s.direction === "long" && !mcb.BULLISH) return false;
    if (s.direction === "short" && !mcb.BEARISH) return false;
    if (mcb.HIGH_CONFIDENCE && !mcb.LOW_CONFIDENCE && s.confidence < 90)
      return false;
    if (!mcb.HIGH_CONFIDENCE && mcb.LOW_CONFIDENCE && s.confidence >= 90)
      return false;
    return true;
  });

  const filteredHighProfit = highProfitSignals.filter((s) => {
    if (!mcb.CONSECUTIVE_LOSSES) return false;
    if (!mcb.SERVER) return false;
    if (s.direction === "long" && !mcb.BULLISH) return false;
    if (s.direction === "short" && !mcb.BEARISH) return false;
    if (mcb.HIGH_CONFIDENCE && !mcb.LOW_CONFIDENCE && s.confidence < 90)
      return false;
    return true;
  });

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
                signals={filteredSignals}
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
                signals={filteredSignals}
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
                signals={filteredSignals}
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
                signals={filteredHighProfit}
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
      case "controlroom":
        return <ControlRoomPage />;
      case "profile":
        return (
          <ProfilePage
            currentUser={currentUser}
            onLogin={() => setShowLoginModal(true)}
          />
        );
      case "postpage":
        return <PostPage />;
      case "newspage":
        return <NewsPage />;
      case "aidashboard":
        return <AIDashboardPage />;
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

  const showFooter = !["tracking", "adminpanel"].includes(activeSection);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="bottom-right" />

      {/* Bull/Bear opening animation */}
      {showAnimation && marketSentiment !== "neutral" && (
        <BullBearAnimation
          sentiment={marketSentiment}
          onDone={handleAnimationDone}
        />
      )}

      {/* Hamburger Drawer */}
      <HamburgerDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNav={scrollTo}
        currentUser={currentUser}
      />

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
        onOpenDrawer={() => setDrawerOpen(true)}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode((d) => !d)}
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

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}

export default function App() {
  return (
    <MCBProvider>
      <AppInner />
    </MCBProvider>
  );
}
