import { useEffect, useRef, useState } from "react";

interface Props {
  sentiment: "bullish" | "bearish" | "neutral";
  onDone: () => void;
}

export default function BullBearAnimation({ sentiment, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [phase, setPhase] = useState<"blink" | "animate" | "fadeout">("blink");
  const [opacity, setOpacity] = useState(1);
  const startRef = useRef<number>(0);

  // Phase 1: blink for 2s
  useEffect(() => {
    if (sentiment === "neutral") {
      onDone();
      return;
    }
    const t = setTimeout(() => setPhase("animate"), 2000);
    return () => clearTimeout(t);
  }, [sentiment, onDone]);

  // Phase 2: animate for 5s, then fadeout
  useEffect(() => {
    if (phase !== "animate") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    startRef.current = performance.now();
    const duration = 5000;

    function drawBull(ctx: CanvasRenderingContext2D, progress: number) {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      // Bull comes from far (small) to close (large)
      const scale = 0.05 + progress * 1.6;
      const breathe =
        progress > 0.85
          ? Math.sin(((progress - 0.85) / 0.15) * Math.PI * 3) * 0.08
          : 0;
      const finalScale = scale + breathe;

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(finalScale, finalScale);

      // Body
      const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, 120);
      grad.addColorStop(0, "#f5a623");
      grad.addColorStop(0.5, "#c8821a");
      grad.addColorStop(1, "#8b5e0a");
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.ellipse(0, 10, 90, 65, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(-70, -20, 50, 40, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Horns
      ctx.strokeStyle = "#f5a623";
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-90, -48);
      ctx.quadraticCurveTo(-110, -90, -80, -100);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-50, -55);
      ctx.quadraticCurveTo(-30, -95, -10, -85);
      ctx.stroke();

      // Eye
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-80, -30, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(-78, -30, 4, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.strokeStyle = "#a06010";
      ctx.lineWidth = 18;
      ctx.lineCap = "round";
      const legAngle = Math.sin(progress * Math.PI * 6) * 0.2;
      [
        [-50, 65],
        [-15, 65],
        [20, 65],
        [55, 65],
      ].forEach(([x, y], i) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i % 2 === 0 ? legAngle : -legAngle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 55);
        ctx.stroke();
        ctx.restore();
      });

      // Tail
      ctx.strokeStyle = "#c8821a";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(88, 0);
      ctx.quadraticCurveTo(120, -20, 110, -50);
      ctx.stroke();

      // Breath out steam
      if (progress > 0.8) {
        const steamAlpha = (progress - 0.8) / 0.2;
        ctx.globalAlpha = steamAlpha * 0.7;
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 5; i++) {
          const sx = -120 + i * 5;
          const sy = -30 - i * 15 - Math.sin(progress * 10 + i) * 8;
          const sr = 4 + i * 3;
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // BULL text
      ctx.font = "bold 60px sans-serif";
      const textGrad = ctx.createLinearGradient(-80, 140, 80, 160);
      textGrad.addColorStop(0, "#f5a623");
      textGrad.addColorStop(1, "#22c55e");
      ctx.fillStyle = textGrad;
      ctx.textAlign = "center";
      ctx.fillText("BULL", 0, 170);

      ctx.restore();
    }

    function drawBear(ctx: CanvasRenderingContext2D, progress: number) {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx.clearRect(0, 0, w, h);

      // Bear comes from right edge, moves left
      const startX = w * 0.85;
      const endX = w * 0.15;
      const x = startX + (endX - startX) * progress;
      const y = h * 0.5;
      const scale = 0.4 + progress * 0.8;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);

      // Body
      const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, 100);
      grad.addColorStop(0, "#5a3020");
      grad.addColorStop(1, "#2a1208");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 10, 85, 70, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.ellipse(80, -20, 55, 48, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.beginPath();
      ctx.arc(55, -62, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(95, -65, 18, 0, Math.PI * 2);
      ctx.fill();

      // Eye - angry
      ctx.fillStyle = "#ff3333";
      ctx.beginPath();
      ctx.arc(88, -28, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(90, -28, 5, 0, Math.PI * 2);
      ctx.fill();

      // Scratch marks (claw)
      if (progress > 0.4) {
        const scrAlpha = Math.min(1, (progress - 0.4) / 0.3);
        ctx.globalAlpha = scrAlpha;
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        const clawX = 120;
        const clawY = -50;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(clawX - 10 + i * 12, clawY);
          ctx.lineTo(clawX - 20 + i * 15, clawY + 80);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // BEAR text
      ctx.font = "bold 60px sans-serif";
      const textGrad = ctx.createLinearGradient(-80, 140, 80, 160);
      textGrad.addColorStop(0, "#ff4444");
      textGrad.addColorStop(1, "#cc0000");
      ctx.fillStyle = textGrad;
      ctx.textAlign = "center";
      ctx.fillText("BEAR", 0, 170);

      ctx.restore();

      // Blood drip effect after scratch
      if (progress > 0.6) {
        const bloodAlpha = Math.min(0.6, (progress - 0.6) / 0.2);
        ctx.globalAlpha = bloodAlpha;
        const numDrops = 8;
        for (let i = 0; i < numDrops; i++) {
          const bx = x + (70 + i * 40) * scale;
          const by = 0 + (progress - 0.6) * 300 + i * 30;
          ctx.fillStyle = "#cc0000";
          ctx.beginPath();
          ctx.ellipse(bx, by, 4, 10, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    function loop(now: number) {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      if (sentiment === "bullish") {
        drawBull(ctx!, progress);
      } else {
        drawBear(ctx!, progress);
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(loop);
      } else {
        setPhase("fadeout");
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, sentiment]);

  // Phase 3: fade out
  useEffect(() => {
    if (phase !== "fadeout") return;
    let start = 0;
    const fadeDuration = 800;
    const fade = (now: number) => {
      if (!start) start = now;
      const p = Math.min((now - start) / fadeDuration, 1);
      setOpacity(1 - p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(fade);
      } else {
        onDone();
      }
    };
    rafRef.current = requestAnimationFrame(fade);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, onDone]);

  if (sentiment === "neutral") return null;

  const blinkColor =
    sentiment === "bullish" ? "rgba(34,197,94," : "rgba(239,68,68,";

  return (
    <div
      className="fixed inset-0 z-[200] pointer-events-none"
      style={{ opacity }}
    >
      {/* Blink overlay */}
      {phase === "blink" && (
        <div
          className="absolute inset-0"
          style={{
            background: `${blinkColor}0.45)`,
            animation: "screen-blink-green 0.4s ease-in-out infinite",
          }}
        />
      )}

      {/* Canvas animation */}
      {(phase === "animate" || phase === "fadeout") && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ background: "transparent" }}
        />
      )}
    </div>
  );
}
