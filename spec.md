# Trocadero 77

## Current State
The app generates crypto trading signals using seeded randomness + technical indicator rules. The main complaint is that signals sometimes go to SL instead of TP (trades go wrong), the countdown timer may show inaccurate estimates, and the Fast Trading section needs faster, more reliable TP hits.

## Requested Changes (Diff)

### Add
- Stricter momentum alignment: LONG signals only when 24h change > -1% (coin not in active downtrend), SHORT signals only when 24h change < 1%
- Require 1h price change to be positive for LONG signals (if available)
- TP probability threshold raised to 78% (from 72%) for all main sections
- Base confidence floor raised to 87% (from 85%)

### Modify
- `generateSignals()` in `useCryptoSignals.ts`: tighten momentum checks so LONG signals require change24h > -1 (not -3), and only allow if 1h price trend is flat or positive when 1h data is available
- Fast Trading section: only show BUY signals, max TP distance 4% (not 10%), require change24h > 0 (coin must be in positive territory today)
- TP Probability gate in `aiEngine.ts`: raise minimum from 72 to 78 for shouldShowSignal
- `computeSecsToTP` in `SignalDetail.tsx`: use hourlyVelocity = max(2.0, absChange24h / 6) for more conservative (realistic) countdown estimates
- Signal ID stability: already using hourly bucket, keep as-is

### Remove
- Nothing removed

## Implementation Plan
1. In `useCryptoSignals.ts` `generateSignals()`: change `momentumAligned` check for LONG to require `change24h > -1` (not -3), and add 1h check: if `priceChange1h` exists and < -0.5, skip LONG signal
2. For Fast Trading filter in `FastTradingSection.tsx`: add requirement that `change24h > 0`
3. In `aiEngine.ts` `shouldShowSignal()`: change TP probability minimum from 72 to 78
4. In `SignalDetail.tsx` `computeSecsToTP`: change divisor from 8 to 6 for more conservative hourly velocity
5. In `useCryptoSignals.ts` tighten TP max distance for all signals: change `maxProfit` from 0.10 to 0.07 (7% max) to keep TPs reachable
