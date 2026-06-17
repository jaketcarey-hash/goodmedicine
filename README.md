# Strong Fire

Free, private, offline-first financial wellness PWA for First Nations communities. No sign-up, no tracking, no ads — all data stays on the device in `localStorage`.

Live at **strongfire.ca**. (The repository is still named `goodmedicine` after the original working title.)

## Stack

- **Astro 6** — static site generator, zero JS by default
- **Svelte 5** — interactive islands (check-in flow, tools, nav)
- **Tailwind CSS 4** — custom earth-tone palette (stone, sage, water, clay, berry)
- **PWA** — custom service worker with an auto-generated precache list, offline-first
- **Vercel** — free-tier static hosting

## Four content branches

1. **Knowing Your Money** (`/money`) — banking, budgeting, saving, credit, debt, investing, taxes, seven generations
2. **Knowing Your Rights** (`/rights`) — Section 87, NIHB, treaty payments, education funding, band finances, Jordan's Principle
3. **Knowing Your Path** (`/path`) — leaving home, first job, building a life, raising family, supporting elders, giving back, career growth
4. **Knowing Yourself** (`/self`) — wellness check-in, benefits finder, financial stress, confidence, money conversations

Plus **Moments** (`/moments`) — entry points for when life shifts.

## Commands

```sh
npm install        # install dependencies
npm run dev        # dev server on http://localhost:4321
npm run build      # build to dist/ and generate the service-worker precache
npm run preview    # preview the built site
```

## Conventions

- See `CLAUDE.md` for architecture, voice rules, and the content-freshness workflow.
- Tax/benefit figures carry a `lastUpdated` stamp per page; the disclaimer holds the overall review date. Update both together.
- Canadian spelling. No emojis. No client data — this is an independent educational project, unaffiliated with any bank, firm, or government agency.
