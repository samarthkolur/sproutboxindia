# A/B Experiments

SproutBox runs A/B tests on the marketing site and sign-up flows. Visitors are
split on the server, so the right version is in the first HTML (no flicker), and
results are reported in **Google Analytics 4**.

## How it works

1. **Middleware** (`src/middleware.ts`) gives every visitor a random first-party
   id in the `sb_vid` cookie (90 days) and flags bots by user agent.
2. **The marketing layout** (`src/app/(marketing)/layout.tsx`) reads that id and
   picks a variant for every experiment: `hash(experiment + visitor id)` → bucket.
   The same visitor always sees the same variant; experiments split independently.
3. **Components** call `useVariant("experiment_key")` to get `"control"` or `"b"`.
   The first time a visitor sees a running experiment in a session, a GA4
   `experiment_exposure` event fires.
4. The visitor's variants are also set as **GA4 user properties**
   (`exp_<experiment>`), so every later event (`cta_click`, `sign_up`, `purchase`)
   can be split by variant.

Bots, and anyone using a QA override, always count as untracked.

## Current experiments

All defined in `src/lib/experiments/config.ts`.

| Key | What changes | Status | Primary metric |
|---|---|---|---|
| `hero_headline` | Hero: "Farm-to-fork, door to door." vs "Fresh microgreens, grown next door." | **running** | `cta_click` |
| `hero_cta_order` | Hero: grower button first vs restaurant button first | draft | `cta_click` |
| `nav_cta_label` | Navbar button: "Get Started" vs "Join the Network" | draft | `cta_click` (location = nav) |
| `grower_form_length` | `/join/grower`: 5 steps vs 3 steps (space + kit together, no review, UPI added later from the profile) | draft | `sign_up` (method = grower) |

## Starting, stopping and ending an experiment

Edit the `status` in `config.ts` and deploy:

| Status | Who sees what | Tracked? |
|---|---|---|
| `draft` | everyone sees control | no |
| `running` | split by `weight` | yes |
| `paused` | everyone sees control | no |
| `concluded` | everyone sees `winner` | no |

Rules:
- **Only one running experiment per `area`** (the unit tests enforce this), so results don't mix.
- **Don't change weights or variants while running.** That reshuffles visitors. End it and start a new key instead.
- Run each test for **at least 2 weeks** (to cover weekday/weekend patterns) and until each variant has **~1,000 exposures**.
- When done, set `status: "concluded"` and `winner: "b"` (or `"control"`). Later, delete the losing code path and the experiment entry.

### Recommended order

1. `hero_headline` (running now)
2. `nav_cta_label` and `grower_form_length` (different areas, so they can run alongside #1)
3. `hero_cta_order`, after `hero_headline` ends (same hero, different area key, but keeps the read clean)

## Adding a new experiment

1. Add an entry to `EXPERIMENTS` in `src/lib/experiments/config.ts` (`status: "draft"`).
2. In the component: `const v = useVariant("my_experiment");` and render on `v === "b"`.
   The component must be inside the `(marketing)` route group (that's where the provider lives).
3. Add any new English text to `translations` in `src/lib/i18n.ts` (Kannada + Hindi).
4. Track the success action with `trackWithExperiments("event_name", {...})` from
   `useExperiments()`, or an existing `gtag.ts` helper.
5. Preview both variants with `?sb_force=` (below), run `npm test`, then set `status: "running"`.

## Previewing variants (QA)

Add `?sb_force=<experiment>:<variant>` to any marketing URL. It sticks for the browser
session; comma-separate several. Forced views are never tracked.

```
http://localhost:3000/?sb_force=hero_headline:b
http://localhost:3000/?sb_force=hero_headline:b,nav_cta_label:b
http://localhost:3000/join/grower?sb_force=grower_form_length:b
http://localhost:3000/?sb_force=clear
```

Works in development automatically; in production only if `ALLOW_FORCE_VARIANT=true`.

## One-time GA4 setup

In **GA4 Admin → Custom definitions**:

- **User-scoped custom dimensions**: one per experiment, with user property
  `exp_hero_headline`, `exp_hero_cta_order`, `exp_nav_cta_label`, `exp_grower_form_length`.
- **Event-scoped custom dimensions**: `experiment`, `variant`, `location`, `target`.
- Mark `sign_up` and `cta_click` as **key events** if they aren't already.

## Reading results

GA4 → **Explore → Free form**:
- Rows: the `exp_<experiment>` user dimension
- Values: Total users, Event count
- Filter: event name = the primary metric (e.g. `cta_click`)

Conversion rate per variant = users who fired the metric ÷ users with an
`experiment_exposure` for that experiment. Call a winner only if the difference
is statistically significant (e.g. a two-proportion z-test, p < 0.05). An online
A/B significance calculator works fine. Small differences on a few hundred visitors are noise.

## Events reference

| Event | When | Key params |
|---|---|---|
| `experiment_exposure` | first time a visitor sees a running experiment in a session | `experiment`, `variant`, `page_path`, `device` |
| `cta_click` | any "join" button on the landing page | `location` (hero, nav, growers_section, restaurants_section, bottom_cta, footer), `target`, `exp_*` |
| `sign_up` | grower / restaurant registration succeeds | `method`, `city`, `form_variant` (grower) |
| `purchase` | restaurant order paid | existing, unchanged |
