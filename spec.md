# Trocadero 77

## Current State
Full-stack crypto trading signal platform with carousel-based signal cards, tracking page, admin panel, login system, and search. Current issues:
- Tracking cards show a small TP hit banner but no prominent "Profit Taken" center banner
- No user-can-update (Hit/Missed) buttons on tracking cards
- Countdown timer for Time to TP is inaccurate/always recalculating
- Admin panel has dark `oklch(9%)` background that overlaps/hides content
- Tracked trades stored in a single localStorage key shared across ALL users
- Login modal has dark background
- Signal TP probability thresholds too strict causing most trades to not hit TP
- Fast Trading section filters too tight causing no signals to show

## Requested Changes (Diff)

### Add
- Prominent "PROFIT TAKEN" animated banner in center of tracking trade card when TP is hit
- "Mark as Hit" / "Mark as Missed" buttons on tracking cards so user can manually update outcome
- Per-user isolated tracked trades: storage key = `t77_tracked_${username}` for logged-in users, `t77_tracked_guest` for guests

### Modify
- **Admin Panel**: Change entire background to white (#ffffff). All inner cards/forms use light gray backgrounds. Text in dark colors. Remove dark `oklch(9%)` background. Make it look like the rest of the app (white, clean, professional).
- **Login Modal**: Change background to white. Input fields light styled. Matches app's white theme.
- **useTrackTrades hook**: Accept a `username` parameter. Use `t77_tracked_${username}` as localStorage key for logged-in users, `t77_tracked_guest` for guests. Pass `currentUser?.username` from App.tsx.
- **Time to TP countdown**: Fix to always be accurate. Calculate based on: distance from current price to TP, divided by estimated hourly velocity (= 24h price change / 24). Cap minimum at 0. If price already past entry in right direction and moving toward TP, show countdown. Always show a number, never "Recalculating".
- **Signal generation**: Relax TP distance max to 15% (was 10%), relax TP probability gate from 72% to 65%, keep confidence at 85%+. This ensures more trades that realistically hit TP are shown.
- **Fast Trading**: Lower confidence threshold to 82% (from 88%), TP probability to 68% (from 80%), extend TP window to 18h (from 6h). This ensures signals appear.

### Remove
- Old small TP hit banner (replace with new prominent one)

## Implementation Plan
1. Fix `useTrackTrades.ts` to accept username param and use per-user storage key
2. Update `App.tsx` to pass `currentUser?.username` to `useTrackTrades`
3. Fix `TrackingPage.tsx`:
   - Replace small TP hit banner with large centered animated "PROFIT TAKEN 🎯" banner
   - Add Hit/Missed update buttons on each card
   - Store hitStatus in local state per signalId
4. Rewrite `AdminPanel.tsx` with white background, light theme matching the rest of the app
5. Fix `LoginModal.tsx` with white background, light input styling
6. Fix Time to TP countdown in `SignalDetail.tsx` to use accurate velocity-based calculation
7. Relax signal filters in `useCryptoSignals.ts` and `FastTradingSection.tsx`
