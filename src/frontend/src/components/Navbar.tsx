import { RefreshCw, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface TickerItem {
  symbol: string;
  price: number;
  change: string;
}
interface Props {
  tickerData: TickerItem[];
  activeSection: string;
  onNav: (s: string) => void;
  onRescan: () => void;
  isScanning: boolean;
  scanProgress: { current: number; total: number };
  trackedCount?: number;
}

export default function Navbar({
  tickerData: _tickerData,
  activeSection,
  onNav,
  onRescan,
  isScanning,
  scanProgress,
  trackedCount = 0,
}: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { id: "home", label: "Home" },
    { id: "tradenow", label: "Trade Now" },
    { id: "signals", label: "Active Signals" },
    { id: "highprofit", label: "High Profit" },
    { id: "tracking", label: "Tracking", badge: true },
    { id: "search", label: "Search" },
    { id: "founder", label: "Founder" },
  ];

  const scanLabel =
    isScanning && scanProgress.total > 0
      ? `${scanProgress.current}/${scanProgress.total}`
      : isScanning
        ? "..."
        : "Rescan";

  const fullScanLabel =
    isScanning && scanProgress.total > 0
      ? `Scanning ${scanProgress.current}/${scanProgress.total}...`
      : isScanning
        ? "Scanning..."
        : "Rescan Markets";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-surface-1/95 backdrop-blur-xl border-b border-border"
          : ""
      }`}
    >
      {/* Main bar */}
      <nav className="flex items-center px-2 sm:px-4 md:px-8 h-14 sm:h-16 gap-2 sm:gap-3">
        {/* Logo */}
        <button
          type="button"
          onClick={() => onNav("home")}
          className="flex items-center gap-1.5 sm:gap-2 group shrink-0"
          data-ocid="nav.link"
        >
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gold/10 border border-gold/30 group-hover:bg-gold/20 transition-colors" />
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold relative z-10" />
          </div>
          <div className="leading-none hidden sm:block">
            <div className="text-sm sm:text-base font-display font-bold tracking-tight shimmer-text">
              TROCADERO
            </div>
            <div className="text-[9px] font-mono text-gold/70 tracking-[0.3em]">
              77
            </div>
          </div>
        </button>

        {/* Tab bar — always visible, scrollable on mobile */}
        <div className="flex-1 overflow-x-auto scrollbar-hide min-w-0">
          <div className="flex items-center gap-0.5 min-w-max">
            {links.map((link) => (
              <button
                type="button"
                key={link.id}
                onClick={() => onNav(link.id)}
                data-ocid={`nav.${link.id}.tab`}
                className={`relative px-2 sm:px-3 md:px-5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap min-h-[44px] flex items-center ${
                  activeSection === link.id
                    ? "text-gold"
                    : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {activeSection === link.id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-gold/10 border border-gold/20 rounded-lg"
                    transition={{ type: "spring", duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1 sm:gap-1.5">
                  {link.label}
                  {link.id === "tracking" && trackedCount > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-signal-buy text-white text-[9px] font-bold">
                      {trackedCount}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile rescan button — compact icon-only */}
        <button
          type="button"
          onClick={onRescan}
          disabled={isScanning}
          data-ocid="nav.rescan_button"
          className="flex md:hidden items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold text-[10px] font-mono font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 min-h-[36px] min-w-[44px]"
          title={fullScanLabel}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`}
          />
          <span className="hidden xs:inline">{scanLabel}</span>
        </button>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal-buy/10 border border-signal-buy/30">
            <div className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
            <span className="text-xs font-mono text-signal-buy">LIVE</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-mono text-foreground/85">
            <Zap className="w-3 h-3" />
            AI Engine Active
          </div>
          <button
            type="button"
            onClick={onRescan}
            disabled={isScanning}
            data-ocid="nav.rescan_button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold text-sm font-mono font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`}
            />
            {fullScanLabel}
          </button>
        </div>
      </nav>
    </header>
  );
}
