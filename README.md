# RealtyFlow CRM

A real estate CRM for developers and channel partners — lead capture and attribution, sales pipeline management, site visits, inventory and bookings, marketing conversion tracking, automation, and role-based access across multiple projects.

This covers the data model and workflows from the PRD end-to-end: multi-tenant builders/projects, RBAC (with 2FA, IP allowlisting and remote session revocation), lead lifecycle with rule-based assignment and a running automation engine, site visits, inventory, bookings/payments, marketing attribution with a Meta CAPI / Google Ads conversion feedback loop, CSV lead import, a REST API, and role-aware dashboards/reports.

## What's real vs. simulated

- **Real:** everything in the app itself — auth/RBAC, 2FA, the automation rule engine, audit logging, CSV import, the REST API, notifications, session revocation, IP allowlisting.
- **Simulated with a real integration point:** outbound WhatsApp/SMS/email (`src/lib/providers/communication.ts`) and Meta CAPI / Google Ads conversion events (`src/lib/providers/conversion.ts`) call the real provider APIs when credentials are present in the environment (see below), and fall back to logging + a simulated "sent" result otherwise — so the app behaves identically with or without real credentials.
- **Not built:** native mobile app, AI features (PRD §27, explicitly listed as future work), and Google Ads' OAuth token exchange (the conversion call is wired up but needs a registered OAuth client to complete).

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4
- **Auth:** Auth.js (NextAuth v5) — credentials + JWT sessions, RBAC via role + project scoping, optional TOTP 2FA
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

The seed also prints a one-time webhook/API key (used for `POST /api/leads/webhook` and the `/api/v1/*` REST endpoints) — save it, or generate a new one anytime at `/settings/api-keys`.

### Optional environment variables

Everything below is optional — omit any of them and the relevant feature falls back to a logged/simulated result instead of failing.

| Variable | Enables |
|---|---|
| `CRON_SECRET` | Required to call `POST /api/cron/follow-up-check` (see below) |
| `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | Real WhatsApp Business Cloud API sends |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Real SMS sends via Twilio |
| `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS` | Real email sends via Resend |

Meta CAPI and Google Ads conversion credentials are configured per-`MarketingSource` (in `/marketing`), not as env vars, since a builder may run multiple pixels/accounts.

## Automation engine and the cron endpoint

`src/lib/automation.ts` evaluates `AutomationRule`s and executes their actions (assign lead, notify manager, send WhatsApp/SMS/email) whenever a lead is created, its status changes, a site visit completes, or a booking is created — these fire inline from the relevant server action/webhook.

Two triggers are time-based (`FOLLOW_UP_MISSED`, `NO_ACTIVITY`) and have no request to hang off, so `POST /api/cron/follow-up-check` exists for an external scheduler (Vercel Cron, GitHub Actions, `cron(1)`, etc.) to call periodically — e.g. hourly — with header `Authorization: Bearer $CRON_SECRET`.

## Project layout

- `prisma/schema.prisma` — full data model (builders, projects, users/RBAC, leads, activities, tasks, site visits, inventory, bookings/payments, communication, marketing/conversion events, automation, notifications, audit log, API keys, webhook logs)
- `src/app/(app)/*` — authenticated app shell and modules (leads, site visits, bookings, inventory, projects, marketing, automation, reports, users, settings)
- `src/app/(app)/settings/*` — API keys, webhook logs, 2FA/session security, org IP allowlist
- `src/app/api/leads/webhook` — API-key-authenticated lead ingestion endpoint with duplicate detection and rule-based assignment
- `src/app/api/v1/*` — API-key-authenticated REST endpoints for projects, inventory units, bookings, marketing campaigns and leads
- `src/app/api/cron/follow-up-check` — bearer-token-protected endpoint for time-based automation triggers
- `src/lib/permissions.ts` — role → capability matrix driving both nav visibility and server-side authorization checks
- `src/lib/assignment.ts` — lead assignment rule engine (round robin, budget-based, area-based)
- `src/lib/automation.ts` — automation rule evaluation + action execution
- `src/lib/providers/*` — pluggable WhatsApp/SMS/email and Meta/Google conversion senders
- `src/lib/totp.ts` — dependency-free TOTP (RFC 6238) implementation for 2FA
- `src/lib/csv.ts` — dependency-free CSV parser (the npm `xlsx` package has known unpatched vulnerabilities, so Excel import isn't wired up — export to CSV first)

## Useful scripts

```bash
npm run db:migrate   # prisma migrate dev
npm run db:seed      # re-seed demo data
npm run db:studio    # prisma studio
npm run build        # production build + typecheck
```
