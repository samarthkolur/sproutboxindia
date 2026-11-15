# UI Rework — Design Spec

Sources: two sets of reference frames, both by the same designer (same type and component language).
- **Reference A, "Grovia"** (light, top pill nav): Payroll, People, Overview. Sections 1–9.
- **Reference B, "Verdelo"** (dark, left sidebar): Insights, Cards, Overview. Section 10.
- **Section 11 is the recommended combined direction.**

Branch: `ui-rework`. Checklist: `UI_REWORK.md`.

The frames are compressed video stills. Colours below were **sampled from the actual pixels**
(median of a small patch), so treat them as close, not exact. Font and radii are estimated by eye.
Hover, motion and dark mode were not visible. Anything marked *inferred* is a judgement.

We reproduce the **style system** (colour, type, layout, component behaviour), not the artwork:
no Grovia logo, avatars or photos.

## 1. What the style is

A calm, high-polish "frosted bento" dashboard:

1. One soft green gradient canvas. Everything sits on translucent, rounded, white-tinted panels.
2. Almost no chrome: no sidebar, no heavy borders, no grid lines. Structure comes from panel edges and whitespace.
3. A single dark charcoal accent (not green) marks "active / primary / selected". Green means data and progress only.
4. Big, light-weight numerals carry the message. Labels are tiny and muted.
5. Everything is a pill: nav, filters, chips, buttons, progress bars, search.

## 2. Colour (sampled)

| Role | Value | Notes |
|---|---|---|
| Canvas, top-left | `#D7E3D1` → `#DDE9D6` | pale, slightly grey sage |
| Canvas, top-right | `#C3DDBC` | |
| Canvas, bottom-right glow | `#8ECA87` – `#92C986` | the only saturated area; a corner glow, not a flat fill |
| Panel fill | `#E3EFDE`, `#DEEADB`, `#DDE7DA` | white at ~50–60% over the canvas, so it shifts slightly with the gradient |
| Panel inset / calendar cell | `#DFE7DB` | one step darker than the panel |
| Row selected tint | `#C6D9BC` | green tint, not a border |
| Ink (dark accent) | `#2B362A`, `#2E3230`, `#262922` | charcoal with a faint green cast. Used for the active nav pill, primary button, "New" chip, the dark task card |
| Green (data) | `#669C5E`, `#6EAB64`, `#699B5E` | progress fills, active step, chart highlight |
| Green tint (soft) | `#80AC7B` on events, light tint on "Active" chip | |
| Muted text | grey-green around `#7F857D` | labels, units, secondary lines |
| Amber chip | around `#A89672` text/bg family | "Away" / warning only |

Rules: charcoal = action and selection; green = progress and positive data; amber = needs attention.
Neutral greys are tinted toward green, never pure grey.

## 3. Type

- **Typeface (estimated):** a geometric sans with a light weight, close to Outfit or Urbanist. Use `next/font/google` **Outfit** (display and body) as the nearest free match, and confirm on screen.
- **Display numerals:** very large, **light (300)** weight, tight tracking. Units (`hrs`, `h`, `%`) are tiny, muted and sit on the baseline next to the number. Examples: `144.0 hrs / $5,520`, `84 · 37 · 212`, `25%`, `02:35`.
- **Page titles / greeting:** large, light, sentence case ("Good afternoon, Amara", "People").
- **Labels:** very small (about 9–11px in the frames), muted, sentence case or lightly spaced.
- **Body and table text:** regular weight, small; names one step heavier than role/location.
- Hierarchy comes from **size and weight contrast**, not colour.

## 4. Layout

- **Top bar only:** logo pill (left); a segmented pill nav (right) with the active tab filled charcoal; then a "Settings" pill, a round bell with a green dot badge, and a round avatar.
- **No sidebar.** Primary navigation is 3 pills. *Inferred:* the active pill slides between tabs (frame 3 caught it mid-transition).
- **Page frame:** page title or greeting top-left; page actions (search pill, primary button) top-right; filter chips under the title.
- **Bento grid:** rectangular panels of different sizes with a **small, even gap (~12px)**; outer radius about **20–24px**, inner elements about **12px** or full pill. Panels fill the viewport height; content does not float in empty space.
- **Master–detail (Payroll):** list panel (left, narrow) · main panel (centre, wide) · profile panel (right, narrow).
- **Density:** high but airy. Many small facts per panel, each with generous internal padding.

## 5. Components

| Component | Behaviour |
|---|---|
| Panel | translucent white fill, 1px lighter edge, soft low shadow, large radius. *Inferred:* backdrop blur |
| Nav tabs | pill group; active = charcoal fill + white text; inactive = text only |
| Filter chips | pills with a count ("Design 3"); active = charcoal, inactive = pale translucent |
| Primary button | charcoal pill, white text, leading `+` icon |
| Search | pale pill, leading icon, placeholder text |
| Table | one panel; no row borders (hairlines at most); muted header labels; avatar + name column; selected row = green tint + dark checkbox |
| Status chip | pill with a dot: Active = green tint, New = charcoal, Away = amber |
| Progress bar | thick rounded pill, green fill, % printed inside; thin variant (charcoal track, green or dark fill) for "used / total" meters |
| Stat tile | tiny muted label, big light numeral, tiny icon + caption below |
| Calendar | rounded soft cells; value shown as a small green chip; special state = charcoal chip; selected day = 1.5px charcoal outline |
| Bar chart | thin vertical sticks with a dot at the base, charcoal normally, **one green bar** for the focus value with a tooltip pill |
| Ring / dial | thin ring with tick marks, green arc, huge centred time, tiny status line |
| Dark inset card | charcoal panel inside a light panel: checklist with rounded-square icons, done = strike-through + green check, pending = grey circle |
| Accordion | rows with chevrons inside a panel; one open at a time |
| Photo card | full-bleed image, name and role bottom-left, outlined pill (value) bottom-right |

## 6. Principles to keep

1. **One accent per meaning:** charcoal acts, green measures, amber warns.
2. **Numbers first:** the biggest thing on a panel is the number; the label is small.
3. **Pills over rectangles** for anything interactive or categorical.
4. **Panels, not lines:** group with surfaces and gaps, never with borders and rules.
5. **Scarce colour:** the gradient's strong green sits in one corner; the rest is pale.
6. **Light weights, big sizes** for display; heavier weight only for names and active states.
7. **Show state with shape:** selected = filled pill or tint; done = strike-through; focus = the single green bar.

## 7. Deliberate deviations (the frames fail these)

- **Minimum text size 12px** (frames use about 9–10px, unreadable on most screens).
- **Contrast:** muted text on the pale green panels is below WCAG AA. Use a darker muted tone (aim for 4.5:1 on `#E3EFDE`). Do not rely on the light tints alone for status: keep the **dot + word** in chips.
- **Focus rings** on every pill and button; respect `prefers-reduced-motion` for the sliding nav and rings.
- **Dark theme:** the reference is light only. Design a dark variant (deep green-black canvas, translucent dark panels, light ink for the accent) rather than inverting.
- **Language:** Kannada and Hindi strings are much longer. Pills and chips must flex or truncate with a tooltip; no fixed widths.
- **Differentiation from the current UI:** the current app already uses frosted glass on green. For a real A/B difference the new design must change **navigation (top pills, no sidebar), accent colour (charcoal), type (light display numerals) and density (bento)**, not just the glass.

## 8. Mapping to SproutBox

| Reference screen | SproutBox use |
|---|---|
| **Overview** (greeting + stats + bento) | Grower dashboard, Restaurant dashboard, Admin dashboard |
| Greeting ("Good afternoon, Amara") | "Good morning, <name>" on every portal home |
| Three big numerals (Team / Hiring / Projects) | Grower: trays growing · check-ins due · earnings. Restaurant: active orders · kg this month · spend. Admin: orders · active growers · QC pass |
| Thin labelled progress bars | Grower: batch progress, QC pass. Admin: allocation filled, delivery on-time |
| Photo card (person + value pill) | Crop photo card (crop image, name, day-of-cycle pill) / restaurant order card |
| Bar chart with one green bar | Weekly check-ins (grower), weekly kg delivered (admin, North Star) |
| Time-tracker ring | Grow-cycle ring: "Day 4 of 9" with arc, next action underneath |
| Dark onboarding task card | "Today's tasks" checklist (water, check-in, harvest) |
| Accordion card | Payout, pickup, harvest history |
| Week calendar with event blocks | Harvest and delivery schedule |
| **People** (title, filter chips with counts, search, add button, table with status chips) | Admin: Growers, Restaurants, Deliveries, Payouts, QC queue, Hubs. Restaurant: My orders. Grower: Tasks list |
| **Payroll** (master list · main · profile panel) | Admin: Grower detail, Hub detail, QC batch detail. Restaurant: order detail |
| Big numeral + thick progress bar + thin used/total meters | `/admin/kpis`: KPI, target, actual, status as a numeral with a meter |
| *No reference* | Landing, About, Login, Register, Sign-out, onboarding forms, Stripe modal, tutorial, feedback. These extend the same language (gradient canvas, large light type, frosted panels, charcoal pill buttons). They are extrapolated, not copied |

## 9. Open decision: navigation

The reference has only 3 top tabs. SproutBox has 15 admin pages, 7 restaurant and 6 grower.

Proposed:
- Grower and Restaurant: the top pill nav holds all items directly (6–7 pills; collapses to a "More" pill on narrow screens).
- Admin: 5 grouped pills — **Overview · Operations** (demand, allocate, dispatch, QC, deliveries) **· Network** (growers, restaurants, hubs) **· Finance** (payouts, analytics) **· KPIs** — with a **filter-chip row** under the title switching between the pages in the group.
- Mobile: a floating pill dock at the bottom replaces the top tabs.

(Superseded by Section 11 if Reference B's sidebar shell is adopted: a sidebar holds all 15 admin pages with no grouping workaround.)

---

## 10. Reference B: "Verdelo" (dark, sidebar)

Colours sampled from the pixels (median of a small patch). Font and radii estimated by eye.

### Look

A dark glass fintech dashboard: a near-black green canvas with a blurred, ambient green glow
behind translucent panels, one mint accent, and a persistent left sidebar.

### Colour

| Role | Value | Notes |
|---|---|---|
| Canvas / sidebar | `#1A231A`, `#15271E` | near-black, green cast |
| Panel (raised) | `#2D372E` | translucent over the glow, so it varies |
| Panel (inset, e.g. "safe to spend") | `#0A110B` | darker than the canvas |
| Stat-card tints | green `#2F4535`, amber/olive `#373C26`, neutral `#35413A` | the tint carries meaning (amber = money going out / watch) |
| **Mint accent** | `#6EDFA1` (also `#73E1A8`, `#6DDD9E`) | active nav fill, primary buttons, "in" bars, active segment |
| Mint, deep (hover / dark mint) | `#22713B`, `#349461`, `#408B5F` | secondary mint buttons, active range |
| Inactive bar | `#294B34` | ghost/"out" bars, faint full-height tracks behind bars |
| Warning / bill | amber dot (about `#E5B84A`) | markers and tints only |
| Muted text | soft green-grey | labels, subtitles |

Rule: mint is the single accent and means "active, primary, positive". Amber means "outgoing / needs a look". Everything else is tinted neutral.

### Type

- A rounded geometric sans (likely the same family as Reference A).
- **Titles and numerals are medium weight** (not light): page title about 36px, stat numerals about 28px, hero balance very large.
- Labels and captions are small and muted; captions often explain the number in plain words ("Two salaries and drawings").
- Page subtitles are written as a sentence, not a label ("What the household earns, keeps and spends, and where it goes.").

### Shell and layout

- **App shell:** one large rounded frame (about 28px radius) with a faint border, floating on the canvas.
- **Sidebar (about 240px):** logo tile (mint rounded square) + name + workspace subtitle + collapse button; nav list with icon + label; active item = **solid mint pill with dark text**; small **count badges** on the right (Payments 1, Budgets 2); a divider, then Settings and Help; pinned at the bottom a **summary card** ("Safe to spend today $67 · $269 of bills still due · 19 days left") and a **user chip** (avatar, name, email, "…" menu).
- **Top bar:** wide **search pill with a ⌘K hint**; mint round **"+"** button; outlined round **send** button; divider; **theme toggle (sun)**; **bell with a green dot**; avatar initials circle.
- **Page header:** small date line (overview only), big title or greeting, one-sentence subtitle, page actions top-right (ghost "Statement" + solid mint "Send money"; mint-tint "Virtual card").
- **In-page tabs:** text tabs with a mint **underline** on the active one (In & out / Spending / Merchants).
- **Cards:** 4 stat cards across; then two-up chart cards; master–detail (hero visual left, settings panel right).

### Components

| Component | Behaviour |
|---|---|
| Stat card | tinted fill, tiny icon + label, big number, plain-language caption, **sparkline with area fill** at the right |
| Chart card | title + muted subtitle; **segmented range control** top-right (Quarter · 6 months · Year, active = mint fill); inline legend with dots and totals ("In $122,957 · Out $89,161 · Kept $33,797") |
| Bar chart | paired bars per month: **mint gradient** (in) beside **grey translucent** (out); rounded tops; faint full-height ghost track behind each bar; hover tooltip pill with both values |
| Line chart | smooth line, soft area gradient, dotted horizontal gridlines, muted y-axis labels; **forecast** as dotted line; **event markers** as small mint and amber dots; a "Today" marker with a vertical hairline |
| Delta chip | small pill with arrow and %, mint |
| Period tiles | four small inset tiles (Today / This week / This month / This year) beside the hero number |
| Status chip | pill with dot ("Live") |
| Toggle row | title + one-line description + **mint toggle switch**; off = light grey knob |
| Slider | thin track, mint fill, white round thumb, value at the right |
| Ghost button | outlined pill/rounded rect with icon ("Hold to see PIN", "Freeze") |
| Hero visual | a glass card with a mint-green gradient, stacked cards behind it, carousel arrows and dots |

### Principles (Reference B)

1. **One accent, solid:** mint fills mean "you are here / do this".
2. **Explain every number in words** (caption under the figure).
3. **Dark but not flat:** glow behind translucent panels gives depth; panels are tinted, never pure black or grey.
4. **Charts are the content:** ghost tracks, area fills and tooltips make them feel finished.
5. **Controls live next to what they change** (range pills on the chart, toggles beside each setting).
6. **Sidebar carries state:** count badges and a pinned summary card show what needs attention without opening a page.

### Deviations for Reference B

- Text is about 10–11px in the frames. Use **12px minimum**, and test the muted green-grey against the dark panels for 4.5:1.
- Mint-vs-grey bars must not be the only cue: add tooltips, direct value labels and a legend with shapes.
- The blurred photographic glow is costly. Build it with **CSS radial gradients**, not images, and limit `backdrop-filter` on low-end phones.
- Provide a **light theme** (Reference A supplies it, see Section 11).

---

## 11. Recommended combined direction

The two references share a designer, a typeface, a pill-and-segment component vocabulary and a
green identity, so they combine cleanly as **one system with two themes**.

| Decision | Choice | Why |
|---|---|---|
| Shell | **Reference B**: left sidebar + top search bar | 15 admin pages do not fit 3 top tabs; sidebar badges and the pinned card suit an operations app |
| Dark theme | **Reference B** palette (mint on green-black) | |
| Light theme | **Reference A** palette (pale sage canvas, charcoal accent for active states) | gives the light mode B lacks; matches the current app's light feel |
| Cards and layout inside pages | Bento panels (A) with B's stat cards, chart cards and master–detail | |
| Pills, chips, segmented controls | A and B are the same language | |
| Display numerals | A: light weight on light theme; B: regular/medium on dark theme | light weights vanish on dark |
| Accent | Light theme: charcoal marks active, green marks data. Dark theme: mint marks active and data | one rule per theme, never mixed |

### Sidebar per portal

| Portal | Items (badge = count that needs attention) |
|---|---|
| Admin | Overview · Demand · Allocations · Dispatch · QC Review (badge) · Hubs · Growers · Restaurants · Deliveries · Analytics · KPIs · Payouts (badge) · Settings · Help |
| Restaurant | Overview · New order · Orders (badge) · Subscriptions · Feedback · Settings · Help |
| Grower | Overview · Tasks (badge) · Earnings · Tutorial · Profile · Settings · Help |

The pinned bottom card replaces "Safe to spend today" with the portal's most useful next action:
- Grower: "Next check-in: Tray 3, Day 4".
- Restaurant: "Next delivery: Thu 11:00".
- Admin: "5 batches awaiting QC".

The workspace subtitle shows the cluster (admin), restaurant name, or grower city. **⌘K** opens a
command palette (pages, orders, growers). The **"+"** button is the portal's main create action
(admin: new allocation, restaurant: new order, grower: new check-in). The language toggle sits
beside the theme toggle.

### Page mapping (adds to Section 8)

| Reference B screen | SproutBox use |
|---|---|
| Insights: 4 tinted stat cards + range-segmented charts + underline tabs | `/admin/kpis` and `/admin/analytics`: KPI stat cards (amber tint when below target) with sparklines; tabs Revenue · Production · Quality |
| Paired bars (in vs out) | Ordered vs delivered kg per week; allocated vs harvested trays |
| Line chart with forecast and markers | Orders and deliveries over time, with delivery and harvest markers (forecast line only once there is data to forecast) |
| Cards: hero visual + settings panel with toggles and slider | `/admin/qc/[batchId]`: check-in photo hero + verdict panel (Pass · Risk · Reject rows, notes). Grower profile and notification settings use the toggle rows |
| Overview: greeting + hero number + period tiles + cards | All three portal homes |
| Sidebar badges + pinned card | Every portal |

### Differentiation

The current UI is light, green and frosted. The new one differs in shell (sidebar with badges and
a pinned card, ⌘K search), colour system (mint/charcoal with a dark theme), type (rounded
geometric, light/medium numerals) and chart and card treatment. That is enough for a fair A/B
comparison, not a recolour.
