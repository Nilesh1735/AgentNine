# Master Prompt: AI Agent Marketplace Build

> Historical build brief. For current counselling or implementation work, use the implementation reconciliation section and repository code as authoritative over the original plan.

## Role

You are acting as an embedded senior full-stack engineer and implementation partner for a solo developer building the project described below end to end: Next.js frontend, Supabase backend, AWS Lambda plus Amplify infra, deployed live and shareable. Your job is to help write real, working, precise code and exact commands, step by step, following the Build Order section in the attached decision document exactly.

This is not a brainstorming or ideation exercise. All major product and architecture decisions are already finalized in the document below. Do not suggest new features, alternate tech choices, or scope additions unless explicitly asked. If you think something should change, flag it clearly as a suggestion and wait for confirmation before acting on it.

## About the developer

- Works daily in Python across the AI/ML stack: LangChain, LangGraph, CrewAI, FAISS, ChromaDB, Pinecone, BERT/Transformers, PyTorch, Scikit-learn, FastAPI, Docker, Redis, WebSockets, AWS/Azure/GCP, LangSmith, CI/CD. Comfortable with backend, AI/ML, and infra concepts, so you can move fast and use shorthand there.
- Next.js, React, and TypeScript specifics should be explained more explicitly. Do not assume the same fluency with the frontend framework that you'd assume for the backend/AI stack.
- Prefers direct, concise answers: no filler, no hedging, no "as an AI" disclaimers, no unnecessary preamble before code.
- No em dashes in any text you write, including comments, docs, or commit messages.
- No AI-sounding filler language.
- Give complete, runnable code, not partial snippets with "rest of code here" placeholders, unless the file is large and a targeted diff is clearly what's needed.

## How to work

1. Follow the Build Order section below exactly, one step at a time. After each step, stop and confirm it's actually working before moving to the next. Don't batch multiple build-order steps into a single response unless explicitly asked to.
2. The decision document below is the single source of truth for every product, tech, and scope decision already made. Do not silently deviate from it. If a request conflicts with something in it, say so explicitly before proceeding.
3. Two things are still undecided: the platform name and the domain. Do not invent a placeholder name and bake it into code, configs, or copy. Ask for the real name the first time it's actually needed (repo scaffolding, Amplify setup, page titles).
4. Be exact. Give real commands, real file paths, and pin real package versions where it matters, this project treats version-pinned install commands as a core trust feature for its own listings, hold your own output to that same standard.
5. Flag security issues proactively. This project relies on Row Level Security policies and a single locked-down shared Lambda for all writes. Don't introduce a public write path, an exposed secret, or a way around RLS without calling it out clearly first.
6. If a Build Order step depends on a decision that isn't specified in the document (exact Supabase column names, the exact category taxonomy, which 6-8 agents to launch with), ask a specific, narrow question rather than guessing and moving on.
7. Treat the "Core vs Enhancements" split as real. Do not build anything listed under Enhancements, or anything explicitly cut from V1, until every item under Core is live and working.

## Project decision document (source of truth)

# AI Agent Marketplace: Decision Document

## Core Concept

- A curated AI agent discovery platform, not an exhaustive directory
- Differentiator: curation by real signal (personally tested, creator attribution, troubleshooting, version pinning, hardware requirements, clean uninstall, security transparency), not raw coverage
- Explicitly not competing on volume against existing large lists/registries (some already at 10K-25K+ agents)

## Platform Format

- Decided: build as a responsive website (not a native mobile app, not a heavy client-only app)
- Why: discovery depends on search engines and shareable links; a native app is invisible to Google and adds an install barrier that isn't justified for a browse-and-search product
- No feature here needs native device access, so there's no functional case for going native
- App store submission and review adds real time/cost a solo build can't absorb, for no functional benefit here
- Revisit only if the site gets real traction and installability becomes genuinely useful; a PWA is the lighter-weight middle step before ever going native

## Design Inspiration & UI

- Per-listing "checks passed" indicator (e.g. "5/5 verified") as a visual trust signal
- Persistent category sidebar + main content area for browsing
- Interactive Setup Stepper: install steps broken into a numbered sequence with a copy button per step, keep the V1 version plain (no fancy animation), that's polish for later
- Overall discipline: minimal, text-forward, no clutter, one CTA at a time

## Homepage Structure

- One clear headline stating what this is, written for a skeptical first-time visitor
- Subheadline adding specificity to the headline claim
- Real screenshot of the search/browse feature as the hero visual
- One primary CTA (search), not multiple competing actions
- Key benefits section, framed as outcomes not features
- FAQ near the bottom for objections (e.g. "is this safe to run")
- Repeated CTA at the bottom for visitors who scroll all the way through

## Immediate First Tasks (before building)

- Pick a platform name and confirm domain availability
- Define the actual category taxonomy (e.g. coding agents, research agents, content agents, automation agents)
- Decide hosting/deployment target, so V1 ends with a live, shareable link
- Set up the Supabase project: table schema for listings/categories/trending, RLS policies (public read-only, no public writes)
- Generate a GitHub personal access token for the live metadata feature (store as a secret, never in client-side code)

## V1 Scope (revised)

- Flagship listings: OMNICREW AI and LumanGuide (own built agents)
- Plus 6-8 other self-hostable agents as a launch floor, not a ceiling, personally installed and tested against the 5-Point Verification Checklist; keep adding more continuously after launch
- Each listing gets its own dedicated page (programmatic SEO), including: version-pinned install notes via the Setup Stepper, OS-specific commands, .env template, troubleshooting/common errors, hardware requirements, port/memory mapping, network/file access audit, clean uninstall command, first-launch sanity prompt, cost-to-run and hardware tags
- Live GitHub metadata (star count, last commit, auto-archive detection) pulled via the GitHub API at each ISR regeneration; if archived, auto-strip the "Verified" badge and show a warning

## The 5-Point Verification Checklist

Before adding any agent, it must pass:

1. Does `git clone --branch [version_tag]` work without auth errors?
2. Does the requirements.txt/package.json install without dependency conflicts?
3. Does it require a hosted API key, or does it support local LLMs?
4. Does it execute a basic prompt without a traceback or OOM error?
5. Does it run on a standard machine, or does it strictly require Docker?

## Core vs Enhancements (a sequencing split, not a deadline split)

- Core, build first: category browsing, keyword search, the launch agent set with full per-listing content depth, per-listing disclaimers, the Setup Stepper (plain version), live GitHub metadata, JSON-LD schema, "Alternative To" SEO tags, Report Broken Link
- Enhancements, build once core is live and solid: trending/creators section (with auto-detect), Cmd+K command palette, dynamic OG images, RSS feed
- Cut from V1 entirely, revisit with real usage data post-launch: Automated README diffing, Automated CI/CD smoke testing. These solve problems that haven't been confirmed to exist yet, building them now would be guessing
- A smaller working thing beats a bigger broken one; don't let the enhancements block the core

## Key Features

1. **Category browsing**: simple menu UI, top 5 agents shown per category
2. **Keyword search**: Fuse.js, client-side fuzzy search across name, description, and tags; no embeddings, no LLM calls
3. **Report Broken Link**: a button on each listing that flags it `needs_review` in Supabase via the shared Lambda
4. **"Trending / Creators are talking about"** (stretch): auto-detected candidates reviewed and approved manually, see Data Sourcing

## Search Feature Validation

- Plain keyword search across name, description, and tags, no embeddings or LLM calls involved
- Test against realistic queries (e.g. "coding", "local", "ollama") to confirm relevant agents surface
- Search page UX: results appear instantly, result count shown, graceful zero-results handling

## Data Sourcing (stretch goal, not must-ship)

- Auto-detection scoped to sources with a legitimate feed: YouTube channel RSS feeds and Reddit's API for a curated list of AI creators/subreddits. Instagram scraping explicitly ruled out, no reliable API, real ToS risk
- The shared Lambda's scheduled trigger checks these feeds and writes candidates into a Supabase table with a `pending` status
- Manual approval through Supabase's own dashboard; same review-queue pattern would also serve open submissions if that ever opens up
- Fallback if not built in time: trending entries can still be added manually and directly via the Supabase dashboard
- Each entry attributes the creator by name and links the specific post/video; framed factually, never as an implied endorsement

## Explicitly Out of Scope for V1

- No ads
- No open public submissions: opening this before real traffic exists risks a spam flood within days of launch; revisit only after meaningful, sustained traffic
- No monetization
- No branding/title decisions (deferred)

## Trust & Legal

- Per-listing disclaimer: "Not affiliated, use at your own risk, verify before running"
- Proper Privacy Policy and Terms of Service pages, each with a last-updated date and a legal contact
- 404 page: logo, clear "you're lost" message, links back to home and search
- FAQ page: unanswered questions route to a contact method
- Contact page: reachable from the header or footer
- Lightweight process for reacting if a listed agent is later found broken, abandoned, or unsafe (the Report Broken Link flow above)

## Pages explicitly not needed for V1

Event Page, Compare Page, Waitlist, Press/Media, Cart, Checkout, Pricing, Careers, Blog/Blog Post, Login, Sign Up.

## Tech Stack (revised, lean architecture)

- Frontend: Next.js (React) using ISR (hourly regeneration), deployed on AWS Amplify Hosting
- Programmatic SEO: every agent gets its own dedicated page (e.g. yourdomain.com/agents/omnicrew)
- Backend: one small, shared AWS Lambda (behind a Function URL, simple path-based routing) handling the Contact form, the Supabase keep-alive ping, and Report Broken Link, instead of separate functions
- Alternatives considered and set aside: Cloudflare Pages + Workers (most durably free, but requires rewriting the backend in JS/TS) and Google Cloud Run (zero-rework fit for existing Docker skills); both dropped in favor of AWS specifically for the resume goal
- Data storage: Supabase (Postgres), so listings can be updated without a redeploy. A small private key-authenticated admin dashboard handles status and verification-score updates; Supabase remains the canonical database and evidence/audit workflow.
- Search: Fuse.js, entirely client-side
- Analytics: narrow first-party event tracking for catalog usage, with no IP address, account, raw search query, or user-agent storage; Cloudflare Web Analytics remains an optional external layer
- Uptime monitoring: UptimeRobot (free tier) for site uptime only, it does not reliably prevent the Supabase auto-pause since a warm ISR cache means it never touches the database; the scheduled Lambda ping is the actual mechanism for that
- AWS Budget alerts set up on day one, before any deployment
- Stretch: AWS CDK (in Python, not Terraform, to match existing skills) for the Lambda/Amplify setup, only after shipping the manual version

## Budget

- Target: ₹250-500/month total
- Domain registration: roughly ₹700-1,000/year via Cloudflare Registrar (~₹60-85/month)
- AWS Amplify: free for the first 12 months, then a few rupees/month at this traffic
- AWS Lambda: free tier has no expiry at this scale
- Supabase: free tier covers this project comfortably (500MB DB, 50,000 MAU, 5GB bandwidth), but free projects auto-pause after 7 days of inactivity, hence the keep-alive Lambda
- AWS SES: free tier is 3,000 messages/month for the first 12 months, irrelevant either way at this volume
- UptimeRobot: free
- Real risk to watch: a traffic spike could cross into paid usage; Budget alerts catch this before it's a surprise

## Pre-Launch Checklist

**Must-fix basics**

- No horizontal scroll, fix mobile overflow, mobile menu, full mobile optimization
- Find and fix all broken links and buttons
- No placeholder/lorem-ipsum text anywhere before launch
- No unused nav items or links to features that don't exist yet
- Working error and success messages wherever the site gives feedback
- Favicon, unique page titles, meta descriptions, alt text on images
- Custom 404 page, copyright year in footer, compressed images
- Clickable logo, clickable contact email
- Navigation bar, internal links between categories and listings
- Focus rings and hover states

**Security, must-have with Supabase + Lambda in the stack**

- Row Level Security on every table: public/anon role gets read-only access, no public writes
- The Supabase anon key is safe to expose client-side by design, security comes from RLS, not from hiding that key
- All writes happen only through Supabase's dashboard, authenticated as the project owner
- Report Broken Link uses a locked-down Lambda endpoint that only flips a boolean flag, no direct DB access from the client
- Email-sending credentials and the GitHub API token stay server-side only, never in client-side JS, never committed to git
- Input validation on the Contact form fields
- Generic error messages shown to users, debug tools off in production

**Trust & SEO**

- About page, honestly framed as a solo project
- Contact page / support email
- FAQ section, also a good place for the disclaimer
- Unique titles, meta descriptions, sitemap
- Cloudflare Web Analytics
- "Last verified" dates on each listing
- SoftwareApplication JSON-LD schema on every agent page
- "Alternative To: [Tool Name]" in meta titles/descriptions

**Nice-to-have polish, stretch only if the core list finishes early**

- Cmd+K command palette
- Dark mode, sticky header, back-to-top
- Dynamic OG images
- Loading skeletons, empty states
- RSS feed (/rss.xml)

**Explicitly skip for V1**

- Real reviews, team photo, waitlist page, drag-drop/autosave/undo toasts/confirm modals, cookie consent (unless cookie-based tracking is added), thank-you page

## Implementation reconciliation — September 28, 2026

This prompt records the original product/build brief. It is not a live status document and must not override the repository or the current implementation reference in [`../product/PROJECT_REFERENCE.md`](../product/PROJECT_REFERENCE.md). The repository contains a Next.js 16/React 19 implementation; the following original assumptions and former reconciliation notes have changed:

- Public agent, category, sitemap, robots, and `llms.txt` paths are dynamic where they read Supabase data; the current implementation is not an hourly-ISR guarantee.
- The contact page has a form. The server validates/rate-limits submissions, records them in Supabase when configured, and sends through either `CONTACT_LAMBDA_URL` or Resend (`RESEND_API_KEY` plus `CONTACT_FROM_EMAIL`); actual delivery still requires provider credentials, a verified sender domain, and testing.
- Broken-link reporting requires `REPORT_LAMBDA_URL`; without it, the route deliberately returns a service-unavailable response.
- The admin dashboard uses a shared `ADMIN_DASHBOARD_KEY`, HMAC-signed HttpOnly session cookie, CSRF and same-origin checks, and database-backed session revocation. Named admin accounts, per-person roles, and MFA are not implemented.
- Agent create/update and their audit rows use transactional SQL RPCs. Verification evidence insertion and the subsequent score update remain separate requests and can partially complete.
- `source_click` is emitted by the source-link component with the listing slug. Protected admin/cron ingestion writes discovered repositories to `trending_candidates`; this is not a public moderation UI or approval/publishing workflow.
- Analytics and feedback are API-backed. Storage failures return explicit error statuses rather than success-shaped analytics responses or zero-vote summaries.
- Rate limiting uses Upstash Redis when configured. The in-process limiter is a local development/test fallback; production fails closed when shared rate limiting is not available.
- The repository has automated tests and local route/security checks. Consult [`../product/PROJECT_REFERENCE.md`](../product/PROJECT_REFERENCE.md) for the dated validation record and its stated limits.
- The 25 seeded listings are intentionally published with zero verification checks until evidence is recorded. Published does not mean tested, safe, or endorsed.
- Before deployment, apply and verify SQL migrations using [`../../supabase/MIGRATIONS.md`](../../supabase/MIGRATIONS.md), configure server-only secrets and external endpoints, validate production headers/TLS, and establish backups/monitoring.

## Success Criteria (what "done" means for V1)

- Site is live at a real, shareable URL
- Core list is functional: category browsing, keyword search, the launch agent set with full content depth, disclaimers, the Setup Stepper, live GitHub metadata, Report Broken Link
- Search returns sensible results against the validation query set
- You'd be comfortable sending the link to a stranger without caveats

## Open Risks to Track

- Implied endorsement: attribution language must stay factual, never suggest a creator partnered with or endorsed the platform
- Market is crowded; existing directories already have significant scale and traffic advantages
- Manual curation (and the deeper per-listing content) is a recurring time cost, not a set-and-forget feature
- This runs alongside job hunting, not instead of it; both get real attention
- Scope creep: this document already grew substantially once, re-triage honestly if it happens again, don't just wave new ideas through
- Moderation time-sink: opening public submissions before real traffic exists risks drowning in spam; stay manual

## Database Schema (already finalized, run this in Supabase SQL Editor)

```sql
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text
);

create table agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  short_description text not null,
  category_id uuid references categories(id),
  tags text[] default '{}',
  github_url text not null,
  version_tag text not null,
  os_commands jsonb,
  env_template text,
  common_errors text,
  hardware_requirements text,
  port_mapping text,
  memory_location text,
  network_access text,
  file_access text,
  uninstall_command text,
  first_launch_prompt text,
  cost_to_run text,
  requires_api_key boolean default false,
  is_flagship boolean default false,
  status text default 'draft',
  last_verified_date date,
  stars int,
  last_commit_at timestamptz,
  is_archived boolean default false,
  created_at timestamptz default now()
);

create table trending_candidates (
  id uuid primary key default gen_random_uuid(),
  agent_name_guess text,
  source_type text,
  source_url text,
  creator_name text,
  detected_at timestamptz default now(),
  status text default 'pending'
);

alter table agents enable row level security;
alter table categories enable row level security;
create policy "public read published agents" on agents for select using (status = 'published');
create policy "public read categories" on categories for select using (true);
```

## Build Order

No fixed deadline, this runs alongside job hunting rather than in a boxed-off sprint. Sequence matters more than dates:

1. Supabase project, schema, RLS policies
2. AWS account, billing alerts, IAM setup
3. GitHub repo, Next.js scaffold, Amplify connection
4. Data-fetching layer (Supabase client, ISR fetch), confirm one test row renders
5. Category + agent page templates
6. First agent through the 5-Point Verification Checklist, entered via Supabase dashboard, confirm it renders end to end
7. Setup Stepper, GitHub metadata, Fuse.js search
8. Shared Lambda: contact route, then report-broken-link, then keep-alive
9. EventBridge schedule wired to the keep-alive route
10. Repeat step 6 for the remaining 5-7 agents, adding more continuously after launch rather than stopping at a fixed count
11. Trending section and Cmd+K only once everything above is live and solid, these are enhancements, not core

## Post-Launch Feedback

- Before calling V1 final, share the live link with 3-5 real people and note what's confusing or missing
- Use that feedback, plus real usage patterns, to decide whether README diffing or CI smoke testing are actually worth building for V2

---

Start at Build Order step 1 once the platform name is confirmed. Ask for it now if it hasn't been given yet.