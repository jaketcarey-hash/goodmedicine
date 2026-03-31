# Good Medicine

Free financial wellness PWA for First Nations communities. 46 pages, fully offline, zero data collection.

## Stack
- **Astro 6** — static site generator, zero JS by default
- **Svelte 5** — interactive islands (check-in flow, expandable sections, nav, tools)
- **Tailwind CSS 4** — utility-first styling with custom earth-tone palette
- **PWA** — custom service worker with auto-generated precache list, offline-first
- **Vercel** — free tier static hosting

## Architecture
- `src/layouts/Shell.astro` — main app shell with bottom nav, PWA registration, global error handling
- `src/layouts/Article.astro` — content page layout with warm typography, optional `lastUpdated` prop
- `src/components/` — Svelte islands (BottomNav, CheckInFlow, WellnessHub, Section87Checker, BenefitsFinder, DistributionPlanner, etc.)
- `src/pages/` — four branches: money, rights, path, self; plus tools, learn, glossary, calendar, ask-ai, resources, disclaimer, 404
- `src/lib/storage-keys.ts` — central registry of all localStorage keys
- `src/lib/*-store.ts` — localStorage-based data stores (wellness, learning, savings, budget, calendar, debt, net worth)
- `public/sw.js` — service worker template; `scripts/generate-sw.js` patches precache list at build time
- `scripts/generate-sw.js` — post-build script that scans dist/ and generates the precache URL list

## Content Branches
1. **Knowing Your Money** (`/money`) — banking, budgeting, saving, credit, debt, investing, taxes, seven generations
2. **Knowing Your Rights** (`/rights`) — Section 87, NIHB, treaty payments, education funding, band finances, Jordan's Principle
3. **Knowing Your Path** (`/path`) — leaving home, first job, building life, raising family, supporting elders, giving back, career growth
4. **Knowing Yourself** (`/self`) — wellness check-in, benefits finder, financial stress, confidence, money conversations

## Interactive Tools
- Section 87 Checker (`/rights/section-87-checker`)
- Benefits Finder (`/self/benefits`)
- Budget Tool (`/money/budget-tool`)
- Savings Tracker (`/money/savings-tracker`)
- Debt Planner (`/money/debt-planner`)
- Net Worth Tracker (`/money/net-worth`)
- Tax Estimator (`/tools/tax-estimator`)
- Life Simulator (`/tools/life-simulator`)
- Settlement Simulator (`/tools/settlement-simulator`)
- Distribution Planner (`/tools/distribution-planner`)
- Financial Calendar (`/calendar`)
- Glossary (`/glossary`)
- AI Help (`/ask-ai`)

## Design Principles
- Earth-tone palette: stone, sage, water, clay, berry
- Fonts: Outfit (display), Inter (body)
- Mobile-first, works on low-end Android phones
- Offline-first — the app works without connectivity
- No data collection, no sign-up, no tracking, no ads
- OCAP-aligned (Ownership, Control, Access, Possession)
- All user data stays in localStorage on the device

## Voice Rules
- Respectful of intelligence — plain language, not dumbed down
- Never patronizing or preachy
- Frame financial capability as self-determination
- Acknowledge systemic context without dwelling in it
- Sovereignty language: "what you're entitled to" not "what the government gives you"
- No emojis
- Canadian spelling (behaviour, honour, colour)

## Infrastructure
- `src/lib/storage-keys.ts` — single source of truth for all localStorage key names
- `scripts/generate-sw.js` — auto-generates precache URLs from dist/ after build
- `src/pages/disclaimer.astro` — legal disclaimer (not advice, privacy, review date)
- `src/pages/404.astro` — friendly 404 with links to home and glossary
- All article pages include `lastUpdated` prop for content freshness signalling
- Global error handlers in Shell.astro prevent silent failures

## Commands
- `npm run dev` — start dev server on port 4321
- `npm run build` — build static output to dist/ and generate service worker precache
- `npx astro preview` — preview built site

## Community Feedback Cycle
Content is being tested with community members and refined based on their input. The current review date for all content is March 2026. When updating content, update the `lastUpdated` prop on the affected article pages and the review date in the disclaimer.
