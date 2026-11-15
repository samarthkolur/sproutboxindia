# UI Rework — Checklist and Page Plans

Branch: `ui-rework` (cut from `main` @ `8383706`). `main` keeps the current UI as the A/B control.
Design direction: `DESIGN_SPEC.md` (Section 11 is the combined direction used here).

**Scope (decided):** restyle every page, fix dead ends, and add the new flows listed in Section 5.

Work top to bottom. Tick a box only when the page is built, checked at 375 / 768 / 1280px, in
English, Kannada and Hindi (the DOM translator makes strings much longer), and in light and dark.

Total: **36 `page.tsx` files** = the 35 existing pages (7 public/auth, 7 restaurant, 6 grower,
15 admin; one of them, `/restaurant/order/[orderId]`, becomes a redirect with no UI) plus 1 new page
(`/admin/restaurants/[restaurantId]`).

---

## Verdelo principles (cited as V1–V6 in every page plan)

| Code | Principle | In practice |
|---|---|---|
| **V1** | One accent, solid | Active/primary = one solid fill (mint on dark, charcoal on light). Everything else is a tinted neutral |
| **V2** | Explain every number in words | A caption under each figure and a one-sentence page subtitle ("2 trays need a check-in today") |
| **V3** | Depth, not flatness | Gradient canvas + tinted translucent panels, built with CSS gradients, no images |
| **V4** | Charts are the content | Range pills, ghost bar tracks, area fills, tooltips, direct value labels |
| **V5** | Controls live next to what they change | Range pills on the chart, row-level actions, toggles beside their setting |
| **V6** | The sidebar carries state | Count badges + a pinned "next action" card show what needs attention without opening a page |

**G** = Grovia patterns (pill filters with counts, People-style table, bento panels, big light numerals, dark inset checklist card, ring dial).

Plan format per page: **Layout** · **Verdelo** (principles applied) · **Fix** · **New** (new flow) · **Data**.

## Shell (every dashboard page)

- **Sidebar 240px** (collapsible): logo tile + workspace subtitle (admin: cluster, restaurant: business name, grower: city); nav with icons + **count badges (V6)**; pinned next-action card; user chip with menu (sign out). Admin nav is grouped: Overview · Pipeline (Demand → Allocations → Dispatch → QC Review → Payouts, numbered because it is a real sequence) · Network (Growers, Restaurants, Hubs, Deliveries) · Insights (Analytics, KPIs).
- **Top bar:** ⌘K search pill (pages in v1), the portal's primary "+" action, **theme toggle, language toggle (there is no language switch on mobile today)**, bell with unread dot (uses `/api/notifications`), avatar.
- **Mobile:** floating bottom dock replaces the hamburger; restaurants and admin get one too.
- Replace the blocking `GlobalLoadingIndicator` overlay with a thin top progress bar + skeletons.
- Badges and pinned card come from one helper `getNavBadges(role, userId)` in `src/actions/dashboard.actions.ts`, reusing `getAdminPendingCounts`.

---

## 0. Foundation (do first)

- [x] **Tokens:** CSS-variable set (surface, ink, accent, tints good/watch/neutral, radius, shadow), light + dark; map shadcn `primary` to the accent. Files: `tailwind.config.ts`, `src/app/globals.css`
- [x] **Type:** Outfit via `next/font/google`; remove Inter `@import` and the unused Geist fonts; light numerals on light theme, regular on dark
- [x] **Theme provider** (`class` + `data-theme`, default light, persisted toggle): new `components/layout/ThemeProvider.tsx`
- [x] **Shell:** `AppShell`, `Sidebar` (rewrite), `TopBar`, `BottomDock`, `CommandPalette`, `NotificationsPanel` in `src/components/layout/`
- [x] **Nav config:** new `src/lib/nav.ts` (per-role nav + badge keys; replaces the hardcoded map in `Sidebar.tsx`)
- [x] **Shared UI** (`src/components/ui/`, `src/components/shared/`): `PageHeader`, `StatTile` (tint good/watch/neutral, caption, sparkline slot), `SegmentedControl`, `FilterChips` (with counts), `SearchPill`, `Tabs` (underline), `DataTable` (table on desktop, card list on mobile, row link), `StatusChip` (**single status map**, replaces 4 duplicates), `ChartCard`, `BarPairChart`, `AreaChart`, `Sparkline`, `Meter` (thick + thin), `Ring`, `ToggleRow`, `DetailLayout`, `Timeline`, `EmptyState`, `Skeleton` set, `Modal`, `PhotoLightbox` (with a close button)
- [x] **Reuse:** `ProgressRing` → `Ring`; recharts (already a dependency; `EarningsChart`, `PerformanceRadar` exist unused); `ScrollReveal`; `GlassCard` → `Panel`
- [x] **Shared logic:** new `src/lib/tasks.ts` (task check-in state + `CROP_CYCLE_DAYS` day math, currently duplicated in grower tasks and task detail)
- [x] **A/B tag:** `ui_variant` from `NEXT_PUBLIC_UI_VARIANT` (set to `v2` on the branch preview) sent as a GA4 user property in `src/lib/gtag.ts` / `GoogleAnalytics.tsx`
- [~] **Cleanup (delete dead code):** `components/marketing/*` (6), `components/onboarding/{Grower,Restaurant}OnboardingForm.tsx`, `MobileNav`, `DashboardShell`, shared `AnimatedCounter`, `admin/{AllocationTable,DemandCalculator,KPIGrid}`, `restaurant/{OrderBuilder,CropCatalog}`; remove the grain overlay, the global 36px button rule and `GlobalLoadingIndicator`
- [x] **i18n:** every new English string gets a `kn`/`hi` entry in `src/lib/i18n.ts`; no fixed-width pills, tabs or buttons; no copy split across inline JSX

### Phase 0 status (done 2026-11-15)

Built and verified (type-check, lint, production build, and the new shell checked in the browser at desktop and 375px with real admin data):
tokens + Outfit/Noto fonts, ThemeProvider, AppShell (floating sidebar with count badges and pinned card, top bar, bottom dock, command palette, notifications panel), `lib/nav.ts`, `lib/tasks.ts`, `lib/shell-data.ts`, 20+ shared components in `src/components/ui/`, `ui_variant` GA4 tag, kn/hi translations for the new strings.

Deviations from the plan, on purpose:
- **Shell data** lives in `src/lib/shell-data.ts` (`getShellData`) instead of a `getNavBadges` action: one server-only call returns badges, pinned card, workspace name and unread count. It never throws.
- **Legacy shared components were reskinned in place** (`GlassCard`, `StatCard`, `StatusBadge`, `EmptyState`, `LoadingSkeleton`) so unconverted pages already match the new shell. New code uses `Panel`, `StatTile`, `StatusChip`.
- **Dark theme is built but hidden.** Set `NEXT_PUBLIC_ENABLE_DARK=1` to show the toggle. Only converted pages are dark-safe, so it stays off until Phase 5.
- **Fonts:** Outfit has no Kannada/Devanagari glyphs, so Noto Sans Kannada and Noto Sans Devanagari are added as fallbacks.
- **Cleanup deferred:** `components/onboarding/{Grower,Restaurant}OnboardingForm.tsx` stay until Phase 1, because the FSSAI step and `trackSignUp` must be ported from them first. Everything else on the cleanup list is deleted (6 marketing components, MobileNav, DashboardShell, AnimatedCounter, 3 admin components, 2 restaurant components, GlobalLoadingIndicator, ProgressRing, scroll-progress, Geist fonts).
- **Floating language toggle** still shows on marketing and auth pages (it hides itself inside dashboards) until Phase 1 gives them their own chrome.
- **Dev server:** `.claude/launch.json` now runs `node node_modules/next/dist/bin/next dev -p 3001` with `NEXTAUTH_URL=http://localhost:3001`, because the `.bin` shims are not executable on this drive and port 3000 is taken.

### Phase 0 tests (done 2026-11-15)

`npm test` runs Vitest (jsdom + Testing Library): 129 tests in 13 files, all passing.
- **Logic:** `lib/tasks` (day maths, check-in vs pickup are never both offered), `lib/nav` (every nav link has a `page.tsx`, unique badges, dock is a subset of the nav, admin pipeline is steps 1 to 5), `lib/shell-data` (badge/pinned mapping per role, falls back instead of throwing), STATUS_MAP covers every Prisma status enum, every new UI string has kn/hi.
- **Coverage guard:** `tests/pages.test.ts` fails if a `page.tsx` is missing from this file, or this file plans a page that does not exist (apart from the new admin restaurant detail page).
- **Components:** StatusChip, DataTable (links, selection, mobile cards, empty), FilterChips, SegmentedControl, Meter, Ring, Sparkline, StatTile, BarPairChart (screen-reader table, tooltip), Modal (Esc, backdrop, non-dismissible, focus and scroll restore), ThemeProvider, Sidebar, BottomDock.
- **Each later phase** adds tests for its own pages and flows before it is pushed.
- On this drive esbuild's binary loses its execute bit, so run `ESBUILD_BINARY_PATH=<an executable copy of esbuild> npm test`. Not needed on a normal filesystem.

**Must not break:** GA4 events (`sign_up`, `purchase`, `checkin_submitted`, `pickup_requested` in `src/lib/gtag.ts`), middleware role routing, Stripe and UploadThing flows, every API route.

## 1. Layouts and states

- [x] `src/app/layout.tsx`: Outfit, ThemeProvider, toaster, top progress bar; drop the floating language toggle (moves into the top bars)
- [ ] `(marketing)/layout.tsx` + `loading.tsx`: becomes the **one marketing chrome** (nav with logo, anchors, Sign in, Get started, language, theme; footer), used by landing, About and join (today: three different navbars, join has none)
- [ ] `(auth)/layout.tsx` + `loading.tsx`: centered frosted panel on the glow canvas (V3), language + theme toggles, back link
- [x] `(dashboard)/layout.tsx` + `loading.tsx` + `error.tsx`: `AppShell`; remove the `pt-[72px]`/`pb-28` hacks; skeletons shaped like the page; restyled error with retry and home
- [ ] `(dashboard)/admin|grower|restaurant/layout.tsx`: stay pass-through (nav lives in `lib/nav.ts`)
- [ ] `global-error.tsx`: tokens instead of hardcoded `#F8FAF7`
- [ ] `not-found.tsx` (**new**): branded 404 with a role-aware link home

---

## 2. Public and auth (7)

- [ ] **`/` Landing**
  - **Layout:** marketing chrome; hero with a sentence headline, two CTAs and a product preview built from the new components (labelled "illustrative"); How it works as a **connected stepper** (a real sequence); For Growers / For Restaurants as two bento panels with product mocks; "Built on a real system" as StatTiles with captions; crop strip with real prices and photos from `lib/constants`; closing CTA.
  - **Verdelo:** V2 (every fact has a plain caption), V3 (glow canvas), V1 (one CTA style).
  - **Fix:** split the 876-line file into section components; footer anchors (`#about`, `#for-growers`) → real ids/routes; link `/about`; emoji → lucide icons; no fake traction; respect reduced motion; one shared scroll/counter helper.
  - **Data:** none; real constants only.
- [ ] **`/about`**
  - **Layout:** shared chrome; hero; four values as StatTile-style panels (tokens, not blue/amber/purple); story as a panel with a one-sentence lead; CTA band.
  - **Verdelo:** V2, V3. **Fix:** linked from nav and footer.
- [ ] **`/join/grower`** (5-step wizard)
  - **Layout:** inside the marketing chrome; pill stepper with labels; form panel + **live summary panel** ("Starter kit · 5 trays · earn ₹50+ per tray"); map picker in its own panel; space/light options as segmented controls.
  - **Verdelo:** V5, V2.
  - **Fix:** the live page lacks the FSSAI step and `trackSignUp` that exist only in the dead `GrowerOnboardingForm` → port both into the live form; confirm where bank/IFSC/UPI are collected; delete the dead duplicate.
  - **New:** optional FSSAI step (the API already accepts `fssaiRegNumber`).
- [ ] **`/join/restaurant`** (4-step wizard)
  - **Layout:** same wizard pattern; crops as selectable photo chips; delivery frequency/day as segmented controls; summary panel.
  - **Verdelo:** V5, V2. **Fix:** keep `trackSignUp`; delete the dead duplicate.
- [ ] **`/login`**
  - **Layout:** centered panel; email/password; solid accent Sign in.
  - **Verdelo:** V1.
  - **Fix:** show a success banner for `?registered=true` (join pages append it, login ignores it); errors say what to do.
- [ ] **`/register`**
  - **Layout:** role picker as two large selectable panels (Grower / Restaurant), then fields.
  - **Verdelo:** V2 (says what happens next, since no account is created here).
  - **Fix:** inline validation; prefill handoff unchanged.
- [ ] **`/signout`**
  - **Layout:** small confirmation panel; neutral solid primary (not red), cancel.
  - **Verdelo:** V1.

---

## 3. Restaurant portal (7 pages, 6 with UI)

Nav: Overview · New order · Orders (**badge: awaiting payment**) · Subscriptions. Pinned card: "Next delivery: Thu 11:00". Primary "+": New order.

- [ ] **`/restaurant/dashboard`**
  - **Layout:** greeting + sentence subtitle ("2 orders growing, next delivery Thursday"); 4 StatTiles with captions; bento: orders-in-progress cards with growth ring, "next delivery" hero card, crop strip (photo cards).
  - **Verdelo:** V2, V6 (pending-payment banner with Pay now), V1 (one "New order" CTA, not two).
  - **Fix:** rows and crop cards become real links; totals computed from all orders (today `take: 5` makes them wrong); remove hardcoded "+12%" (real month-over-month or none); extract the inline `OrderProgressVisualizer`.
  - **New:** crop cards deep-link to New order with the crop preselected.
- [ ] **`/restaurant/order/new`**
  - **Layout:** master–detail (Verdelo Cards pattern): crop photo grid left, sticky cart panel right with price breakdown; delivery date, notes and repeat cadence (segmented control).
  - **Verdelo:** V5 (cadence and date beside the total), V2 (grow time per crop in words).
  - **Fix:** grow-time text from `CROP_CYCLE_DAYS` (hardcoded today); min delivery date = longest cart crop cycle + buffer (copy says 9–10 days, code uses +9); partial failure lists which orders were created and links to Orders; `CheckoutModal` restyled as a "1 of N" stepper with Stripe Elements themed to tokens.
  - **New:** `notes` and `recurrence` (both already accepted by the order API/schema).
- [ ] **`/restaurant/orders`**
  - **Layout:** PageHeader; FilterChips with counts (All · Awaiting payment · In production · In transit · Delivered · Cancelled); search; DataTable (cards on mobile).
  - **Verdelo:** G (People pattern), V5 (row actions), V6.
  - **Fix:** filters, search, sort.
  - **New:** **Pay now** on awaiting-payment rows (fulfils the "Pay later from the Orders page" promise); **Rate** on delivered rows.
  - **Data:** new endpoint: retrieve the existing PaymentIntent (`stripePaymentId`) and return its client secret.
- [ ] **`/restaurant/orders/[id]`**
  - **Layout:** master–detail: left hero (crop photo, status chip, growth ring from batches, "Day 4 of 9") + 5-step timeline (Confirmed → In production → At hub → In transit → Delivered, with timestamps); right facts panel (kg, price, delivery date, payment) and actions.
  - **Verdelo:** V2, V5, V6.
  - **Fix:** crop display name (raw `cropType` today); tracker bug (with no delivery record it gets `order.status`, which matches no step, so the bar is empty); breadcrumb back.
  - **New:** Pay now (if pending), Leave feedback (if delivered), show the rating if given.
- [ ] **`/restaurant/order/[orderId]`** (**no UI**)
  - **Plan:** replace the broken re-export (wrong param, nothing links to it) with a redirect to `/restaurant/orders/[orderId]`, so any old links keep working.
- [ ] **`/restaurant/feedback/[orderId]`**
  - **Layout:** panel with order context (crop, delivered date); large star rating; quick tag chips (Quality, Freshness, On time, Packaging); labelled notes; success state with thank-you and back link.
  - **Verdelo:** V2, V5.
  - **Fix:** ownership + delivered check; show existing feedback if already given (one per order); loading/error/success states.
  - **New:** entry points from Orders, Order detail and Dashboard. Tags are appended to notes (no schema change).
- [ ] **`/restaurant/subscriptions`**
  - **Layout:** list of recurring orders (`Order.recurrence`) as cards (crop, kg, cadence, next delivery); empty state with CTA to New order with cadence preselected.
  - **Verdelo:** V2, V6.
  - **New:** the page stops being a dead end.
  - **Open decision:** nothing in the backend generates the repeat orders; pause/cancel and auto-creation need a scheduled job. The UI must not claim automation that does not exist.

---

## 4. Grower portal (6, mobile-first)

Nav: Overview · Tasks (**badge: check-ins due**) · Earnings · Tutorial · Profile. Mobile dock: Home, Tasks, Earnings, Profile (+ More → Tutorial). Pinned card: "Next check-in: Tray 3, Day 4". Primary "+": Check in.

- [ ] **`/grower/dashboard`**
  - **Layout:** greeting + sentence ("2 trays need a check-in today"); 4 StatTiles; **dark inset "Today's tasks" card** (G) with inline Check in; grow-cycle **ring** ("Day 4 of 9"); weekly earnings chart with range pills; recent activity from real notifications.
  - **Verdelo:** V2, V4, V5, V6.
  - **Fix:** rows become links; "Tasks due" label; QC score shows "No reviews yet" for new growers (0% / "Needs improvement" is misleading); "Weekly earnings" is the last 7 payouts, make it real weekly buckets; Recent Activity duplicates Active Tasks, use notifications; add "View all tasks".
  - **Data:** weekly payout aggregation.
- [ ] **`/grower/tasks`**
  - **Layout:** FilterChips (Active · Ready for pickup · Completed) with counts; task cards with crop photo, ring, trays, date range, today's instruction, **one** primary action (Check in / Request pickup / Checked in ✓).
  - **Verdelo:** V5, V6.
  - **Fix:** `HARVEST_READY` tasks vanish from the list today; shared `lib/tasks.ts` for day math and check-in state (list and detail disagree on `totalDays`); cards link to detail.
- [ ] **`/grower/tasks/[taskId]`**
  - **Layout:** master–detail: left hero (crop photo, ring, status) + actions; right vertical **Timeline** of day-by-day instructions (done ✓ / today / upcoming) + batches panel (per-tray status chips, check-in photo history with lightbox).
  - **Verdelo:** V2, V5.
  - **Fix:** crop display name; breadcrumb as a real link.
  - **New:** QC failed/rejected messaging **with the reason** (depends on the QC reason flow, `/admin/qc`).
- [ ] **`/grower/earnings`**
  - **Layout:** hero numeral (total earned) with caption ("₹X paid · ₹Y pending"); range pills; earnings chart (reuse `EarningsChart`); payouts table.
  - **Verdelo:** V2, V4.
  - **Fix:** payout rows say which task/crop they belong to (all say "Batch Payout" today) and link to it; pending vs paid summary.
- [ ] **`/grower/profile`**
  - **Layout:** panels: Account (read-only), Contact & address (editable), Payout details (UPI/bank **masked** with reveal), Space & kit, FSSAI card, performance (restyled `PerformanceRadar` + three score tiles with captions).
  - **Verdelo:** V5 (edit beside each field group), V2.
  - **Fix:** bank account is shown in full today; 11 identical stacked rows.
  - **New:** editing (`PATCH /api/grower/profile` exists, no form uses it); FSSAI submit field with status chip ("required" has no action today).
- [ ] **`/grower/tutorial`**
  - **Layout:** crop FilterChips; vertical Timeline of steps; Pro Tips as an accordion.
  - **Verdelo:** V2.
  - **Fix:** use per-crop `CROP_INSTRUCTIONS` (generic hardcoded ranges today); reachable from the mobile "More".

---

## 5. Admin portal (15 pages + 1 new)

Nav grouped as in the Shell section. Badges: Demand (confirmed orders without a plan), Allocations (draft plans), Dispatch (assigned tasks), QC Review (pending), Payouts (pending). Pinned card: "N batches awaiting QC". Primary "+": New allocation.

- [ ] **`/admin/dashboard`**
  - **Layout:** greeting; tinted StatTiles; **Pipeline strip** (Demand → Allocate → Dispatch → QC → Payout, each a count linking to its page); weekly production chart with range pills; recent orders; top growers.
  - **Verdelo:** V6 (the pipeline is implicit today), V4, V2.
  - **Fix:** weekly chart is hardcoded (`[65,78,85…]`, labels W7–W14), replace with real data; remove fake deltas ("+12 this week", "+18%"); "Deliveries / In transit" shows the wrong number; top-growers "tasks" shown under trays; order rows link nowhere (drop the false affordance or link); top growers link to detail; use the unused `ActivityFeed` with real events.
  - **Data:** weekly production/delivery aggregation.
- [ ] **`/admin/demand`**
  - **Layout:** master–detail: left list of orders needing plans sorted by urgency (days to delivery) with crop filter; right preview of the calculation (Base + Buffer = Total trays) and **planned sow/harvest dates**.
  - **Verdelo:** V5, V2.
  - **Fix:** tray math is duplicated on the client; use `calculateProductionPlan` in `src/lib/business.ts`.
  - **New:** multi-select + **Create plans (n)** bulk action.
  - **Decision:** buffer stays display-only (25% constant); editable buffer deferred.
- [ ] **`/admin/allocate`**
  - **Layout:** two sticky panels: plans left; right grower assignment with a **capacity meter per grower** ("5 of 15 trays free"), search and filters (city, FSSAI verified), NEAREST tag, score bar, thick assigned-vs-total Meter; mobile: panels stack with a sticky action bar.
  - **Verdelo:** V4, V5, V2.
  - **Fix:** `kitSize` and `activeTasks` are fetched but never shown and nothing stops over-allocation → warn and block over capacity; urgency chip on plans; `<a>` → `Link`; remove the unreachable "Done" state.
- [ ] **`/admin/dispatch`**
  - **Layout:** tasks **grouped by grower** (accordion), waiting-time chip ("allocated 2 days ago"), grower city.
  - **Verdelo:** V5, V6.
  - **Fix:** the double card layer; "dispatch" is overloaded (Allocate's button is also "Dispatch Tasks") → rename this action "Mark seeds delivered".
  - **New:** per-grower "Mark all delivered"; undo toast.
- [ ] **`/admin/qc`** (queue = review workspace)
  - **Layout:** master–detail: left queue (grower, crop, tray, day, waiting time; filters by crop/grower; counts); right **review panel**: large photo pair, day strip of all check-ins, notes quote, **decision bar** Pass / Risk / Reject.
  - **Verdelo:** V5, V6, V1 (the decision bar is the only solid-accent area).
  - **Fix:** long scroll of huge images; lightbox has no close button; only the latest check-in is shown; no link to batch detail; Risk can be clicked repeatedly with no feedback.
  - **New:** reason chips + notes (`processQCCheckIn` already accepts `notes`, the UI never sends them); keyboard shortcuts (P/R/X, J/K); auto-advance after a decision. The reason reaches the grower (`/grower/tasks/[taskId]`).
- [ ] **`/admin/qc/[batchId]`**
  - **Plan:** build it properly (a stub today: placeholder text, hidden form, nothing links to it): the same review component deep-linked, with the full check-in history; linked from queue rows and notifications. Remove `QCReviewPanel`'s placeholder.
- [ ] **`/admin/hubs`**
  - **Layout:** tiles: name, cluster, drop-off window, grower count, upcoming deliveries.
  - **Verdelo:** V2. **Fix:** the empty state says "create hubs" but no create exists (copy fix).
  - **Decision:** allocation now describes "direct delivery", so hubs may be legacy. Restyle, do not expand.
- [ ] **`/admin/hubs/[hubId]`**
  - **Layout:** master–detail: hub facts + drop-off window; deliveries for the hub; growers list.
  - **Verdelo:** V2.
  - **Fix:** `HubAggregator` is fed hardcoded `expectedKg=25 / receivedKg=0` → compute from deliveries, or **remove the meter** rather than show fake data; grower rows link to grower detail.
- [ ] **`/admin/growers`**
  - **Layout:** People pattern: title + subtitle; FilterChips with counts (All · FSSAI verified · Pending · No FSSAI · Inactive); search pill; DataTable (name, city, kit, score with mini meter, FSSAI chip, active); row → detail.
  - **Verdelo:** V6, V5, V2.
  - **Fix:** the "Pending FSSAI" chip becomes the **verification queue** (today you open each grower); show `isActive` and cluster; score has no breakdown.
  - **New:** inline Verify (action exists) with confirm.
- [ ] **`/admin/growers/[growerId]`**
  - **Layout:** profile panel + tinted StatTiles (composite, yield, quality, timeliness, earnings, each with a caption) + Tabs: **Tasks · Payouts · Compliance** (`GrowerComplianceCard` under Compliance).
  - **Verdelo:** V2, V5.
  - **Fix:** `tasks` and `payouts` are fetched and never shown; no contact info.
  - **New:** activate/deactivate toggle (small new server action on `Grower.isActive`).
- [ ] **`/admin/restaurants`**
  - **Layout:** People pattern: DataTable (name, city, orders, revenue, last order, status, contact); FilterChips with counts: **All · Active · Dormant (no order in 30 days) · Never ordered** (the funnel findings as a working filter); search.
  - **Verdelo:** V2, V6.
  - **Fix:** it loads every order only to count them → aggregate query; cards link nowhere.
- [ ] **`/admin/restaurants/[restaurantId]`** (**new page**)
  - **Layout:** profile panel; tiles (orders, revenue, average rating, last order); order history table; feedback list; status chip.
  - **Verdelo:** V2. **Why:** there is no restaurant detail anywhere today.
- [ ] **`/admin/deliveries`**
  - **Layout:** DataTable + FilterChips by status (counts); columns: order, restaurant, kg, delivery date, hub, status, late flag; inline segmented progress; "Load more" beyond 20.
  - **Verdelo:** V5, V6.
  - **Fix:** nothing actionable today; FAILED has no state; no order id/kg/date/late flag.
  - **New:** advance status inline (check that `/api/admin/delivery/[id]` supports it).
- [ ] **`/admin/analytics`**
  - **Layout:** Verdelo Insights: 4 tinted StatTiles with sparklines; range pills; **Revenue vs Grower payouts vs Commission kept** as paired bars (our version of "Money in & out"); orders-over-time area chart; per-crop and top-restaurant breakdowns; underline Tabs: Revenue · Production · Quality.
  - **Verdelo:** V4 (the page's job), V2, V5.
  - **Fix:** no time dimension or charts today; overlaps the dashboard KPIs, so remove the duplicates.
  - **Data:** new time-bucketed aggregation actions.
- [ ] **`/admin/kpis`**
  - **Layout:** 7 StatTiles (tint by status: good / watch amber / no data grey), big number, thin target Meter, caption; sparkline only where a series can be computed (kg delivered, MRR); the long text table becomes a "Definitions" accordion.
  - **Verdelo:** V2, V1, V6.
  - **Fix:** targets are hardcoded strings → constants; the table scrolls on mobile (720px min).
- [ ] **`/admin/payouts`**
  - **Layout:** StatTiles (pending ₹, paid ₹); FilterChips (Pending · Paid · Failed); search; DataTable with a batch/task/crop column; grower names link.
  - **Verdelo:** V6, V5.
  - **Fix:** summaries are computed from the 30 loaded rows only → aggregate over all payouts.
  - **New:** bulk select + "Mark paid (n)" with a confirm dialog.

---

## 6. New work beyond restyling (explicit list)

| Item | Needs |
|---|---|
| Pay now for pending orders | New endpoint: retrieve the PaymentIntent for `stripePaymentId`, return `client_secret` |
| Feedback entry points + guard | UI only (API exists); ownership/delivered check |
| QC reasons/notes + deep-linked review | UI only (action already accepts `notes`); notes surfaced to the grower |
| Grower profile editing + FSSAI submit | UI only (`PATCH /api/grower/profile` exists) |
| Admin restaurant detail | New read-only page + queries |
| Grower activate/deactivate | New small server action |
| Bulk create plans / bulk mark paid / mark all delivered | New server actions looping existing logic |
| Time-series aggregations (dashboard, analytics, grower earnings) | New query helpers in `src/actions/` |
| Nav badge counts | New helper `getNavBadges` |
| Subscriptions | **Needs a product decision** (repeat-order generation) |

## 7. Order of work

0. Foundation. 1. Marketing chrome, landing, About, auth, join wizards. 2. Grower portal (mobile-first, smallest). 3. Restaurant portal. 4. Admin portal (largest). 5. Dark theme polish and final pass.

Commit per phase on `ui-rework`; commits list only the user as author (no co-author line).

## 8. Existing code to reuse

`calculateProductionPlan` / `allocateTrays` (`src/lib/business.ts`), `getAdminPendingCounts` and the dashboard actions (`src/actions/dashboard.actions.ts`), `getKpiSnapshot` (`src/actions/kpi.actions.ts`), `verifyGrowerFssai` (`src/actions/grower.actions.ts`), `markPayoutAsPaid`, `processQCCheckIn`, `markSeedsDelivered`, `CROP_CYCLE_DAYS` / `CROP_INSTRUCTIONS` (`src/lib/constants.ts`), `ProgressRing`, `EarningsChart`, `PerformanceRadar`, `ScrollReveal`, `CheckinModal`, `CheckoutModal`, `ImageUploader`.

## 9. Risks and open decisions

- **Translations:** every new string needs `kn`/`hi` entries or it shows English; budget real time for this.
- **Backdrop blur** cost on low-end phones: limit blur layers, use CSS gradients for the glow.
- **Subscriptions** needs a backend decision (repeat-order generation); until then the page lists requested recurring orders and must not promise automation.
- **Hubs** may be legacy; restyle without expanding.
- **A/B:** two deployments (main vs the branch preview) are compared by `ui_variant` in GA4; a true single-URL visitor split is out of scope.
- Scope is large (36 page files + shell + new flows): phases are independently committable so the branch always builds.

## 10. Final pass

- [ ] Every item above ticked; `find src/app -name page.tsx` returns 36
- [ ] `npx tsc --noEmit`, `npx next lint` and `npx next build` clean
- [ ] 375 / 768 / 1280px spot-check of every portal; light and dark; English, Kannada, Hindi
- [ ] Flows: register → join → login; new order (Stripe unconfigured) and Pay-now states; grower check-in with photo; QC decision with reason reaching the grower; bulk payout; delivery status change
- [ ] GA4 `dataLayer` shows `sign_up`, `purchase`, `checkin_submitted`, `pickup_requested`, and `ui_variant=v2`
- [ ] Accessibility: 12px minimum text, 4.5:1 muted-text contrast, visible focus rings, `prefers-reduced-motion`, charts labelled (not colour alone)
- [ ] No references to deleted components; no hardcoded demo numbers left on admin dashboard, hubs, restaurant dashboard
- [ ] Push the branch and compare the Vercel preview against `main`
