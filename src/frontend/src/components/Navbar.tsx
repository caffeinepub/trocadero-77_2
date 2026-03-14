import { Menu, TrendingUp, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
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
}

function fmtPrice(p: number) {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p < 1) return p.toFixed(4);
  return p.toFixed(2);
}

export default function Navbar({ tickerData, activeSection, onNav }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { id: "signals", label: "Signals" },
    { id: "highprofit", label: "High Profit" },
    { id: "founder", label: "Founder" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-surface-1/95 backdrop-blur-xl border-b border-border" : ""}`}
    >
      {/* Ticker */}
      <div className="bg-surface-2 border-b border-border/50 overflow-hidden h-8">
        <div className="flex items-center animate-ticker whitespace-nowrap">
          {[
            ...tickerData.map((t, i) => ({ ...t, _k: `a${i}` })),
            ...tickerData.map((t, i) => ({ ...t, _k: `b${i}` })),
          ].map((item) => {
            const pos = Number.parseFloat(item.change) >= 0;
            return (
              <span
                key={item._k}
                className="inline-flex items-center gap-2 px-6 text-xs font-mono"
              >
                <span className="gold-text font-semibold">{item.symbol}</span>
                <span className="text-foreground/90">
                  ${fmtPrice(item.price)}
                </span>
                <span className={pos ? "text-signal-buy" : "text-signal-sell"}>
                  {pos ? "+" : ""}
                  {item.change}%
                </span>
                <span className="text-border ml-2">│</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Main bar */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-16">
        <button
          type="button"
          onClick={() => onNav("hero")}
          className="flex items-center gap-3 group"
          data-ocid="nav.link"
        >
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gold/10 border border-gold/30 group-hover:bg-gold/20 transition-colors" />
            <TrendingUp className="w-5 h-5 text-gold relative z-10" />
          </div>
          <div className="leading-none">
            <div className="text-lg font-display font-bold tracking-tight shimmer-text">
              TROCADERO
            </div>
            <div className="text-[10px] font-mono text-gold/70 tracking-[0.3em]">
              77
            </div>
          </div>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <button
              type="button"
              key={link.id}
              onClick={() => onNav(link.id)}
              data-ocid={`nav.${link.id}.link`}
              className={`relative px-5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
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
              <span className="relative z-10">{link.label}</span>
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-signal-buy/10 border border-signal-buy/30">
            <div className="w-2 h-2 rounded-full bg-signal-buy animate-pulse" />
            <span className="text-xs font-mono text-signal-buy">LIVE</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-mono text-foreground/85">
            <Zap className="w-3 h-3" />
            AI Engine Active
          </div>
        </div>

        <button
          type="button"
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-border text-foreground/85"
          onClick={() => setOpen((o) => !o)}
          data-ocid="nav.toggle"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden border-t border-border bg-surface-1/98 backdrop-blur-xl px-6 py-4 flex flex-col gap-1"
          >
            {links.map((link) => (
              <button
                type="button"
                key={link.id}
                onClick={() => {
                  onNav(link.id);
                  setOpen(false);
                }}
                data-ocid={`nav.${link.id}.link`}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === link.id
                    ? "text-gold bg-gold/10"
                    : "text-foreground/85"
                }`}
              >
                {link.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
