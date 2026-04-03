# 🌱 SproutBox

**A demand-driven microgreens production and supply platform.**

SproutBox connects restaurants directly to a distributed network of local home growers. Restaurants place orders (demand), the system aggregates demand into tray-level production tasks, assigns them to growers, and delivers fresh, same-day harvested microgreens back to restaurant kitchens.

---

## System Flow

```
Restaurant places order (demand)
        ↓
  Demand is aggregated
        ↓
  Converted into trays
        ↓
  Assigned to growers
        ↓
  Growers grow at home
        ↓
  Harvest & quality check
        ↓
  Delivered to restaurant
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4, Glassmorphism, Custom green theme |
| Auth & DB | [Supabase](https://supabase.com/) (Auth, PostgreSQL, RLS, Storage) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| UI Components | [ShadCN UI](https://ui.shadcn.com/) + custom components |

---

## Features

### Marketing Landing Page
- Hero, Problem, Solution, Features, Benefits, How It Works, CTA sections
- Fully responsive with glassmorphism design and green agriculture theme
- Smooth scroll-triggered animations

### Restaurant Dashboard (`/restaurant`)
- **Order Creation** — Select crops, set quantity in kg, auto tray conversion (1 tray ≈ 0.25 kg)
- **Order Tracking** — Real-time status: `Pending → Assigned to Growers → Growing → Ready for Harvest → Delivered`
- **Subscriptions** — Set up recurring daily/weekly/bi-weekly deliveries
- **Feedback** — Rate delivered orders

### Grower Dashboard (`/grower`)
- Tray assignments with day-by-day growing instructions
- Growth photo uploads and milestone tracking
- Yield recording (weight + quality rating)

### Authentication
- Supabase Auth with email/password signup
- Role-based routing (grower / restaurant / admin)
- Protected dashboard routes via middleware

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A [Supabase](https://supabase.com/) project

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/sproutbox.git
cd sproutbox
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project dashboard → Settings → API.

### 4. Set Up the Database

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy and paste the contents of supabase/schema.sql
# into the Supabase SQL Editor and execute
```

This creates all required tables:
- `profiles` — User profiles with roles
- `orders` — Restaurant orders with supply chain statuses
- `subscriptions` — Recurring delivery schedules
- `tray_assignments` — Grower production tasks
- `daily_instructions` — Day-by-day growing guides
- `milestones` — Growth milestones
- `growth_uploads` — Grower photo uploads
- `yield_records` — Harvest weight and quality
- `feedback` — Restaurant order ratings

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
SproutBox/
├── app/
│   ├── (auth)/            # Login & signup pages
│   ├── (dashboard)/       # Protected dashboards
│   │   ├── grower/        # Grower dashboard
│   │   ├── restaurant/    # Restaurant dashboard
│   │   └── layout.tsx     # Dashboard layout with role display
│   ├── (marketing)/       # Landing page
│   ├── auth/callback/     # Supabase auth callback
│   ├── globals.css        # Theme tokens, glassmorphism, gradients
│   └── layout.tsx         # Root layout
├── components/
│   ├── dashboard/         # Dashboard components (OrderForm, OrderTable, etc.)
│   ├── layout/            # Navbar, Footer
│   ├── sections/          # Landing page sections
│   └── ui/                # Reusable UI primitives
├── lib/
│   ├── auth.ts            # Auth helpers
│   ├── supabase/          # Supabase client (server + client)
│   ├── types.ts           # Shared TypeScript types
│   └── utils.ts           # Utility functions
├── supabase/
│   └── schema.sql         # Database schema
└── middleware.ts           # Route protection
```

---

## Order Status Flow

| Status | Meaning |
|--------|---------|
| `pending` | Order placed, awaiting processing |
| `assigned_to_growers` | Production tasks distributed to growers |
| `growing` | Microgreens actively growing in trays |
| `ready_for_harvest` | Growth complete, ready for harvest & collection |
| `delivered` | Harvested, quality checked, and delivered |

---

## License

This project is part of an academic coursework submission (DSU — SEM 6, LSM).
# sproutboxindia
