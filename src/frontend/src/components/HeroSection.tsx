import { Brain, Shield, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Stats {
  totalSignals: number;
  avgConfidence: number;
  avgProfit: number;
  winRate: number;
  scannedPairs: number;
  avgChange24h?: number;
  sessionWins?: number;
  sessionTotal?: number;
}

function Counter({
  target,
  suffix = "",
  decimals = 0,
}: { target: number; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const steps = 60;
    const inc = target / steps;
    const tid = setInterval(() => {
      cur += inc;
      if (cur >= target) {
        setVal(target);
        clearInterval(tid);
      } else setVal(cur);
    }, 1800 / steps);
    return () => clearInterval(tid);
  }, [target]);
  return (
    <span>
      {decimals > 0 ? val.toFixed(decimals) : Math.floor(val)}
      {suffix}
    </span>
  );
}

interface HeroProps {
  stats: Stats;
  signals?: { direction: string }[];
  marketSentiment?: "bullish" | "bearish" | "neutral";
  excludedByReputation?: number;
  autoLearned?: number;
  sessionWinRate?: number;
}

// Floating crypto coin component
function FloatingCoin({
  symbol,
  style,
  animClass,
}: { symbol: string; style: React.CSSProperties; animClass: string }) {
  return (
    <div
      className={`absolute select-none pointer-events-none font-bold rounded-full flex items-center justify-center text-white text-xs ${animClass}`}
      style={{
        width: 44,
        height: 44,
        background:
          "linear-gradient(135deg, oklch(75% 0.15 60), oklch(55% 0.12 55))",
        boxShadow: "0 4px 16px oklch(75% 0.15 60 / 0.3)",
        fontSize: 10,
        fontFamily: "JetBrains Mono, monospace",
        ...style,
      }}
    >
      {symbol}
    </div>
  );
}

export default function HeroSection({
  stats,
  signals = [],
  marketSentiment = "neutral",
}: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState(0);

  useEffect(() => {
    const h = (e: MouseEvent) =>
      setMouseX((e.clientX / window.innerWidth - 0.5) * 20);
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const longCount = signals.filter((s) => s.direction === "long").length;
  const shortCount = signals.filter((s) => s.direction === "short").length;

  const sentimentColor =
    marketSentiment === "bullish"
      ? "oklch(42% 0.18 145)"
      : marketSentiment === "bearish"
        ? "oklch(45% 0.18 25)"
        : "oklch(50% 0.13 60)";

  const coins = [
    {
      symbol: "BTC",
      style: { top: "12%", left: "8%" },
      animClass: "animate-coin-float",
    },
    {
      symbol: "ETH",
      style: { top: "25%", right: "10%" },
      animClass: "animate-coin-float-2",
    },
    {
      symbol: "SOL",
      style: { bottom: "30%", left: "5%" },
      animClass: "animate-coin-float-3",
    },
    {
      symbol: "BNB",
      style: { top: "60%", right: "6%" },
      animClass: "animate-coin-float",
    },
    {
      symbol: "XRP",
      style: { bottom: "15%", right: "15%" },
      animClass: "animate-coin-float-2",
    },
    {
      symbol: "ADA",
      style: { top: "40%", left: "3%" },
      animClass: "animate-coin-float-3",
    },
  ];

  return (
    <section
      ref={heroRef}
      className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-24 pb-16 px-4"
    >
      {/* Floating coins */}
      {coins.map((c) => (
        <FloatingCoin
          key={c.symbol}
          symbol={c.symbol}
          style={c.style}
          animClass={c.animClass}
        />
      ))}

      {/* Subtle grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(oklch(var(--border)) 1px, transparent 1px), linear-gradient(90deg, oklch(var(--border)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.4,
          transform: `translateX(${mouseX * 0.3}px)`,
          transition: "transform 0.1s ease-out",
        }}
      />

      {/* Gradient radial overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(75% 0.15 60 / 0.05) 0%, transparent 70%)",
        }}
      />

      {/* Market sentiment pill */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-semibold"
        style={{
          background: `${sentimentColor}15`,
          border: `1px solid ${sentimentColor}40`,
          color: sentimentColor,
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: sentimentColor,
            animation: "glow-pulse 1.5s ease-in-out infinite",
          }}
        />
        Market: {marketSentiment.toUpperCase()} · {longCount} LONG ·{" "}
        {shortCount} SHORT
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center text-5xl sm:text-6xl md:text-7xl font-display font-bold leading-[0.95] mb-6 max-w-4xl"
      >
        <span className="shimmer-text">TROCADERO</span>
        <br />
        <span className="text-foreground opacity-85">77</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center text-base sm:text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed"
      >
        Institutional-grade AI crypto signals. Real-time analysis across 750+
        BingX pairs. Only the highest-confidence trades surface.
      </motion.p>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl w-full mb-10"
      >
        {[
          {
            label: "Signals Found",
            value: stats.totalSignals,
            suffix: "",
            icon: <Zap className="w-4 h-4" />,
          },
          {
            label: "Avg Confidence",
            value: stats.avgConfidence,
            suffix: "%",
            icon: <Brain className="w-4 h-4" />,
          },
          {
            label: "Pairs Scanned",
            value: stats.scannedPairs,
            suffix: "",
            icon: <TrendingUp className="w-4 h-4" />,
          },
          {
            label: "Win Rate",
            value: stats.winRate,
            suffix: "%",
            icon: <Shield className="w-4 h-4" />,
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 + i * 0.08 }}
            className="rounded-2xl p-4 text-center"
            style={{
              background: "oklch(var(--card))",
              border: "1px solid oklch(var(--border))",
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2"
              style={{
                background: "oklch(75% 0.15 60 / 0.1)",
                color: "oklch(50% 0.13 60)",
              }}
            >
              {stat.icon}
            </div>
            <div
              className="text-2xl font-display font-bold"
              style={{ color: "oklch(50% 0.13 60)" }}
            >
              <Counter target={stat.value} suffix={stat.suffix} decimals={0} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Feature tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {[
          "🤖 AI-Powered Signals",
          "📈 85%+ Confidence Filter",
          "⚡ Real-time Scanning",
          "🛡️ Loss Prevention",
          "📰 News Sentiment",
          "🎯 TP Probability Gate",
        ].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "oklch(var(--muted))",
              border: "1px solid oklch(var(--border))",
              color: "oklch(var(--muted-foreground))",
            }}
          >
            {tag}
          </span>
        ))}
      </motion.div>
    </section>
  );
}
