# Trocadero 77

## Current State
- Full-stack crypto signal platform with Home, Trade Now, Active Signals, High Profit, Fast Trades, Tracking, Search, Founder tabs
- Admin panel currently shows as a fixed fullscreen overlay when admin logs in
- Fast Trading section has over-strict filters (confidence >= 88, tpProbability >= 80, signalStrength === 'strong', estimatedHours <= 6) resulting in no signals showing
- Trade Now tab still renders HeroSection alongside EnterNowSection (mixed content)
- No post creation/management capability in admin panel
- No post display on home page

## Requested Changes (Diff)

### Add
- `src/frontend/src/lib/postsManager.ts` — localStorage CRUD for admin posts (id, title, content, imageUrl base64, isPromotional, createdAt)
- `src/frontend/src/components/PostsFeed.tsx` — Displays admin posts on the home page; promotional posts get animated gradient border + pulsing badge; regular posts shown as clean cards
- Posts tab in AdminPanel with: create/edit/delete posts, image upload (FileReader -> base64), title, content fields, and a "Promotional" toggle that makes the post display with special animations on home page
- "Admin Panel" tab in the Navbar snackbar, only visible when `currentUser?.isAdmin === true`; navigates to `adminpanel` section

### Modify
- **FastTradingSection.tsx** — Relax filters: `estimatedHours <= 12` (was 6), `confidence >= 85` (was 88), `tpProbability >= 72` (was 80), remove `signalStrength === 'strong'` requirement; also show carousel when >= 1 signal (not >= 3)
- **App.tsx** — Remove `HeroSection` from `tradenow` case so Trade Now is its own clean page; remove `showAdminPanel` overlay state and fixed AdminPanel rendering; add `adminpanel` case to `renderContent` that renders `<AdminPanel>` as normal page content; navigate to `adminpanel` on admin login; pass `isAdmin` to Navbar
- **Navbar.tsx** — Accept `isAdmin` prop; add `{ id: 'adminpanel', label: '⚙ Admin Panel' }` tab only when `isAdmin === true`; style it with a distinct gold/amber color to differentiate from normal tabs
- **AdminPanel.tsx** — Convert from `fixed inset-0 z-[300]` fullscreen overlay to a normal `<section>` page component (no fixed positioning); add internal tab navigation between "Users" and "Posts"; redesign with rich dark theme, animated stat cards, motion transitions between tabs, particle/glow effects on header; Posts tab: list of posts with edit/delete, create form with title input, content textarea, image upload button (hidden file input), promotional toggle with animation preview, save button
- **HeroSection.tsx** (or home case in App.tsx) — Include `<PostsFeed />` component below the AI dashboard content

### Remove
- Fixed fullscreen AdminPanel overlay from App.tsx render tree
- `showAdminPanel` state from App.tsx
- `onOpenAdmin` prop usage (replaced by nav tab)
- `HeroSection` from the `tradenow` case in `renderContent`

## Implementation Plan
1. Create `lib/postsManager.ts` with Post type and CRUD functions
2. Create `components/PostsFeed.tsx` — reads posts from postsManager, renders with animations; promotional posts have animated gradient border and "PROMO" pulsing badge
3. Rewrite `components/AdminPanel.tsx` as a page component with Users + Posts tabs, rich animated dark UI
4. Update `components/Navbar.tsx` to add conditional Admin Panel tab
5. Update `components/FastTradingSection.tsx` to relax signal filters
6. Update `App.tsx` — remove overlay, add adminpanel route, fix tradenow page, add PostsFeed to home
