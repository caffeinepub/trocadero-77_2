# Trocadero 77 — Full AI Integration Upgrade

## Current State
Signal engine scans up to 250 coins. AI learning engine with coin reputation, circuit breaker, TP probability gate, admin panel, news integration, Control Room, AI Dashboard.

## Requested Changes (Diff)

### Add
- Scan ALL 1800+ BingX coins (batched API calls, progress bar)
- AI Q&A on Tracking page: ask questions about any tracked trade
- AI self-improvement loop: writes lessons to localStorage after each trade
- AI change log with timestamps
- Accurate TP countdown always ticking
- AI status dot in navbar (pulsing green)

### Modify
- Expand coin pool from 250 to full BingX list (1800+), batch in groups to avoid rate limits
- aiEngine.ts: add lesson storage, weighted feature scoring from lessons, change log
- TrackingPage.tsx: AI Q&A panel per trade
- AIDashboardPage.tsx: show change log, lesson count, per-category win rates
- useLearningEngine: more granular pattern tracking

### Remove
Nothing removed.

## Implementation Plan
1. Expand coin scan in useCryptoSignals.ts to 1800+ with batched fetching and progress callbacks
2. Add AI lesson system to aiEngine.ts
3. Add AI Q&A engine: generateTradeAnswer(trade, question)
4. Add Q&A panel to TrackingPage per trade
5. Update AIDashboardPage with change log and lesson data
6. Keep all existing features intact
