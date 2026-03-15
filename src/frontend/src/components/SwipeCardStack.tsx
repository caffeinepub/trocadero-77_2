import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

interface SwipeCardStackProps<T> {
  items: T[];
  getKey: (item: T) => string | number;
  renderCard: (item: T, idx: number) => React.ReactNode;
  onAccept?: (item: T) => void;
  onSkip?: (item: T) => void;
  onClick?: (item: T) => void;
  emptyState?: React.ReactNode;
  className?: string;
}

function SwipeItem({
  onAccept,
  onSkip,
  onClick,
  zIndex,
  offset,
  isTop,
  children,
}: {
  onAccept: () => void;
  onSkip: () => void;
  onClick: () => void;
  zIndex: number;
  offset: number;
  isTop: boolean;
  children: React.ReactNode;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const acceptOp = useTransform(x, [0, 80], [0, 1]);
  const skipOp = useTransform(x, [-80, 0], [1, 0]);
  const dragged = useRef(false);
  const dragEndedRecently = useRef(false);

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        zIndex,
        cursor: isTop ? "grab" : "default",
        // Only the top card receives pointer events; background and exiting cards do not
        pointerEvents: isTop ? "auto" : "none",
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: -300, right: 300 }}
      dragElastic={0.8}
      onDragStart={() => {
        dragged.current = false;
      }}
      onDrag={(_, info) => {
        if (Math.abs(info.offset.x) > 10) dragged.current = true;
      }}
      onDragEnd={(_, info) => {
        if (dragged.current) {
          dragEndedRecently.current = true;
          setTimeout(() => {
            dragEndedRecently.current = false;
          }, 100);
        }
        if (info.offset.x > 120) onAccept();
        else if (info.offset.x < -120) onSkip();
      }}
      onClick={() => {
        if (isTop && !dragged.current && !dragEndedRecently.current) onClick();
      }}
      initial={{ opacity: 0, scale: 1 - offset * 0.04, y: offset * 12 }}
      animate={{
        opacity: offset === 0 ? 1 : 0.8,
        scale: 1 - offset * 0.04,
        y: offset * 12,
      }}
      exit={{
        opacity: 0,
        x: -300,
        rotate: -15,
        zIndex: 0,
        transition: { duration: 0.3 },
      }}
      className="absolute w-full select-none"
    >
      {isTop && (
        <>
          <motion.div
            style={{ opacity: acceptOp }}
            className="absolute top-4 right-4 z-20 px-3 py-1.5 rounded-lg bg-signal-buy text-white text-xs font-bold rotate-12 pointer-events-none"
          >
            ACCEPT ✓
          </motion.div>
          <motion.div
            style={{ opacity: skipOp }}
            className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-lg bg-signal-sell text-white text-xs font-bold -rotate-12 pointer-events-none"
          >
            SKIP ✕
          </motion.div>
        </>
      )}
      {children}
    </motion.div>
  );
}

export default function SwipeCardStack<T>({
  items,
  getKey,
  renderCard,
  onAccept,
  onSkip,
  onClick,
  emptyState,
  className = "",
}: SwipeCardStackProps<T>) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible: number[] = [];
  for (let i = 0; i < items.length && visible.length < 3; i++) {
    if (!dismissed.has(i)) visible.push(i);
  }

  const dismissTop = () => {
    if (visible.length === 0) return;
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(visible[0]);
      if (next.size >= items.length) return new Set();
      return next;
    });
  };

  const handleSkip = () => {
    if (visible.length === 0) return;
    if (onSkip && visible[0] !== undefined) onSkip(items[visible[0]]);
    dismissTop();
  };

  const handleAccept = () => {
    if (visible[0] !== undefined) {
      onAccept?.(items[visible[0]]);
      dismissTop();
    }
  };

  const remaining = items.length - dismissed.size;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-full max-w-sm h-[28rem] mb-8">
        {visible.length === 0 ? (
          (emptyState ?? (
            <div
              className="w-full h-full flex flex-col items-center justify-center rounded-2xl border border-border gap-4"
              style={{
                background: "#ffffff",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}
            >
              <div className="text-center">
                <div className="font-display text-lg mb-1 text-foreground">
                  All Reviewed
                </div>
                <div className="text-sm text-foreground/60">
                  Rescan for new opportunities
                </div>
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence>
            {visible
              .slice(0)
              .reverse()
              .map((idx, stackPos) => {
                const offset = visible.length - 1 - stackPos;
                const isTop = offset === 0;
                return (
                  <SwipeItem
                    key={getKey(items[idx])}
                    onAccept={handleAccept}
                    onSkip={handleSkip}
                    onClick={() => onClick?.(items[idx])}
                    zIndex={stackPos + 1}
                    offset={offset}
                    isTop={isTop}
                  >
                    {renderCard(items[idx], idx)}
                  </SwipeItem>
                );
              })}
          </AnimatePresence>
        )}
      </div>

      <div className="flex items-center gap-6">
        <button
          type="button"
          data-ocid="swipe.secondary_button"
          onClick={handleSkip}
          className="w-14 h-14 rounded-full border border-signal-sell/30 bg-signal-sell/10 flex items-center justify-center text-signal-sell hover:bg-signal-sell/20 transition-colors"
          aria-label="Skip"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <div className="text-sm font-mono text-foreground/60">
            {remaining} remaining
          </div>
          <div className="flex gap-1 mt-1 justify-center">
            {["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"]
              .slice(0, Math.min(10, items.length))
              .map((dotKey, i) => (
                <div
                  key={dotKey}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i < dismissed.size ? "bg-border" : "bg-gold/60"
                  }`}
                />
              ))}
          </div>
        </div>
        <button
          type="button"
          data-ocid="swipe.primary_button"
          onClick={handleAccept}
          className="w-14 h-14 rounded-full border border-signal-buy/30 bg-signal-buy/10 flex items-center justify-center text-signal-buy hover:bg-signal-buy/20 transition-colors"
          aria-label="Accept"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
