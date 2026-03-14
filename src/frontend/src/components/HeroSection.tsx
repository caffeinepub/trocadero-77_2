import { BarChart3, Shield, TrendingUp, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Stats {
  totalSignals: number;
  avgConfidence: number;
  avgProfit: number;
  winRate: number;
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

export default function HeroSection({ stats }: { stats: Stats }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = canvas.offsetWidth;
    let H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;
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
      ctx.strokeStyle = "rgba(212,160,23,0.04)";
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
        ctx.fillStyle = `rgba(212,160,23,${0.1 + p * 0.35})`;
        ctx.fill();
      }
      for (let i = 0; i < 6; i++) {
        const prog = (t * 0.08 + i * 0.17) % 1;
        const row = (i * 3) % ROWS;
        const x = prog * W;
        const y = row * ROW_H + 30;
        const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
        g.addColorStop(0, "rgba(212,160,23,0.85)");
        g.addColorStop(1, "rgba(212,160,23,0)");
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => {
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W;
      canvas.height = H;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const statItems = [
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
            "radial-gradient(ellipse 80% 60% at 50% 40%, oklch(10% 0.02 240 / 0.4) 0%, oklch(8% 0.01 240 / 0.96) 70%)",
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
            AI-Powered Signal Engine v2.7
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-none tracking-tight mb-6"
        >
          <span className="block text-foreground">PRECISION.</span>
          <span className="block gold-gradient">PROFIT.</span>
          <span className="block text-foreground/90">POWER.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-foreground/90 text-lg md:text-xl max-w-2xl mx-auto mb-12"
        >
          AI-driven spot trading signals with institutional-grade accuracy.
          Real-time analysis across 900+ crypto pairs — powered by Trocadero
          77's proprietary signal engine.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {statItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="glass-card gold-border-glow rounded-xl p-4 text-center"
            >
              <item.icon className="w-5 h-5 text-gold mx-auto mb-2" />
              <div className="text-2xl md:text-3xl font-mono font-bold gold-text">
                <Counter
                  target={item.val}
                  suffix={item.suf}
                  decimals={item.dec}
                />
              </div>
              <div className="text-xs text-foreground/70 mt-1">
                {item.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 flex flex-col items-center gap-2"
        >
          <span className="text-xs font-mono text-foreground/55 tracking-widest uppercase">
            Scroll to Signals
          </span>
          <div className="w-px h-12 bg-gradient-to-b from-gold/40 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
