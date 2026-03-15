import { useCallback, useRef, useState } from "react";
import type { SignalData } from "../hooks/useCryptoSignals";

interface SignalCarouselProps {
  signals: SignalData[];
  onSelectSignal: (signal: SignalData) => void;
  renderCard: (signal: SignalData, index: number) => React.ReactNode;
}

const SWIPE_THRESHOLD = 50;
const TAP_THRESHOLD = 10;
const CARD_WIDTH_PERCENT = 85;
const CARD_GAP = 12;

export function SignalCarousel({
  signals,
  onSelectSignal,
  renderCard,
}: SignalCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef(0);
  const pointerStartY = useRef(0);
  const currentDragX = useRef(0);
  const isDragStarted = useRef(false);
  const isHorizontalDrag = useRef<boolean | null>(null);

  const clampedIndex = Math.min(currentIndex, Math.max(0, signals.length - 1));

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, signals.length - 1)));
      setDragOffset(0);
      setIsDragging(false);
    },
    [signals.length],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (signals.length === 0) return;
    isDragStarted.current = true;
    isHorizontalDrag.current = null;
    pointerStartX.current = e.clientX;
    pointerStartY.current = e.clientY;
    currentDragX.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragStarted.current) return;
    const dx = e.clientX - pointerStartX.current;
    const dy = e.clientY - pointerStartY.current;

    if (
      isHorizontalDrag.current === null &&
      (Math.abs(dx) > 5 || Math.abs(dy) > 5)
    ) {
      isHorizontalDrag.current = Math.abs(dx) > Math.abs(dy);
    }

    if (isHorizontalDrag.current) {
      e.preventDefault();
      currentDragX.current = dx;
      setIsDragging(Math.abs(dx) > TAP_THRESHOLD);
      setDragOffset(dx);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragStarted.current) return;
    isDragStarted.current = false;
    const totalDrag = e.clientX - pointerStartX.current;
    const wasDragging = Math.abs(totalDrag) > TAP_THRESHOLD;

    if (!wasDragging) {
      const target = e.target as HTMLElement;

      // If the tap landed on a button inside the card (e.g. Track Trade button),
      // let the button handle its own click — do NOT open the detail modal.
      const tappedButton = target.closest("button");
      if (tappedButton && tappedButton !== e.currentTarget) {
        setDragOffset(0);
        setIsDragging(false);
        isHorizontalDrag.current = null;
        currentDragX.current = 0;
        return;
      }

      // Tap on card body — open detail
      const cardEl = target.closest(
        "[data-carousel-index]",
      ) as HTMLElement | null;
      if (cardEl) {
        const idx = Number(cardEl.dataset.carouselIndex);
        if (!Number.isNaN(idx) && signals[idx]) {
          onSelectSignal(signals[idx]);
        }
      }
    } else if (isHorizontalDrag.current) {
      if (totalDrag < -SWIPE_THRESHOLD && clampedIndex < signals.length - 1) {
        goTo(clampedIndex + 1);
      } else if (totalDrag > SWIPE_THRESHOLD && clampedIndex > 0) {
        goTo(clampedIndex - 1);
      } else {
        setDragOffset(0);
        setIsDragging(false);
      }
    } else {
      setDragOffset(0);
      setIsDragging(false);
    }

    isHorizontalDrag.current = null;
    currentDragX.current = 0;
  };

  if (signals.length === 0) return null;

  const containerWidth = containerRef.current?.clientWidth ?? 320;
  const cardWidth = (containerWidth * CARD_WIDTH_PERCENT) / 100;
  const cardStep = cardWidth + CARD_GAP;
  const baseOffset = -clampedIndex * cardStep;
  const peekOffset = (containerWidth - cardWidth) / 2 - CARD_GAP;
  const trackX = baseOffset + (isDragging ? dragOffset : 0) + peekOffset;
  const showDots = signals.length <= 8;

  return (
    <div className="w-full select-none">
      <div
        ref={containerRef}
        className="overflow-hidden w-full"
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          isDragStarted.current = false;
          setDragOffset(0);
          setIsDragging(false);
        }}
      >
        <div
          style={{
            display: "flex",
            gap: `${CARD_GAP}px`,
            transform: `translateX(${trackX}px)`,
            transition: isDragging ? "none" : "transform 300ms ease",
            willChange: "transform",
          }}
        >
          {signals.map((signal, index) => (
            <div
              key={signal.id}
              data-carousel-index={index}
              style={{
                width: `${cardWidth}px`,
                flexShrink: 0,
                cursor: "pointer",
                opacity: Math.abs(index - clampedIndex) > 1 ? 0.5 : 1,
                transition: isDragging ? "none" : "opacity 300ms ease",
              }}
            >
              {renderCard(signal, index)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center mt-4 gap-2">
        {showDots ? (
          signals.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              className="transition-all duration-200 rounded-full"
              style={{
                width: i === clampedIndex ? "20px" : "6px",
                height: "6px",
                background:
                  i === clampedIndex
                    ? "oklch(52% 0.15 60)"
                    : "oklch(60% 0.02 60 / 0.4)",
              }}
              aria-label={`Go to card ${i + 1}`}
            />
          ))
        ) : (
          <span className="text-xs font-mono text-foreground/50">
            {clampedIndex + 1} / {signals.length}
          </span>
        )}
      </div>
    </div>
  );
}
