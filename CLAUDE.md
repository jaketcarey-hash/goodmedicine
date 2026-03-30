# Good Medicine

Free financial wellness PWA for First Nations communities.

## Stack
- **Astro 6** — static site generator, zero JS by default
- **Svelte 5** — interactive islands (check-in flow, expandable sections, nav)
- **Tailwind CSS 4** — utility-first styling with custom earth-tone palette
- **PWA** — custom service worker with aggressive precaching, offline-first
- **Vercel** — free tier static hosting

## Architecture
- `src/layouts/Shell.astro` — main app shell with bottom nav, PWA registration
- `src/layouts/Article.astro` — content page layout with warm typography
- `src/components/` — Svelte islands (BottomNav, CheckInFlow, WellnessHub, etc.)
- `src/pages/` — four branches: money, rights, path, self
- `src/lib/wellness-store.ts` — localStorage-based check-in data (fully on-device)
- `public/sw.js` — service worker with stale-while-revalidate strategy

## Content Branches
1. **Knowing Your Money** (`/money`) — banking, budgeting, saving, credit, debt, investing, taxes
2. **Knowing Your Rights** (`/rights`) — Section 87, NIHB, treaty payments, education funding, band finances, Jordan's Principle
3. **Knowing Your Path** (`/path`) — leaving home, first job, building life, raising family, supporting elders, giving back
4. **Knowing Yourself** (`/self`) — wellness check-in, financial stress, confidence, money conversations

## Design Principles
- Earth-tone palette: stone, sage, water, clay, berry
- Fonts: Outfit (display), Inter (body)
- Mobile-first, works on low-end Android phones
- Offline-first — the app works without connectivity
- No data collection, no sign-up, no tracking, no ads
- OCAP-aligned (Ownership, Control, Access, Possession)

## Voice Rules
- Respectful of intelligence — plain language, not dumbed down
- Never patronizing or preachy
- Frame financial capability as self-determination
- Acknowledge systemic context without dwelling in it
- Sovereignty language: "what you're entitled to" not "what the government gives you"
- No emojis

## Commands
- `npm run dev` — start dev server on port 4321
- `npx astro build` — build static output to dist/
- `npx astro preview` — preview built site
