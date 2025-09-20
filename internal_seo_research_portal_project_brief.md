# Internal SEO Research Portal — Project Brief

A lightweight, internal web app that combines **DataForSEO APIs** with **AI-assisted analysis** to help the marketing team run quick research, generate insights, and produce shareable briefs—without jumping across tools.

---

## 1) Objectives & Scope
- **Primary goal:** Enable non-technical marketers to perform keyword, SERP, competitor, and backlink research from a simple interface, and auto-generate actionable briefs.
- **Secondary goals:** Centralize research history, enforce consistent methodology, and keep costs predictable.
- **Non-goals (for MVP):** Full site audits, large-scale crawling, advanced link prospecting outreach.

---

## 2) Target Users & Permissions
- **Roles:**
  - *Marketer* (default): Run research, view dashboards, generate briefs.
  - *Analyst:* Advanced filters/exports, prompt editing, manage presets.
  - *Admin:* User management (SSO), budget controls, API keys, data retention.
- **SSO:** SAML/OIDC (e.g., Google Workspace, Okta, Azure AD).

---

## 3) Core Workflows (MVP)
1. **Keyword Discovery (Selected)**
   - Inputs: seed term(s), locale, language, device.
   - Data: *Keywords Data → Google Ads (volume, CPC, competition) + Trends*; *Labs → Keyword Suggestions/Ideas*.
   - Outputs: Saved list + basic clustering (optional) + quick-win recommendations.
2. **SERP Snapshot (Selected)**
   - Inputs: keyword(s), location, device.
   - Data: *SERP → Google Organic*; if local intent, *Google Maps/Local Pack*.
   - Outputs: Top results, SERP features seen, inferred intent, difficulty proxy, content format guidance.
3. **Competitor Overview (Selected-lite)**
   - Inputs: seed domain(s) or from SERP snapshot.
   - Data: *Labs → SERP Competitors* (derive competing domains from SERPs for target keywords).
   - Outputs: Overlapping keywords list + short opportunity notes.
4. **Backlink Check (Selected-lite)**
   - Inputs: domain/URL.
   - Data: *Backlinks → Summary + Referring Domains* only.
   - Outputs: High-level authority signals, top referring domains, quick reclaim/fix ideas.
5. **OnPage (Light)**
   - Inputs: single URL or small set.
   - Data: *OnPage API* minimal crawl (title/meta, headings, canonical, status codes, basic issues).
   - Outputs: Quick tech checklist for the content brief.
6. **Content Brief Generator**
   - Inputs: chosen keyword(s)/cluster + SERP snapshot.
   - Steps: AI composes outline, entities, FAQs, internal links, meta tags.
   - Outputs: Editable brief + export to Docs/Notion.

---

## 4) DataForSEO Endpoints (Selected for MVP)
- **SERP**: Google Organic; Google Maps/Local Pack (when local intent only). *Task Post → Tasks Ready → Task Get*.
- **Keywords Data**: Google Ads (Search Volume, CPC/Competition); Google Trends.
- **Labs**: Keyword Suggestions / Keyword Ideas; SERP Competitors.
- **Backlinks**: Summary; Referring Domains.
- **OnPage**: Minimal crawl for key on-page elements.

**Task Manager remains required** for async polling, normalization, and caching.

---

## 5) AI Features (LLM Layer)
- **Insight Summaries:** Turn raw metrics into plain-language takeaways.
- **Prompt Presets:** “Keyword Opportunity Scan,” “SERP Intent Map,” “Brief Writer.”
- **Chain-of-Thought Control:** Keep hidden; only show final reasoning.
- **Guardrails:** Cost caps, deterministic modes for briefs, hallucination checks.

---

## 6) Simple UI Layout (Wireframe Notes)
- **Left Nav:** Dashboard · Projects · Research · Briefs · Settings.
- **Top Bar:** Search box, locale selector, device toggle, run button.
- **Main Pane (Research):** Inputs card → results tabs (Keywords, SERP, Competitors, Backlinks) → AI Insight panel.
- **Brief Editor:** Rich text with locked templates + variables.
- **Save/Export:** CSV, Google Sheets, Notion, Markdown, PDF.

---

## 7) Architecture (MVP-friendly)
- **Frontend:** React (Next.js) + Tailwind.  
- **Backend:** Node.js/TypeScript (Fastify/NestJS).  
- **LLM:** OpenAI/Azure OpenAI.  
- **DataForSEO:** REST; queue async tasks.  
- **Storage:** Postgres, Redis, S3/GCS.  
- **Deployment:** Vercel/Netlify (frontend), Fly.io/Render/K8s (backend).

---

## 8) Data Model (Sketch)
- **users**(id, email, role, sso_sub)
- **projects**(id, name, owner_id)
- **queries**(id, project_id, type, payload_json, created_by)
- **tasks**(id, provider, provider_task_id, status, cost_estimate, result_json)
- **datasets**(id, project_id, name, kind, meta_json)
- **briefs**(id, project_id, title, sections_json, source_dataset_id, version, created_by)
- **exports**(id, brief_id, format, url)
- **budgets**(id, unit, limit, period, role)

---

## 9) Cost, Rate Limits & Caching
- Local cache of SERP snapshots with TTL.  
- Deduping: avoid duplicate tasks.  
- Batching: submit keywords in groups.  
- Budgets: per-project and per-role caps.  
- Usage reports: costs by endpoint, team, project.

---

## 10) Security & Compliance
- Internal access only (VPN/SSO).  
- Secrets in vault.  
- Minimal PII.  
- Respect provider ToS.

---

## 11) QA & Data Quality
- Golden sets.  
- Regression tests.  
- Manual spot checks.

---

## 12) MVP Checklist (4–6 weeks of focused build)
1. Auth (SSO) + roles  
2. Projects + research forms (keyword, SERP, on-page light)  
3. Integrations:  
   - SERP: Google Organic (+ Maps when local)  
   - Keywords: Google Ads + Trends  
   - Labs: Keyword Suggestions/Ideas + SERP Competitors  
   - Backlinks: Summary + Referring Domains  
4. Task Manager + caching + dedupe  
5. AI Insight panel + 2 prompt presets (Opportunity Scan, SERP Intent Map)  
6. Brief generator + export to Google Docs  
7. Cost dashboard + budget caps  
8. Logging, alerts, minimal analytics

---

## 13) Phase 2 Ideas
- Keyword clustering (ML-based).  
- Entity extraction.  
- Backlink risk scoring.  
- Shareable stakeholder links.  
- Timeline trends.

---

## 14) Success Metrics
- Time-to-insight ↓  
- % briefs from tool ↑  
- Cost/task vs. external tools ↓  
- Weekly active users ↑

---

## 15) Open Questions
- Which locales/languages/devices are mandatory on day one?  
- How sensitive are budgets?  
- Which export formats are must-have?  
- Do we need audit logs?

---

## 16) Example API Integrations (Pseudocode)
```ts
// SERP — Google Organic
POST /v3/serp/google/organic/task_post
{
  "data": [{ "keyword": "best standing desk", "location_name": "United States", "language_name": "English", "device": "desktop" }]
}
GET  /v3/serp/google/organic/tasks_ready
GET  /v3/serp/google/organic/task_get/advanced/$task_id

// SERP — Google Maps (when local intent)
POST /v3/business_data/google/maps/task_post
GET  /v3/business_data/google/maps/tasks_ready
GET  /v3/business_data/google/maps/task_get/advanced/$task_id

// Keywords — Google Ads volume & CPC/competition
POST /v3/keywords_data/google_ads/search_volume/task_post
GET  /v3/keywords_data/google_ads/search_volume/tasks_ready
GET  /v3/keywords_data/google_ads/search_volume/task_get/$task_id

// Keywords — Google Trends
POST /v3/keywords_data/google_trends/task_post
GET  /v3/keywords_data/google_trends/tasks_ready
GET  /v3/keywords_data/google_trends/task_get/$task_id

// Labs — Keyword Suggestions / Ideas
POST /v3/dataforseo_labs/keyword_suggestions/task_post
GET  /v3/dataforseo_labs/keyword_suggestions/tasks_ready
GET  /v3/dataforseo_labs/keyword_suggestions/task_get/$task_id

// Labs — SERP Competitors
POST /v3/dataforseo_labs/serp_competitors/task_post
GET  /v3/dataforseo_labs/serp_competitors/tasks_ready
GET  /v3/dataforseo_labs/serp_competitors/task_get/$task_id

// Backlinks — Summary + Referring Domains
POST /v3/backlinks/summary/live
POST /v3/backlinks/referring_domains/live

// OnPage — light crawl
POST /v3/on_page/instant_pages
```

---

## 17) AI Prompt Presets (Drafts)
**A. Keyword Opportunity Scan (MVP)**  
- Grounding: Keywords (Google Ads + Trends) + Labs (Suggestions/Ideas) + SERP snapshot.  
- Output: Top 10 opportunities with volume, CPC, difficulty proxy, suggested content type.

**B. SERP Intent Map (MVP)**  
- Grounding: SERP organic (+ Maps when local).  
- Output: Dominant intent, recurring content formats, on-page checklist.

**C. Brief Writer (MVP)**  
- Grounding: Selected keywords + SERP snapshot + OnPage checks.  
- Output: Outline (H1/H2/H3), entities, FAQs, internal links, meta tags.

---

## 18) Risks & Mitigations
- **API scope creep:** Lock to selected endpoints; feature flags for expansion.  
- **Data freshness:** Cache TTL + manual refresh + timestamps.  
- **LLM hallucination:** Force citations; block unsupported metrics.  
- **Cost overruns:** Per-role budgets; batch/dedupe requests.  
- **Local vs non-local:** Only call Maps if local intent is detected.

---

## 7a) Monorepo Folder Structure (for Claude Code + VS Code)

> This is the **project layout** your devs should scaffold. Keep this in the repo root as reference.

```bash
seo-portal/
├─ apps/
│  ├─ web/                      # Frontend website (Next.js + Tailwind + shadcn)
│  │  ├─ app/                   # Routes, layouts, edge API helpers (optional)
│  │  ├─ components/            # Reusable UI blocks (tables, forms, charts)
│  │  ├─ features/              # Slices: keyword/, serp/, backlinks/, onpage/
│  │  ├─ lib/                   # Client utils (fetcher, zod schemas)
│  │  ├─ styles/                # Global styles
│  │  ├─ public/                # Static assets
│  │  └─ tests/
│  └─ server/                   # Backend API (Node/TS: Fastify or NestJS)
│     ├─ src/
│     │  ├─ api/                # Route handlers (REST) grouped by feature
│     │  │  ├─ keyword/
│     │  │  ├─ serp/
│     │  │  ├─ backlinks/
│     │  │  ├─ onpage/
│     │  │  └─ health/
│     │  ├─ services/           # Business logic (compose DB + integrations)
│     │  ├─ integrations/
│     │  │  ├─ dataforseo/
│     │  │  │  ├─ client.ts     # HTTP client (auth, retry, rate-limit)
│     │  │  │  ├─ serp.ts       # Google Organic (+ Maps when local)
│     │  │  │  ├─ keywords.ts   # Google Ads volume + CPC/competition
│     │  │  │  ├─ labs.ts       # Suggestions/Ideas + SERP Competitors
│     │  │  │  ├─ backlinks.ts  # Summary + Referring Domains
│     │  │  │  └─ onpage.ts     # Light on-page checks
│     │  │  └─ llm/             # AI provider wrapper (prompt calling)
│     │  ├─ workers/            # Queue jobs (poll tasks_ready → fetch results)
│     │  │  ├─ poller.ts
│     │  │  └─ pipelines/       # normalize → enrich → cache → notify
│     │  ├─ db/
│     │  │  ├─ prisma/          # schema.prisma, migrations/ (if using Prisma)
│     │  │  └─ queries/         # hand-written SQL repos (optional)
│     │  ├─ cache/              # Redis adapters, cache keys & TTLs
│     │  ├─ auth/               # SSO (OIDC/Okta/Google) + RBAC policies
│     │  ├─ config/             # typed env config (zod)
│     │  ├─ utils/
│     │  └─ index.ts
│     ├─ tests/
│     └─ scripts/               # seeds, smoke tests
│
├─ packages/
│  ├─ shared/                   # Shared TypeScript types & zod schemas
│  ├─ ui/                       # (Optional) shared UI components
│  ├─ eslint-config/            # Repo-wide lint rules
│  └─ tsconfig/                 # Base tsconfigs
│
├─ prompts/                     # AI prompt templates used by the app
│  ├─ keyword-opportunities.md
│  ├─ serp-intent-map.md
│  └─ brief-writer.md
│
├─ docs/                        # Docs & API contracts for devs
│  ├─ ADR-0001-monorepo.md
│  └─ api-contracts/            # OpenAPI/JSON Schemas for our API
│
├─ infra/                       # Dev/prod setup
│  ├─ docker/                   # compose.yml for Postgres, Redis, server, web
│  ├─ terraform/                # (Optional) cloud infra
│  └─ github/                   # CI pipelines (GitHub Actions)
│
├─ .env.example                 # Document required env vars
├─ package.json                 # Workspaces (pnpm/yarn) + scripts
├─ pnpm-workspace.yaml          # If using pnpm workspaces
├─ turbo.json                   # Turborepo pipeline (optional, recommended)
└─ README.md                    # Non-technical overview
```

### What each main part does (plain English)
- **apps/web**: The website your team uses (screens, buttons, tables).
- **apps/server**: The hidden engine that calls DataForSEO + AI and stores results.
- **workers**: Little robots that keep checking DataForSEO until data is ready.
- **packages/shared**: Common “shapes” of data so web & server agree.
- **prompts**: Saved AI instructions so outputs are consistent.
- **infra**: Switches and plugs for running locally or online.

### Standard scripts (run from repo root)
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  }
}
```

### Required env vars (document in `.env.example`)
- `DATAFORSEO_AUTH` (or login/password as required)
- `OPENAI_API_KEY`
- `DATABASE_URL` (Postgres), `REDIS_URL`
- `OIDC_*` for SSO, `NEXTAUTH_SECRET`

---

## 19) Rough Timeline (Example)
- **Week 1:** Auth + skeleton UI + DB schema.  
- **Week 2:** SERP (Organic + Maps) + Task Manager.  
- **Week 3:** Keywords (Ads + Trends) + Labs (Suggestions/Competitors).  
- **Week 4:** Backlinks + OnPage light.  
- **Week 5:** AI Insight + Brief generator + exports + budget dashboard.  
- **Week 6:** QA, observability, security review, launch.

---

## 20) Monorepo Folder Structure
```
seo-portal/
├─ apps/
│  ├─ web/        → the website (what your team clicks on)
│  └─ server/     → the engine room (talks to DataForSEO & AI)
├─ packages/
│  ├─ shared/     → shared code, types, constants
│  └─ ui/         → optional shared UI components
├─ prompts/       → saved AI instructions/templates
├─ docs/          → documentation, notes, API contracts
├─ infra/         → deployment setup (Docker, cloud config)
├─ .env.example   → example environment variables
├─ package.json   → project dependencies
└─ README.md      → overview of the project
```

**apps/web/** contains:
- pages (screens like Keyword Research, SERP Snapshot)  
- components (buttons, tables, charts)  
- styles (colors, fonts)  

**apps/server/** contains:
- api (endpoints for the website to ask for data)  
- integrations (DataForSEO + AI clients)  
- workers (robots that poll DataForSEO tasks until ready)  
- db (database models)  

This structure ensures everything is organized, clear, and ready for collaboration.

---

## 20a) Getting Started (Local Development)

Here’s the quick setup guide for developers:

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd seo-portal

# 2. Install dependencies (choose one)
pnpm install   # if pnpm is installed
# or
yarn install
# or
npm install

# 3. Copy environment file and add keys
cp .env.example .env
# Fill in:
# - DATAFORSEO_AUTH
# - OPENAI_API_KEY
# - DATABASE_URL (Postgres)
# - REDIS_URL
# - OIDC_* variables + NEXTAUTH_SECRET

# 4. Start local dev servers
pnpm dev

# The frontend should be available at http://localhost:3000
```

---

## 21) Next Steps
- Confirm locales/languages/devices.  
- Validate endpoint availability on current DataForSEO plan.  
- Draft UI wireframes.  
- Define golden queries for QA.

