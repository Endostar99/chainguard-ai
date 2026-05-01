# ChainGuard AI — Claude Code Context

> AI-powered smart contract security auditor built for founders, not just engineers.
> Solo founder project. Work Part-time ~10–15 hrs/week alongside BA full-time role.

---

## Project Overview

**Product:** ChainGuard AI — SaaS web app where users paste Solidity smart contracts and receive:
1. A plain-English security report with severity-ranked vulnerabilities
2. A 0–100 Trust Score
3. Actionable fix suggestions with corrected code
4. A downloadable PDF report
5. A shareable trust badge (for scores ≥ 80)

**Positioning:** "The first smart contract auditor built for founders, not just engineers."
**Target Users:** Indie developers, pre-seed startups, hackathon participants, students building on testnets.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 15 (App Router) | TypeScript, Turbopack in dev |
| Styling | Tailwind CSS v4 | Dark theme, green brand color |
| Code Editor | CodeMirror (via `@uiw/react-codemirror`) | Solidity syntax via lang-javascript |
| Database | Supabase (Postgres) | Auth + DB + Storage |
| AI Engine | Anthropic Claude API | `claude-sonnet-4-6` model |
| Charts | Recharts | Trust score gauge, severity breakdown |
| PDF | react-pdf | Branded report downloads |
| Payments | Stripe | Subscriptions + webhooks |
| Deployment | Vercel + Supabase | Zero DevOps |

**Path aliases:** `@/` maps to `src/`

---

## Development Commands

```bash
npm install          # Install dependencies (first time)
npm run dev          # Start dev server at http://localhost:3000 (Turbopack)
npm run build        # Production build
npm run type-check   # TypeScript check without building
npm run lint         # ESLint
npm run format       # Prettier (writes files)
```

---

## Project Structure

```
chainguard-ai/
├── CLAUDE.md                        # ← You are here
├── .env.local                       # Environment variables (gitignored)
├── .env.example                     # Template — copy to .env.local
├── src/
│   ├── middleware.ts                # Auth guard + session refresh
│   ├── types/index.ts               # All shared TypeScript types
│   ├── lib/
│   │   ├── utils.ts                 # cn(), severity colors, trust score
│   │   ├── supabase/
│   │   │   ├── client.ts            # Browser Supabase client
│   │   │   └── server.ts            # Server Supabase client (RSC/API routes)
│   │   ├── claude/
│   │   │   ├── audit-prompt.ts      # THE CORE PROMPT — most important file
│   │   │   └── client.ts            # runAudit() function
│   │   └── stripe/
│   │       └── client.ts            # Stripe SDK instance + price IDs
│   ├── app/
│   │   ├── layout.tsx               # Root layout + metadata
│   │   ├── page.tsx                 # Marketing homepage
│   │   ├── globals.css              # Tailwind base + component classes
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx       # Login — TODO: implement Supabase auth form
│   │   │   └── signup/page.tsx      # Signup — TODO: implement
│   │   ├── (dashboard)/
│   │   │   ├── audit/page.tsx       # NEW AUDIT — TODO: CodeMirror editor
│   │   │   └── history/page.tsx     # AUDIT HISTORY — TODO: list from Supabase
│   │   ├── audit/[id]/page.tsx      # AUDIT RESULTS — TODO: report display
│   │   ├── badge/[auditId]/page.tsx # PUBLIC TRUST BADGE — TODO: certificate
│   │   └── api/
│   │       ├── audit/route.ts       # POST /api/audit — main AI pipeline
│   │       ├── auth/route.ts        # GET /api/auth — OAuth callback
│   │       └── stripe/webhook/route.ts  # POST — Stripe webhook handler
│   └── components/
│       ├── ui/                      # Reusable UI primitives (Button, Input, Badge…)
│       ├── audit/                   # Audit-specific components (VulnCard, TrustGauge…)
│       └── layout/                  # Nav, Footer, Sidebar
└── supabase/
    └── migrations/001_initial_schema.sql  # Run this in Supabase SQL editor
```

---

## Database Schema (Supabase/Postgres)

```sql
-- audits
id              uuid PK
user_id         uuid FK → auth.users (nullable for anonymous)
contract_name   text (nullable)
contract_code   text
report_json     jsonb  -- full AuditReport object
trust_score     integer (0–100)
created_at      timestamptz

-- subscriptions
id                      uuid PK
user_id                 uuid FK → auth.users (unique)
stripe_customer_id      text (unique)
stripe_subscription_id  text (unique)
plan                    enum: free | starter | pro
status                  enum: active | canceled | past_due | trialing
audits_used_this_month  integer
current_period_end      timestamptz
```

See `supabase/migrations/001_initial_schema.sql` for the full migration with RLS policies.

---

## Pricing & Audit Limits

| Plan | Price | Audits/month |
|------|-------|-------------|
| Free | $0 | 3 |
| Starter | $49/mo | 20 |
| Pro | $199/mo | 100 |

Defined in `src/types/index.ts` → `PLAN_LIMITS`.

---

## The Core AI Audit Pipeline

**File:** `src/lib/claude/audit-prompt.ts` — **the most important file in the project.**

Flow:
1. User submits Solidity code via `POST /api/audit`
2. `runAudit()` in `src/lib/claude/client.ts` calls Claude with `AUDIT_SYSTEM_PROMPT`
3. Claude returns structured JSON → validated and parsed as `AuditReport`
4. Stored in Supabase `audits` table
5. `trustScore` is returned to client + audit ID for redirect to results page

**Prompt iteration:** Test against known-vulnerable contracts in `../Prompt_Test_Dataset.xlsx`.
Target: catch ≥ 80% of Critical and High issues before public launch.

---

## Key TypeScript Types

```typescript
// src/types/index.ts
type Severity = "critical" | "high" | "medium" | "low" | "info"

interface AuditReport {
  executiveSummary: string      // Plain-English founder summary
  trustScore: number            // 0–100
  severityBreakdown: Record<Severity, number>
  vulnerabilities: Vulnerability[]
  auditedAt: string             // ISO timestamp
  model: string                 // "claude-sonnet-4-6"
}

interface Vulnerability {
  id: string                    // "CG-001"
  title: string
  severity: Severity
  description: string           // Technical description
  impact: string                // Plain-English impact
  affectedLines: number[]
  vulnerableCode?: string
  fixSuggestion: string
  fixCode?: string
  reference?: string            // SWC-107 etc
}
```

---

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe dashboard → Webhooks → endpoint secret |
| `STRIPE_PRICE_STARTER_ID` | Stripe dashboard → Products → Starter plan price ID |
| `STRIPE_PRICE_PRO_ID` | Stripe dashboard → Products → Pro plan price ID |

---

## Current Build Status

**Phase 1 — MVP Build (Weeks 2–8)**

- [x] Project scaffold (Next.js 15, Tailwind, TypeScript)
- [x] Core types and utilities
- [x] Supabase client (browser + server)
- [x] Claude audit pipeline (`runAudit()` function + prompt)
- [x] `POST /api/audit` route (auth check, limit check, AI call, DB save)
- [x] Stripe client setup
- [x] Supabase DB migration (schema + RLS)
- [x] Auth middleware (session refresh + protected routes)
- [ ] Home page polish (marketing copy, animations)
- [ ] Login/Signup forms (Supabase auth)
- [ ] Audit submission page (CodeMirror editor + file upload)
- [ ] Audit results page (trust score gauge, vulnerability cards)
- [ ] Audit history page
- [ ] PDF report generation (react-pdf)
- [ ] Trust badge page
- [ ] Stripe subscription integration (checkout flow)
- [ ] Stripe webhook handler (subscription updates)
- [ ] Deploy to Vercel

---

## Important Notes

1. **Disclaimer on every report:** "This report is AI-generated and advisory only. High-value contracts should undergo human expert review." — legally required, never remove.

2. **Prompt is the moat.** Every change to `audit-prompt.ts` should be tested against the test dataset. Track accuracy % before/after each prompt version.

3. **RLS is ON.** Supabase Row Level Security is enabled on both tables. Test with different user sessions to avoid access control bugs.

4. **Trust score formula:** `100 - (30 × critical) - (15 × high) - (7 × medium) - (3 × low)`, floored at 0. Defined in `src/lib/utils.ts → calculateTrustScore()`.

5. **Solidity editor:** Use `@uiw/react-codemirror` with `@codemirror/lang-javascript` for syntax highlighting (JavaScript mode works for Solidity). The component must be a Client Component (`"use client"`).
