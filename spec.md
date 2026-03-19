# Trocadero 77 -- Fully Enhanced AI Trading System

## Current State
The app has a basic AI layer that:
- Auto-learns from TP/SL hits on tracked trades
- Blacklists poor-performing coins
- Applies a basic market sentiment filter
- Shows dump risk warnings
- Displays an AI Intelligence panel
Confidence threshold is fixed at 85%. No news integration. No pattern learning. No TP probability scoring.

## Requested Changes (Diff)

### Add
- **aiEngine.ts** -- Centralized AI brain module with:
  - Pattern learning: records which RSI ranges, MACD states, volume conditions, and time-of-day correlate with TP hits
  - TP probability scoring: composite score predicting likelihood TP will be hit (shown on card as % TP Probability)
  - Auto-adjusting confidence threshold: if win rate drops below 70%, threshold rises to 90%; if above 85%, can drop to 83%
  - Coin reputation system: tracks per-coin TP hit rate, filters coins below 60% hit rate
  - Hourly pattern weights: learns which hours of day produce winning signals
  - Category reputation: layer-1, DeFi, meme -- suppresses underperforming categories
  - Consecutive loss guard: if 3+ tracked losses in a row, halts new signals for 10 minutes (circuit breaker)
  - Trailing stop logic: raises SL as price moves toward TP, locking in profit
  - AI confidence breakdown: shows which factors boosted or penalized confidence
- **newsEngine.ts** -- News signal integration:
  - Fetches from CryptoCompare news API (free, no key needed for basic) and CoinGecko trending
  - Sentiment scoring per coin: positive/negative/neutral from headline keywords
  - Suppresses BUY signals on coins with negative news in last 6 hours
  - Boosts confidence up to +8% on coins with strong positive news
  - Shows news badge on signal cards (positive/negative/trending)
  - News feed widget on Home tab showing latest crypto headlines
- **TP Probability Score**: Every signal gets a TP probability % (separate from confidence). Only signals with TP probability >= 75% are shown. This is the key "TP must hit" filter.
- **AI Learning Dashboard** on Home tab: shows current threshold, pattern weights, top performing coins, category stats, news sentiment overview, circuit breaker status

### Modify
- Signal generation: integrate aiEngine and newsEngine into scoring pipeline
- SignalCard: show TP Probability %, news badge, AI confidence breakdown tooltip
- SignalDetail modal: show full AI reasoning (which patterns matched, news sentiment, TP probability breakdown)
- App.tsx: wire aiEngine learning callbacks on tracked trade TP/SL outcomes
- Home tab: replace basic AI panel with full AI Learning Dashboard

### Remove
- Old basic AI panel (replaced by full dashboard)
- Hardcoded 85% fixed threshold (replaced by auto-adjusting)

## Implementation Plan
1. Create `src/frontend/src/lib/aiEngine.ts` -- full AI brain with all learning systems
2. Create `src/frontend/src/lib/newsEngine.ts` -- news fetching and sentiment scoring
3. Update signal generation in App.tsx to use aiEngine scoring + newsEngine sentiment
4. Update SignalCard to show TP probability, news badge, strength meter
5. Update SignalDetail modal to show full AI reasoning breakdown
6. Update Home tab with full AI Learning Dashboard
7. Validate and deploy
