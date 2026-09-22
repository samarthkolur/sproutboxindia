# SproutBox

[![Next.js](https://img.shields.io/badge/next-14.x-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/typescript-%2357A6F9.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/prisma-%2300C2A8.svg?logo=prisma&logoColor=white)](https://www.prisma.io)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

SproutBox is a vertical farm management and marketplace web application built with Next.js (App Router), TypeScript, and Prisma (Postgres). It provides user roles for growers and restaurants, production planning, task allocation, QC flows, payouts, and Stripe-based payments.

This README gives contributors and maintainers a clear, runnable development workflow, architecture overview, required environment variables, security guidance, and contribution notes.

## Table of Contents

- Project overview
- Features
- Tech stack
- Quickstart (local)
- Environment variables
- Database (Prisma) & seeding
- Deployment
- Security notes
- Contributing
- License
- Maintainers / Contact

## Project overview

The app uses the Next.js App Router with server and client components. Prisma (with PostgreSQL) is used for data modelling and migrations. Authentication uses NextAuth-compatible patterns and a credentials provider alongside OAuth providers (optional).

Architecture highlights
- App Router pages under `src/app/`
- API routes under `src/app/api/`
- Shared components under `src/components/`
- Business logic and utilities under `src/lib/`
- Types under `src/types/`
- Prisma schema in `prisma/schema.prisma`

## Features

- Role-based accounts: Admin, Grower, Restaurant
- Grower onboarding + tray/task management
- Production plans and batch tracking
- QC review and image check-ins
- Stripe payments and webhooks
- Upload handling via UploadThing
- Admin dashboards, KPIs and allocation tools

## Tech stack

- Next.js 14 (App Router)
- TypeScript
- React 18
- Prisma + PostgreSQL
- Tailwind CSS
- Stripe for payments
- UploadThing for uploads
- Zod for validation

## Quickstart (local development)

1. Clone the repository:

```bash
git clone <repo-url>
cd SproutBox
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file and set the required environment variables (see below).

4. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

5. (Optional) Seed the database locally:

```bash
npx prisma db seed
```

6. Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000

## Environment variables

Provide these values in `.env.local` (do not commit this file):

- `DATABASE_URL` — Postgres connection string (example: `postgresql://user:pass@host:5432/dbname`)
- `AUTH_SECRET` or `NEXTAUTH_SECRET` — session/auth secret
- `STRIPE_SECRET_KEY` — server-side Stripe secret key
- `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` — client-side Stripe publishable key (must be `NEXT_PUBLIC_`-prefixed to reach the browser; required for the restaurant checkout UI to render)
- `STRIPE_WEBHOOK_SECRET` — stripe webhook signing secret
- `UPLOADTHING_TOKEN` — UploadThing v7 API token (required for grower check-in/QC photo uploads)
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` — for Google OAuth (optional)

Tip: Use your cloud provider or GitHub Actions / Vercel secrets to store production values.

## Database & seed

- Prisma schema is `prisma/schema.prisma`.
- Seed file lives at `prisma/seed.ts`. By default the seed script creates demo users; avoid running this in production or change seeded passwords via env overrides.
- To create a fresh database and apply migrations locally:

```bash
npx prisma migrate reset --force
npx prisma db seed
```

## Running tests & linting

- Lint:

```bash
npm run lint
```

- (Add test commands here if/when tests are added)

## Deployment

The project is deployed on Vercel, deploying automatically from `main`.

Vercel project settings:
- Set `DATABASE_URL`, `AUTH_SECRET`/`NEXTAUTH_SECRET`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET`, and `UPLOADTHING_TOKEN` in the Vercel project's environment variables.
- Use `npm run build` as the build command.

## Security notes (important)

- Do NOT commit `.env` files or secrets. Rotate any secrets that were committed accidentally.
- `prisma/seed.ts` contains default demo credentials — update or gate this behind a dev-only flag.
- Remove build output (`.next`) from the repository and add to `.gitignore`.
- Keep `STRIPE_WEBHOOK_SECRET` strictly in your secrets store; do not expose in client code.

## Contributing

We welcome contributions — open issues and PRs.

Guidelines:
- Fork the repo and create a topic branch for your work.
- Follow the existing TypeScript and formatting conventions.
- Run linting locally before opening a PR.
- For larger changes, open an issue first to discuss the design.

## Roadmap & Ideas

- Add automated tests (unit & integration)
- E2E tests for onboarding and payment flows
- CI checks: lint, typecheck, build, run migrations
- Replace seed default credentials with an interactive/dev-only flow

## License

This project is released under the MIT License. See the `LICENSE` file for details.

## Maintainers / Contact

- Project: SproutBox
- Maintainers: (add your contact names / team here)

---

If you'd like, I can now:
- add `.env` and `.next` to `.gitignore` and open a PR,
- update `prisma/seed.ts` to require an env override for seeded credentials,
- remove any committed secrets from the repo history (I can show the commands).
