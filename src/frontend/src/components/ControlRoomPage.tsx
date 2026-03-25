import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useMCB } from "../lib/MCBContext";

interface MCBConfig {
  key: string;
  name: string;
  db: "DB1" | "DB2";
  onMsg: string;
  offMsg: string;
  defaultOn: boolean;
  autoTrip?: boolean;
}

const DB1_MCBS: MCBConfig[] = [
  {
    key: "SERVER",
    name: "SERVER",
    db: "DB1",
    onMsg: "Signal Received",
    offMsg: "Signal Lost",
    defaultOn: true,
  },
  {
    key: "AI",
    name: "AI",
    db: "DB1",
    onMsg: "AI Online",
    offMsg: "AI Failed",
    defaultOn: true,
  },
  {
    key: "UPS",
    name: "UPS",
    db: "DB1",
    onMsg: "Secondary Backup Online",
    offMsg: "Secondary Backup Failed",
    defaultOn: true,
  },
  {
    key: "AC",
    name: "AC",
    db: "DB1",
    onMsg: "Cooling System Activated",
    offMsg: "Cooling System Failed",
    defaultOn: true,
  },
  {
    key: "MARKET",
    name: "MARKET",
    db: "DB1",
    onMsg: "Market Optimiser Online",
    offMsg: "Market Optimiser Crashed",
    defaultOn: true,
  },
  {
    key: "NETWORK",
    name: "NETWORK",
    db: "DB1",
    onMsg: "Network Online",
    offMsg: "Network Error",
    defaultOn: true,
  },
];

const DB2_MCBS: MCBConfig[] = [
  {
    key: "STABILIZER",
    name: "STABILIZER",
    db: "DB2",
    onMsg: "Stabilizer Online",
    offMsg: "Stabilizer Tripped – Market Volatile",
    defaultOn: true,
    autoTrip: true,
  },
  {
    key: "BULLISH",
    name: "BULLISH",
    db: "DB2",
    onMsg: "BUY/LONG Signals Active",
    offMsg: "BUY/LONG Signals Turned Off",
    defaultOn: true,
  },
  {
    key: "BEARISH",
    name: "BEARISH",
    db: "DB2",
    onMsg: "SELL/SHORT Signals Active",
    offMsg: "SELL/SHORT Signals Turned Off",
    defaultOn: true,
  },
  {
    key: "LOW_CONFIDENCE",
    name: "LOW CONF",
    db: "DB2",
    onMsg: "Low Confidence Signals Shown",
    offMsg: "Low Confidence Signals Hidden",
    defaultOn: false,
  },
  {
    key: "HIGH_CONFIDENCE",
    name: "HIGH CONF",
    db: "DB2",
    onMsg: "High Confidence Only Active",
    offMsg: "High Confidence Filter Off",
    defaultOn: true,
  },
  {
    key: "CONSECUTIVE_LOSSES",
    name: "CONSEC LOSS",
    db: "DB2",
    onMsg: "Consecutive Loss Monitor Reset",
    offMsg: "5 Consecutive Losses – Breaker Tripped!",
    defaultOn: true,
    autoTrip: true,
  },
];

// Canvas animation for each MCB action
function MCBAnimation({
  type,
  isOn,
  onDone,
}: { type: string; isOn: boolean; onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);
  const duration = 3000;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = 320;
    canvas.height = 200;
    startRef.current = performance.now();

    function drawGlobe(ctx: CanvasRenderingContext2D, p: number, on: boolean) {
      ctx.clearRect(0, 0, 320, 200);
      const cx = 160;
      const cy = 100;
      const r = 60;
      ctx.strokeStyle = on ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      // Latitude lines
      for (let i = 1; i < 4; i++) {
        const y = cy - r + (r * 2 * i) / 4;
        const hw = Math.sqrt(Math.max(0, r * r - (y - cy) ** 2));
        ctx.beginPath();
        ctx.ellipse(cx, y, hw * 0.8, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Connection lines
      const numLines = on ? Math.floor(8 * p) : Math.floor(8 * (1 - p));
      ctx.strokeStyle = on ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 1;
      for (let i = 0; i < numLines; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = cx + Math.cos(angle) * r;
        const y1 = cy + Math.sin(angle) * r;
        const x2 = cx + Math.cos(angle) * (r + 40);
        const y2 = cy + Math.sin(angle) * (r + 40);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.fillStyle = on ? "#22c55e" : "#ef4444";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(on ? "CONNECTING..." : "DISCONNECTING...", cx, 185);
    }

    function drawNeural(ctx: CanvasRenderingContext2D, p: number, on: boolean) {
      ctx.clearRect(0, 0, 320, 200);
      const nodes = [
        [80, 40],
        [160, 40],
        [240, 40],
        [120, 100],
        [200, 100],
        [160, 160],
      ];
      const activeCount = on
        ? Math.ceil(nodes.length * p)
        : Math.ceil(nodes.length * (1 - p));
      // Connections
      ctx.strokeStyle = on ? "#60a5fa" : "#6b7280";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        for (let j = 3; j < 5; j++) {
          ctx.beginPath();
          ctx.moveTo(nodes[i][0], nodes[i][1]);
          ctx.lineTo(nodes[j][0], nodes[j][1]);
          ctx.stroke();
        }
      }
      for (const n of nodes.slice(3, 5)) {
        ctx.beginPath();
        ctx.moveTo(n[0], n[1]);
        ctx.lineTo(nodes[5][0], nodes[5][1]);
        ctx.stroke();
      }
      // Nodes
      nodes.forEach((n, i) => {
        const active = i < activeCount;
        ctx.beginPath();
        ctx.arc(n[0], n[1], 12, 0, Math.PI * 2);
        ctx.fillStyle = active ? (on ? "#3b82f6" : "#ef4444") : "#374151";
        ctx.fill();
        if (active && on) {
          ctx.beginPath();
          ctx.arc(
            n[0],
            n[1],
            16 + Math.sin(p * Math.PI * 4 + i) * 4,
            0,
            Math.PI * 2,
          );
          ctx.strokeStyle = "#60a5fa60";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
      ctx.fillStyle = on ? "#3b82f6" : "#6b7280";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(on ? "AI ONLINE" : "AI OFFLINE", 160, 195);
    }

    function drawFan(ctx: CanvasRenderingContext2D, p: number, on: boolean) {
      ctx.clearRect(0, 0, 320, 200);
      const cx = 160;
      const cy = 95;
      const rotation = on ? p * Math.PI * 8 : (1 - p) * Math.PI * 8;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2);
        ctx.fillStyle = on ? "#06b6d4" : "#6b7280";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.ellipse(20, -35, 15, 35, -0.3, 0, Math.PI);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      ctx.fillStyle = on ? "#06b6d4" : "#ef4444";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(on ? "COOLING ACTIVE" : "COOLING OFF", cx, 180);
    }

    function drawChart(ctx: CanvasRenderingContext2D, p: number, on: boolean) {
      ctx.clearRect(0, 0, 320, 200);
      const points = on
        ? [30, 28, 32, 26, 35, 30, 38, 32, 42, 35, 50, 45, 55, 52, 60, 58]
        : [60, 58, 55, 52, 50, 45, 42, 35, 38, 32, 35, 30, 26, 22, 18, 10];
      const visibleCount = Math.max(2, Math.floor(points.length * p));
      ctx.strokeStyle = on ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.slice(0, visibleCount).forEach((v, i) => {
        const x = 20 + i * 18;
        const y = 160 - v * 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.fillStyle = on ? "#22c55e" : "#ef4444";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(on ? "MARKET RISING" : "MARKET CRASHED", 160, 190);
    }

    function drawWifi(ctx: CanvasRenderingContext2D, p: number, on: boolean) {
      ctx.clearRect(0, 0, 320, 200);
      const cx = 160;
      const cy = 130;
      const bars = 4;
      const visibleBars = on ? Math.ceil(bars * p) : Math.ceil(bars * (1 - p));
      for (let i = 0; i < bars; i++) {
        const r = 20 + i * 22;
        ctx.beginPath();
        ctx.arc(cx, cy, r, Math.PI * 1.25, Math.PI * 1.75);
        ctx.strokeStyle =
          i < visibleBars ? (on ? "#22c55e" : "#ef4444") : "#374151";
        ctx.lineWidth = 5;
        ctx.stroke();
      }
      ctx.fillStyle = on ? "#22c55e" : "#6b7280";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(on ? "NETWORK ONLINE" : "NETWORK ERROR", cx, 180);
    }

    function drawBattery(
      ctx: CanvasRenderingContext2D,
      p: number,
      on: boolean,
    ) {
      ctx.clearRect(0, 0, 320, 200);
      const bx = 90;
      const by = 70;
      const bw = 140;
      const bh = 70;
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = "#9ca3af";
      ctx.fillRect(bx + bw, by + bh * 0.25, 10, bh * 0.5);
      const level = on ? p : 1 - p;
      ctx.fillStyle =
        level > 0.5 ? "#22c55e" : level > 0.25 ? "#f59e0b" : "#ef4444";
      ctx.fillRect(bx + 4, by + 4, (bw - 8) * level, bh - 8);
      ctx.fillStyle = on ? "#22c55e" : "#ef4444";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(on ? "BACKUP ONLINE" : "BACKUP FAILED", 160, 170);
    }

    function drawDefault(
      ctx: CanvasRenderingContext2D,
      _p: number,
      on: boolean,
    ) {
      ctx.clearRect(0, 0, 320, 200);
      ctx.fillStyle = on ? "#22c55e" : "#ef4444";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(on ? "✓ ONLINE" : "✗ OFFLINE", 160, 110);
    }

    function loop(now: number) {
      const elapsed = now - startRef.current;
      const p = Math.min(elapsed / duration, 1);
      const fn =
        type === "SERVER"
          ? drawGlobe
          : type === "AI"
            ? drawNeural
            : type === "AC"
              ? drawFan
              : type === "MARKET"
                ? drawChart
                : type === "NETWORK"
                  ? drawWifi
                  : type === "UPS"
                    ? drawBattery
                    : drawDefault;
      fn(ctx!, p, isOn);
      if (p < 1) rafRef.current = requestAnimationFrame(loop);
      else onDone();
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [type, isOn, onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ maxWidth: 320, height: 200 }}
    />
  );
}

interface MCBSwitchProps {
  config: MCBConfig;
  isOn: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function MCBSwitch({ config, isOn, disabled, onToggle }: MCBSwitchProps) {
  const [flipping, setFlipping] = useState(false);

  const handleClick = () => {
    if (disabled || flipping) return;
    setFlipping(true);
    setTimeout(() => {
      setFlipping(false);
      onToggle();
    }, 400);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* MCB body */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || flipping}
        className="relative w-14 h-20 rounded-lg flex flex-col items-center justify-between pb-2 pt-2 transition-all cursor-pointer disabled:cursor-not-allowed"
        style={{
          background: isOn
            ? "linear-gradient(180deg, #1e3a1e 0%, #2d4a2d 100%)"
            : "linear-gradient(180deg, #3a1e1e 0%, #4a2d2d 100%)",
          border: `2px solid ${isOn ? "#22c55e" : "#ef4444"}`,
          boxShadow: isOn
            ? "0 0 12px rgba(34,197,94,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
            : "0 0 12px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
          animation: flipping ? "mcb-flip 0.4s ease-in-out" : undefined,
          transformStyle: "preserve-3d",
        }}
        data-ocid={`controlroom.${config.key.toLowerCase()}.toggle`}
        title={`${config.name}: ${isOn ? "ON" : "OFF"}`}
      >
        {/* LED indicator */}
        <div
          className="w-4 h-4 rounded-full"
          style={{
            background: isOn ? "#22c55e" : "#ef4444",
            boxShadow: isOn ? "0 0 8px #22c55e" : "0 0 8px #ef4444",
            animation: isOn
              ? "glow-pulse 1.5s ease-in-out infinite"
              : undefined,
          }}
        />
        {/* Toggle lever */}
        <div
          className="w-8 h-10 rounded-md flex items-center justify-center text-white font-bold text-xs"
          style={{
            background: isOn
              ? "linear-gradient(180deg, #16a34a, #15803d)"
              : "linear-gradient(180deg, #dc2626, #b91c1c)",
            transform: `rotate(${isOn ? "0deg" : "8deg"})`,
            transition: "transform 0.2s ease, background 0.2s ease",
          }}
        >
          {isOn ? "I" : "O"}
        </div>
      </button>
      {/* Label */}
      <div
        className="text-[9px] font-mono font-bold text-center leading-tight"
        style={{ color: isOn ? "#22c55e" : "#ef4444" }}
      >
        {config.name}
      </div>
    </div>
  );
}

function DBPanel({
  title,
  mcbs,
  mcbStates,
  onToggle,
  busy,
}: {
  title: string;
  mcbs: MCBConfig[];
  mcbStates: Record<string, boolean>;
  onToggle: (key: string) => void;
  busy: string | null;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background:
          "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        border: "2px solid #334155",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        perspective: "400px",
      }}
    >
      {/* Panel header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1">
          {["#ef4444", "#f59e0b", "#22c55e"].map((c) => (
            <div
              key={c}
              className="w-3 h-3 rounded-full"
              style={{ background: c, boxShadow: `0 0 6px ${c}` }}
            />
          ))}
        </div>
        <div
          className="font-mono font-bold text-sm"
          style={{ color: "#94a3b8" }}
        >
          {title}
        </div>
        <div className="ml-auto text-xs font-mono" style={{ color: "#64748b" }}>
          DISTRIBUTION BOARD
        </div>
      </div>

      {/* Rail with breakers */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "linear-gradient(180deg, #0d1117 0%, #161b22 100%)",
          border: "1px solid #30363d",
        }}
      >
        <div className="flex gap-3 flex-wrap justify-center">
          {mcbs.map((cfg) => (
            <MCBSwitch
              key={cfg.key}
              config={cfg}
              isOn={mcbStates[cfg.key] ?? cfg.defaultOn}
              disabled={busy !== null && busy !== cfg.key}
              onToggle={() => onToggle(cfg.key)}
            />
          ))}
        </div>
      </div>

      {/* Bottom rail */}
      <div
        className="mt-3 h-2 rounded-full"
        style={{
          background: "linear-gradient(90deg, #1e3a5f, #2563eb, #1e3a5f)",
        }}
      />
    </div>
  );
}

export default function ControlRoomPage() {
  const { mcb, toggle } = useMCB();
  const [flicker, setFlicker] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [animation, setAnimation] = useState<{
    type: string;
    isOn: boolean;
  } | null>(null);
  const [warning, setWarning] = useState<{ msg: string; color: string } | null>(
    null,
  );

  // Opening flicker
  useEffect(() => {
    const t = setTimeout(() => setFlicker(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleToggle = useCallback(
    (key: string) => {
      const newState = !mcb[key as keyof typeof mcb];
      toggle(key as keyof typeof mcb);
      setBusy(key);

      const cfgAll = [...DB1_MCBS, ...DB2_MCBS];
      const cfg = cfgAll.find((c) => c.key === key);
      if (!cfg) {
        setBusy(null);
        return;
      }

      const msg = newState ? cfg.onMsg : cfg.offMsg;
      const color = newState ? "#22c55e" : "#ef4444";

      setWarning({ msg, color });
      setAnimation({ type: key, isOn: newState });

      if (newState) toast.success(msg);
      else toast.error(msg);

      setTimeout(() => setWarning(null), 3000);
    },
    [mcb, toggle],
  );

  const allStates = mcb as unknown as Record<string, boolean>;

  return (
    <div
      className="min-h-screen py-20 px-4"
      style={{
        filter: flicker ? undefined : undefined,
        animation: flicker
          ? "blink-light 0.25s ease-in-out infinite"
          : undefined,
        transition: "filter 0.5s ease",
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            {(["#ef4444", "#22c55e", "#3b82f6"] as const).map((c, idx) => (
              <div
                key={c}
                className="w-4 h-4 rounded-full"
                style={{
                  background: c,
                  boxShadow: `0 0 10px ${c}`,
                  animation: flicker
                    ? undefined
                    : `glow-pulse ${1.5 + idx * 0.3}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>
          <h1 className="text-4xl font-display font-bold mb-2">Control Room</h1>
          <p className="text-muted-foreground text-sm">
            Distribution board management system
          </p>
        </div>

        {/* Warning Banner */}
        <AnimatePresence>
          {warning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 px-5 py-4 rounded-xl text-center font-bold text-sm"
              style={{
                background: `${warning.color}20`,
                border: `2px solid ${warning.color}60`,
                color: warning.color,
                boxShadow: `0 0 20px ${warning.color}30`,
              }}
              data-ocid="controlroom.warning.toast"
            >
              {warning.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animation canvas */}
        <AnimatePresence>
          {animation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 rounded-2xl overflow-hidden flex justify-center"
              style={{ background: "#0d1117", border: "1px solid #30363d" }}
            >
              <MCBAnimation
                type={animation.type}
                isOn={animation.isOn}
                onDone={() => {
                  setAnimation(null);
                  setBusy(null);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* DB1 */}
        <div className="mb-6">
          <DBPanel
            title="DB1 — MAIN DISTRIBUTION BOARD"
            mcbs={DB1_MCBS}
            mcbStates={allStates}
            onToggle={handleToggle}
            busy={busy}
          />
        </div>

        {/* DB2 */}
        <div className="mb-6">
          <DBPanel
            title="DB2 — MARKET DISTRIBUTION BOARD"
            mcbs={DB2_MCBS}
            mcbStates={allStates}
            onToggle={handleToggle}
            busy={busy}
          />
        </div>

        {/* Status legend */}
        <div
          className="rounded-xl p-4 mt-4"
          style={{
            background: "oklch(var(--card))",
            border: "1px solid oklch(var(--border))",
          }}
        >
          <div className="flex flex-wrap gap-4 text-xs">
            {[...DB1_MCBS, ...DB2_MCBS].map((cfg) => (
              <div key={cfg.key} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background:
                      (allStates[cfg.key] ?? cfg.defaultOn)
                        ? "#22c55e"
                        : "#ef4444",
                  }}
                />
                <span className="font-mono text-muted-foreground">
                  {cfg.name}
                </span>
                <span
                  className="font-semibold"
                  style={{
                    color:
                      (allStates[cfg.key] ?? cfg.defaultOn)
                        ? "#22c55e"
                        : "#ef4444",
                  }}
                >
                  {(allStates[cfg.key] ?? cfg.defaultOn) ? "ON" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
