import { Toaster } from "@/components/ui/sonner";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import FounderSection from "./components/FounderSection";
import HeroSection from "./components/HeroSection";
import HighProfitSection from "./components/HighProfitSection";
import Navbar from "./components/Navbar";
import SignalCardSection from "./components/SignalCard";
import SignalDetail from "./components/SignalDetail";
import { useCryptoSignals } from "./hooks/useCryptoSignals";
import type { SignalData } from "./hooks/useCryptoSignals";

export default function App() {
  const {
    signals,
    highProfitSignals,
    isScanning,
    lastScanTime,
    rescan,
    markSignalAccuracy,
    tickerData,
    stats,
  } = useCryptoSignals();
  const [selectedSignal, setSelectedSignal] = useState<SignalData | null>(null);
  const [activeSection, setActiveSection] = useState("hero");

  const scrollTo = useCallback((id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleRescan = useCallback(async () => {
    toast.loading("Scanning 900+ pairs...", { id: "rescan" });
    await rescan();
    toast.success("Signals refreshed!", { id: "rescan" });
  }, [rescan]);

  const handleMarkAccuracy = useCallback(
    (id: string, hit: boolean) => {
      markSignalAccuracy(id, hit);
      toast.success(hit ? "Marked as target hit ✓" : "Marked as missed");
      setSelectedSignal((prev) =>
        prev?.id === id ? { ...prev, hitTarget: hit } : prev,
      );
    },
    [markSignalAccuracy],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="bottom-right" />
      <Navbar
        tickerData={tickerData}
        activeSection={activeSection}
        onNav={scrollTo}
      />

      <main>
        <HeroSection stats={stats} />
        <SignalCardSection
          signals={signals}
          onSelectSignal={setSelectedSignal}
          onRescan={handleRescan}
          isScanning={isScanning}
          lastScanTime={lastScanTime}
        />
        <HighProfitSection signals={highProfitSignals} />
        <FounderSection />
      </main>

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
          <div className="text-xs text-foreground/85 text-center">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold/80 hover:text-gold transition-colors"
            >
              caffeine.ai
            </a>
          </div>
          <div className="text-xs text-foreground/80 font-mono">
            Trading signals carry risk. DYOR.
          </div>
        </div>
      </footer>

      <SignalDetail
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
        onMarkAccuracy={handleMarkAccuracy}
      />
    </div>
  );
}
