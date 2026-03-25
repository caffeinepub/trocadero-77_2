# Trocadero 77 — Major Platform Upgrade

## Current State
Trocadero 77 is a professional AI crypto trading signal platform with:
- Top snackbar navigation: Home, Trade Now, Active Signals, High Profit, Fast Trading, Tracking, Founder, Search, Admin (admin only)
- Signal cards with carousel, AI engine, tracking, credit system, admin panel
- Login system with admin credentials (malverin/hexermac)
- PostsFeed, SearchPage, TrackingPage, FounderSection, FastTradingSection, HeroSection
- aiEngine.ts, newsEngine.ts, authManager.ts, useCryptoSignals.ts

## Requested Changes (Diff)

### Add
- **Dark/Light mode toggle** switch in navbar; full app adapts to professional dark palette when switched
- **Bull/Bear opening animation** on page load: detect market sentiment (bullish/bearish), blink green/red for 2s, then play 3D canvas bull (rushes from distance, breathes) or bear (comes from right, scratches screen, bleeds red) animation for ~5s total, then back to normal
- **More 3D live animations** throughout: animated charts, particles, floating crypto symbols, animated cards entrance, 3D MCB boxes
- **Left hamburger drawer** (3-line icon top-left): opens a side drawer showing user profile card at top (UID, username, expiry date, subscription status — auto-updating) and tabs: Profile, Home, Post, News, Tracking, AI Dashboard, Founder, Control Room (with icons)
- **Top snackbar tabs** restructured to: Home, Tracking, Fast Trade, Trade Now, Active Signals, High Profit Trade, Search, Founder, Control Room (+ Admin after admin login)
- **Profile Page**: show user details (UID, username, subscription status, expiry). Editable fields: display name, email, phone, avatar/bio. Username, UID, password NOT editable.
- **Post Page** (public): shows all admin posts in 3D animated cards, viewable by all users/guests
- **News Page**: live crypto news feed from CryptoCompare/CoinGecko. AI sentiment analysis on each article. Auto-updates every 5 minutes. Shows bullish/bearish tag, relevance score, AI accuracy indicator.
- **AI Dashboard Page**: Full AI dashboard — live AI status (online/learning/paused), model size (KB learned), learning history log (timestamped changes), failures log, win/loss stats, circuit breaker status with toggle, auto-update every 30s. All the metrics an AI dashboard needs.
- **Control Room Page**:
  - Opening animation: lights blink rapidly for 3s then stabilize
  - DB1 — Main Distribution Board (3D box visual): 6 MCBs: SERVER, AI, UPS, AC, MARKET, NETWORK. Each MCB toggleable. Each has ON/OFF 3D animation and 3s warning toast.
    - SERVER OFF: signal lost warning + world server disconnect animation
    - SERVER ON: signal received warning + world server connect animation
    - AI OFF/ON: AI failed/online warning + neural network animation
    - UPS OFF/ON: secondary backup failed/online + UPS battery animation
    - AC OFF/ON: cooling failed/activated + spinning fan animation
    - MARKET OFF/ON: market optimizer crashed/online + chart animation
    - NETWORK OFF/ON: network error/online + globe/network animation
  - DB2 — Market Distribution Board (3D box visual): MCBs: STABILIZER (auto-trips on high volatility, shows reason on homepage), BULLISH (hides long signals when OFF), BEARISH (hides short signals when OFF), LOW CONFIDENCE (default OFF — when ON shows <90% confidence trades), HIGH CONFIDENCE (default ON — when OFF shows <90% confidence), CONSECUTIVE LOSSES (auto-trips after 5 consecutive AI losses, resets on manual ON)
- **Admin Panel restructure**: bento grid home page showing active users, logged-in count, guest count, AI status. Tab sections: a. Users (with auto-generated UID), b. Posts (heading, tagline, description, photo upload, promotional switch), c. AI (same as AI Dashboard)
- Admin posts displayed on homepage with 3D live animated cards

### Modify
- **Home page**: Remove AI Trading Intelligence/AI Intelligence Panel section
- **Tracking page**: Add AI TP hit prediction panel — for each tracked trade show "AI Prediction: Will Hit TP" with confidence % and reasoning
- **Admin panel**: Redesign as bento grid. User section now shows auto-generated UID. Post section adds heading, tagline, description fields + promotional toggle.

### Remove
- AI Intelligence Dashboard from Home tab

## Implementation Plan
1. Add `darkMode` state to App.tsx, pass theme class to root. Add toggle switch to Navbar.
2. Create `BullBearAnimation.tsx` — Canvas-based opening animation component. Reads market sentiment from useCryptoSignals, plays bull/bear animation on load.
3. Create `HamburgerDrawer.tsx` — left slide-out drawer with user profile card + navigation links.
4. Restructure Navbar.tsx tabs to new order: Home, Tracking, Fast Trade, Trade Now, Active Signals, High Profit Trade, Search, Founder, Control Room.
5. Create `ProfilePage.tsx` — editable user profile (except username/UID/password).
6. Create `PostPage.tsx` — public view of admin posts with 3D animated card entrance.
7. Create `NewsPage.tsx` — live crypto news with AI sentiment tags, auto-refresh.
8. Create `AIDashboardPage.tsx` — full AI metrics dashboard with live learning status, history, failures, circuit breaker toggle.
9. Create `ControlRoomPage.tsx` — opening light animation, DB1 3D MCB box (6 breakers), DB2 3D MCB box (6 breakers), all with toggle logic, warnings, and 3D Canvas animations.
10. Update `App.tsx` to route to all new pages, apply dark mode class.
11. Update `AdminPanel.tsx` — bento grid home, UID generation for new users, updated post form fields.
12. Update `TrackingPage.tsx` — add AI TP prediction panel per tracked trade.
13. Update `PostsFeed.tsx` — 3D animated card entrance for admin posts on homepage.
14. Remove AI Intelligence section from HeroSection/Home.
15. Apply dark mode CSS variables throughout index.css.
16. Add 3D particle/floating animations in hero, signal cards entrance, backgrounds.
