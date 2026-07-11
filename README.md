# RealtyFlow CRM

A real estate CRM for developers and channel partners — lead capture and attribution, sales pipeline management, site visits, inventory and bookings, marketing conversion tracking, and role-based access across multiple projects.

This is an initial full-stack scaffold covering the data model and core workflows from the PRD: multi-tenant builders/projects, RBAC, lead lifecycle with assignment and follow-up automation, site visits, inventory, bookings/payments, marketing attribution with a Meta/Google conversion event feedback loop, automation rules, and role-aware dashboards/reports. Deeper integrations (real Meta CAPI / Google Ads calls, WhatsApp/SMS/Email delivery, mobile app) are stubbed or simulated and are natural next steps.

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4
- **Auth:** Auth.js (NextAuth v5) — credentials + JWT sessions, RBAC via role + project scoping
- **Database:** PostgreSQL + Prisma ORM 7 (`@prisma/adapter-pg`)
- **UI:** Hand-built Tailwind component primitives (button, card, table, badge, etc.) in `src/components/ui`

## Getting Started

### 1. Database

Point `DATABASE_URL` in `.env` at a Postgres instance (see `.env` for the local default). Then:

```bash
npm install
npx prisma migrate dev   # creates schema
npm run db:seed          # seeds demo data (see below)
```

### 2. Run the app

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

### Demo credentials

The seed script (`prisma/seed.ts`) creates a demo builder ("VSK Housing India") with two projects and one user per role. Password for every seeded user is `Password123!`.

| Role | Email |
|---|---|
| Super Admin | sales@vskhousingindia.com |
| Builder Admin | rohan.mehta@vskhousingindia.com |
| Sales Manager | priya.nair@vskhousingindia.com |
| Marketing Manager | sana.sheikh@vskhousingindia.com |
| Telecaller | neha.kulkarni@vskhousingindia.com |
| Sales Executive | vikram.singh@vskhousingindia.com |

The seed also prints a one-time webhook API key for `POST /api/leads/webhook` (lead capture from ad platforms/website forms).

## Project layout

- `prisma/schema.prisma` — full data model (builders, projects, users/RBAC, leads, activities, tasks, site visits, inventory, bookings/payments, communication, marketing/conversion events, automation, notifications, audit log, API keys, webhook logs)
- `src/app/(app)/*` — authenticated app shell and modules (leads, site visits, bookings, inventory, projects, marketing, automation, reports, users)
- `src/app/api/leads/webhook` — API-key-authenticated lead ingestion endpoint with duplicate detection and rule-based assignment
- `src/lib/permissions.ts` — role → capability matrix driving both nav visibility and server-side authorization checks
- `src/lib/assignment.ts` — lead assignment rule engine (round robin, budget-based, area-based)

## Useful scripts

```bash
npm run db:migrate   # prisma migrate dev
npm run db:seed      # re-seed demo data
npm run db:studio    # prisma studio
npm run build        # production build + typecheck
```
