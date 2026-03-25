import {
  LogIn,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  Shield,
  Sun,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface Props {
  tickerData: { symbol: string; price: number; change: string }[];
  activeSection: string;
  onNav: (s: string) => void;
  onRescan: () => void;
  isScanning: boolean;
  scanProgress: { current: number; total: number };
  trackedCount?: number;
  currentUser?: { username: string; isAdmin: boolean } | null;
  onLogin?: () => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  onOpenDrawer?: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

export default function Navbar({
  activeSection,
  onNav,
  onRescan,
  isScanning,
  scanProgress,
  trackedCount = 0,
  currentUser = null,
  onLogin,
  onLogout,
  onOpenAdmin,
  onOpenDrawer,
  darkMode,
  onToggleDark,
}: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "tracking", label: "Tracking", icon: "📊", badge: true },
    { id: "fasttrades", label: "Fast Trade", icon: "⚡" },
    { id: "tradenow", label: "Trade Now", icon: "🎯" },
    { id: "signals", label: "Active Signals", icon: "📡" },
    { id: "highprofit", label: "High Profit", icon: "💰" },
    { id: "search", label: "Search", icon: "🔍" },
    { id: "founder", label: "Founder", icon: "👤" },
    { id: "controlroom", label: "Control Room", icon: "🏛️" },
    ...(currentUser?.isAdmin
      ? [{ id: "adminpanel", label: "Admin", icon: "⚙️", isAdmin: true }]
      : []),
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
          ? "bg-background/95 backdrop-blur-xl border-b border-border"
          : ""
      }`}
    >
      <nav className="flex items-center px-2 sm:px-4 h-14 sm:h-16 gap-2">
        {/* Hamburger */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-muted shrink-0"
          data-ocid="nav.hamburger.button"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo */}
        <button
          type="button"
          onClick={() => onNav("home")}
          className="flex items-center gap-1.5 group shrink-0"
          data-ocid="nav.link"
        >
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gold/10 border border-gold/30 group-hover:bg-gold/20 transition-colors" />
            <TrendingUp className="w-3.5 h-3.5 text-gold relative z-10" />
          </div>
          <div className="leading-none hidden sm:block">
            <div className="text-sm font-display font-bold tracking-tight shimmer-text">
              TROCADERO
            </div>
            <div className="text-[9px] font-mono text-gold/70 tracking-[0.3em]">
              77
            </div>
          </div>
        </button>

        {/* Tab bar */}
        <div className="flex-1 overflow-x-auto scrollbar-hide min-w-0">
          <div className="flex items-center gap-0.5 min-w-max">
            {links.map((link) => {
              const isAdminTab = "isAdmin" in link && link.isAdmin;
              const isActive = activeSection === link.id;
              return (
                <button
                  type="button"
                  key={link.id}
                  onClick={() => {
                    if (isAdminTab && onOpenAdmin) onOpenAdmin();
                    else onNav(link.id);
                  }}
                  data-ocid={`nav.${link.id}.tab`}
                  className={`relative px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap min-h-[44px] flex items-center gap-1 ${
                    isActive
                      ? isAdminTab
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-gold"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-lg nav-active-shimmer"
                      style={{
                        border: `1px solid ${isAdminTab ? "oklch(72% 0.18 75 / 0.5)" : "oklch(72% 0.18 75 / 0.2)"}`,
                      }}
                      transition={{ type: "spring", duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1">
                    <span className="hidden sm:inline">{link.icon}</span>
                    {link.label}
                    {link.id === "tracking" && trackedCount > 0 && (
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-signal-buy text-white text-[9px] font-bold">
                        {trackedCount}
                      </span>
                    )}
                    {isAdminTab && <Shield className="w-3 h-3" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Dark mode toggle */}
          <button
            type="button"
            onClick={onToggleDark}
            data-ocid="nav.darkmode.toggle"
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-muted"
            title={darkMode ? "Light mode" : "Dark mode"}
            aria-label={
              darkMode ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-gold" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {/* Auth */}
          {currentUser ? (
            <>
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono"
                style={{
                  background: "oklch(62% 0.18 145 / 0.1)",
                  border: "1px solid oklch(62% 0.18 145 / 0.25)",
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-signal-buy" />
                <span className="text-foreground/80 max-w-[80px] truncate">
                  {currentUser.username}
                </span>
                {currentUser.isAdmin && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded text-amber-700 dark:text-amber-400">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onLogout}
                data-ocid="nav.button"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground/60 hover:text-foreground transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              data-ocid="nav.button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all min-h-[36px]"
              style={{
                background: "oklch(75% 0.15 60 / 0.1)",
                border: "1px solid oklch(75% 0.15 60 / 0.25)",
                color: "oklch(45% 0.13 60)",
              }}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Login</span>
            </button>
          )}

          {/* Mobile rescan */}
          <button
            type="button"
            onClick={onRescan}
            disabled={isScanning}
            data-ocid="nav.rescan_button"
            className="flex md:hidden items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold text-[10px] font-mono font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shrink-0 min-h-[36px]"
            title={fullScanLabel}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`}
            />
            <span className="hidden xs:inline">{scanLabel}</span>
          </button>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal-buy/10 border border-signal-buy/30">
              <div className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
              <span className="text-xs font-mono text-signal-buy">LIVE</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-mono text-foreground/85">
              <Zap className="w-3 h-3" />
              AI Active
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
        </div>
      </nav>
    </header>
  );
}
