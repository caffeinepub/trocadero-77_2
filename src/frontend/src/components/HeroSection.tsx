import {
  BarChart3,
  Brain,
  Radio,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { getAIStats, getTopPerformingCoins } from "../lib/aiEngine";
import { getLatestNewsItems, getMarketSentiment } from "../lib/newsEngine";

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

function AILearningDashboard({
  excludedByReputation = 0,
  autoLearned = 0,
  sessionWinRate = 0,
}: {
  excludedByReputation?: number;
  autoLearned?: number;
  sessionWinRate?: number;
}) {
  const [aiStats, setAiStats] = useState(() => getAIStats());
  const [newsItems, setNewsItems] = useState(() => getLatestNewsItems(6));
  const [marketSent, setMarketSent] = useState(() => getMarketSentiment());
  const [topCoins, setTopCoins] = useState(() => getTopPerformingCoins(3));

  useEffect(() => {
    const refresh = () => {
      setAiStats(getAIStats());
      setNewsItems(getLatestNewsItems(6));
      setMarketSent(getMarketSentiment());
      setTopCoins(getTopPerformingCoins(3));
    };
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, []);

  const phaseColor =
    aiStats.marketPhase === "BULL"
      ? "oklch(42% 0.18 145)"
      : aiStats.marketPhase === "BEAR"
        ? "oklch(45% 0.18 25)"
        : "oklch(40% 0.06 240)";

  const sentColor =
    marketSent > 0.1
      ? "oklch(42% 0.18 145)"
      : marketSent < -0.1
        ? "oklch(45% 0.18 25)"
        : "oklch(40% 0.06 240)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.85 }}
      className="mt-8 max-w-3xl mx-auto rounded-2xl relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(97% 0.015 290 / 0.9) 0%, oklch(96% 0.02 270 / 0.9) 100%)",
        border: "1px solid oklch(82% 0.08 290)",
        boxShadow:
          "0 4px 24px oklch(60% 0.15 290 / 0.15), 0 0 0 1px oklch(78% 0.08 290)",
      }}
      data-ocid="hero.ai.panel"
    >
      {/* Circuit breaker warning */}
      {aiStats.circuitActive && (
        <div className="px-5 pt-4">
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-300 animate-pulse">
            <span className="text-sm font-bold text-red-600">
              ⛔ Circuit Breaker Active — AI paused new signals for{" "}
              {aiStats.circuitMinLeft} min (3 consecutive losses detected)
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-4 h-4" style={{ color: "oklch(45% 0.18 290)" }} />
          <span
            className="text-xs font-mono font-bold tracking-widest uppercase"
            style={{ color: "oklch(45% 0.18 290)" }}
          >
            AI Trading Intelligence
          </span>
          <span className="ml-auto text-[10px] font-mono text-foreground/40">
            Live · updates 60s
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "oklch(97% 0.01 240)",
              border: "1px solid oklch(85% 0.04 240)",
            }}
          >
            <div className="text-[10px] font-mono text-foreground/50 mb-0.5">
              Market Phase
            </div>
            <div
              className="text-xs font-mono font-bold"
              style={{ color: phaseColor }}
            >
              {aiStats.marketPhase === "BULL"
                ? "🟢 BULL"
                : aiStats.marketPhase === "BEAR"
                  ? "🔴 BEAR"
                  : "⚪ SIDEWAYS"}{" "}
              <span className="opacity-60 font-normal">
                {aiStats.marketPhaseConfidence}%
              </span>
            </div>
          </div>
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "oklch(97% 0.01 240)",
              border: "1px solid oklch(85% 0.04 240)",
            }}
          >
            <div className="text-[10px] font-mono text-foreground/50 mb-0.5">
              AI Win Rate
            </div>
            <div className="text-xs font-mono font-bold text-foreground/80">
              {aiStats.winRate}%{" "}
              <span className="opacity-50 font-normal">(last 50)</span>
            </div>
          </div>
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "oklch(97% 0.01 240)",
              border: "1px solid oklch(85% 0.04 240)",
            }}
          >
            <div className="text-[10px] font-mono text-foreground/50 mb-0.5">
              Auto-Threshold
            </div>
            <div className="text-xs font-mono font-bold text-foreground/80">
              {aiStats.currentThreshold}%{" "}
              <span
                style={{ color: "oklch(45% 0.18 290)" }}
                className="font-normal"
              >
                ↑
              </span>
            </div>
          </div>
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "oklch(97% 0.01 240)",
              border: "1px solid oklch(85% 0.04 240)",
            }}
          >
            <div className="text-[10px] font-mono text-foreground/50 mb-0.5">
              Outcomes Learned
            </div>
            <div className="text-xs font-mono font-bold text-foreground/80">
              {aiStats.totalLearned + autoLearned}
            </div>
          </div>
        </div>

        {/* News sentiment + top coins row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "oklch(97% 0.02 200)",
              border: "1px solid oklch(85% 0.06 200)",
            }}
          >
            <div className="text-[10px] font-mono text-foreground/50 mb-1">
              📰 News Sentiment
            </div>
            <div
              className="text-xs font-mono font-bold"
              style={{ color: sentColor }}
            >
              {marketSent > 0.1
                ? "Positive 🟢"
                : marketSent < -0.1
                  ? "Negative 🔴"
                  : "Neutral ⚪"}
            </div>
            {newsItems.length > 0 && (
              <div className="text-[10px] font-mono text-foreground/55 mt-1 truncate">
                {newsItems[0].title}
              </div>
            )}
          </div>
          <div
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "oklch(97% 0.01 240)",
              border: "1px solid oklch(85% 0.04 240)",
            }}
          >
            <div className="text-[10px] font-mono text-foreground/50 mb-1">
              Top Performing Coins
            </div>
            {topCoins.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {topCoins.map((c) => (
                  <span
                    key={c.symbol}
                    className="text-[10px] font-mono font-bold"
                    style={{ color: "oklch(42% 0.18 145)" }}
                  >
                    {c.symbol} {Math.round(c.winRate * 100)}%
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[10px] font-mono text-foreground/40">
                Learning from trades...
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: "oklch(96% 0.04 145)",
              border: "1px solid oklch(80% 0.12 145)",
            }}
          >
            <span className="text-sm">📈</span>
            <div>
              <div
                className="text-xs font-mono font-bold"
                style={{ color: "oklch(38% 0.18 145)" }}
              >
                {sessionWinRate}% session
              </div>
              <div className="text-[10px] text-foreground/45">Win Rate</div>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{
              background: "oklch(97% 0.015 270)",
              border: "1px solid oklch(85% 0.07 270)",
            }}
          >
            <span className="text-sm">🛡️</span>
            <div>
              <div
                className="text-xs font-mono font-bold"
                style={{ color: "oklch(40% 0.15 290)" }}
              >
                {excludedByReputation + aiStats.filteredCoins} filtered
              </div>
              <div className="text-[10px] text-foreground/45">AI Blocked</div>
            </div>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl col-span-2 sm:col-span-1"
            style={{
              background: aiStats.circuitActive
                ? "oklch(96% 0.04 25)"
                : "oklch(96% 0.04 145)",
              border: `1px solid ${aiStats.circuitActive ? "oklch(80% 0.12 25)" : "oklch(80% 0.12 145)"}`,
            }}
          >
            <span className="text-sm">⚡</span>
            <div>
              <div
                className="text-xs font-mono font-bold"
                style={{
                  color: aiStats.circuitActive
                    ? "oklch(38% 0.18 25)"
                    : "oklch(38% 0.18 145)",
                }}
              >
                Circuit Breaker: {aiStats.circuitActive ? "ON 🔴" : "OFF 🟢"}
              </div>
              <div className="text-[10px] text-foreground/45">
                Protection System
              </div>
            </div>
          </div>
        </div>

        {/* Live news feed */}
        {newsItems.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] font-mono text-foreground/40 uppercase tracking-wider mb-2">
              Live News Feed
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {newsItems.map((item) => (
                <a
                  key={item.url || item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-black/5 transition-colors cursor-pointer block"
                  style={{
                    background: "oklch(97% 0.01 240)",
                    border: "1px solid oklch(90% 0.02 240)",
                  }}
                >
                  <span
                    className="text-[10px] font-mono font-bold mt-0.5 flex-shrink-0"
                    style={{
                      color:
                        item.sentiment > 0.1
                          ? "oklch(42% 0.18 145)"
                          : item.sentiment < -0.1
                            ? "oklch(45% 0.18 25)"
                            : "oklch(50% 0.06 240)",
                    }}
                  >
                    {item.sentiment > 0.1
                      ? "+"
                      : item.sentiment < -0.1
                        ? "−"
                        : "·"}
                  </span>
                  <span className="text-[10px] font-mono text-foreground/70 leading-snug line-clamp-1">
                    {item.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function HeroSection({
  stats,
  signals,
  marketSentiment: _marketSentiment = "neutral",
  excludedByReputation = 0,
  autoLearned = 0,
  sessionWinRate = 91,
}: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const isBull = (stats.avgChange24h ?? 0) >= 0;
  const bullPct =
    signals && signals.length > 0
      ? Math.round(
          (signals.filter((s) => s.direction === "long").length /
            signals.length) *
            100,
        )
      : 68;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);
    const COL_W = 60;
    const ROW_H = 60;
    const COLS = Math.ceil(W / COL_W) + 1;
    const ROWS = Math.ceil(H / ROW_H) + 1;
    const nodes = Array.from({ length: ROWS * COLS }, (_, k) => ({
      x: (k % COLS) * COL_W + 30,
      y: Math.floor(k / COLS) * ROW_H + 30,
      phase: Math.random() * Math.PI * 2,
    }));
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;
      ctx.strokeStyle = "rgba(180,130,15,0.07)";
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * COL_W, 0);
        ctx.lineTo(c * COL_W, H);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * ROW_H);
        ctx.lineTo(W, r * ROW_H);
        ctx.stroke();
      }
      for (const n of nodes) {
        const p = (Math.sin(t + n.phase) + 1) / 2;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.5 + p * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160,115,10,${0.12 + p * 0.3})`;
        ctx.fill();
      }
      for (let i = 0; i < 6; i++) {
        const prog = (t * 0.08 + i * 0.17) % 1;
        const row = (i * 3) % ROWS;
        const x = prog * W;
        const y = row * ROW_H + 30;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, "rgba(180,130,15,0.5)");
        g.addColorStop(1, "rgba(180,130,15,0)");
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      const d = window.devicePixelRatio || 1;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * d;
      canvas.height = H * d;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const statItems = [
    {
      icon: Radio,
      label: "Markets Scanned",
      val: stats.scannedPairs,
      suf: "",
      dec: 0,
    },
    {
      icon: BarChart3,
      label: "Active Signals",
      val: stats.totalSignals,
      suf: "",
      dec: 0,
    },
    {
      icon: Shield,
      label: "Avg Confidence",
      val: stats.avgConfidence,
      suf: "%",
      dec: 0,
    },
    {
      icon: TrendingUp,
      label: "Avg Profit",
      val: stats.avgProfit,
      suf: "%",
      dec: 1,
    },
    { icon: Zap, label: "Win Rate", val: stats.winRate, suf: "%", dec: 0 },
  ];

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(97% 0.01 240 / 0.3) 0%, oklch(98% 0.005 240 / 0.92) 70%)",
          zIndex: 1,
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
          <span className="text-xs font-mono text-gold tracking-widest uppercase">
            AI-Powered Signal Engine v3.0
          </span>
        </motion.div>

        {/* Market Sentiment Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-mono font-bold border ${
            isBull
              ? "bg-signal-buy/10 border-signal-buy/30 text-signal-buy"
              : "bg-signal-sell/10 border-signal-sell/30 text-signal-sell"
          }`}
        >
          {isBull ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          {isBull
            ? `📈 BULL MARKET — ${bullPct}% of scanned coins trending up`
            : "📉 BEAR MARKET — Shorting opportunities dominate"}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-none tracking-tight mb-6"
        >
          <span className="block text-foreground">PRECISION.</span>
          <span className="block gold-gradient">PROFIT.</span>
          <span className="block text-foreground/75">POWER.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-foreground/65 text-lg md:text-xl max-w-2xl mx-auto mb-12"
        >
          AI-driven spot trading signals with institutional-grade accuracy.
          Real-time analysis across BingX spot markets — powered by Trocadero
          77&apos;s proprietary signal engine with auto-learning.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto"
        >
          {statItems.map((item, i) => (
            <motion.div
              key={item.label}
              data-ocid={`hero.stat.item.${i + 1}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass-card gold-border-glow rounded-xl p-4 text-center"
            >
              <item.icon className="w-5 h-5 mx-auto mb-2 text-gold" />
              <div className="text-2xl md:text-3xl font-mono font-bold gold-text">
                <Counter
                  target={item.val}
                  suffix={item.suf}
                  decimals={item.dec}
                />
              </div>
              <div className="text-xs text-foreground/60 mt-1">
                {item.label}
              </div>
            </motion.div>
          ))}
          {/* Session Wins stat */}
          {(stats.sessionTotal ?? 0) > 0 && (
            <motion.div
              data-ocid="hero.stat.item.6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0 }}
              className="glass-card gold-border-glow rounded-xl p-4 text-center"
            >
              <Brain className="w-5 h-5 mx-auto mb-2 text-gold" />
              <div className="text-2xl font-mono font-bold gold-text">
                {stats.sessionWins}/{stats.sessionTotal}
              </div>
              <div className="text-xs text-foreground/60 mt-1">
                Session Wins
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* AI Learning Dashboard */}
        <AILearningDashboard
          excludedByReputation={excludedByReputation}
          autoLearned={autoLearned}
          sessionWinRate={sessionWinRate}
        />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-mono text-foreground/50 tracking-widest uppercase">
            Scroll to Signals
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-gold/40 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
