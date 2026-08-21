# Tests

Engine tests. They cover the pure libraries in `src/lib/` — the ones that do
arithmetic on someone's money — and deliberately not the Svelte components,
which are checked in a browser.

**These lived in a temporary scratchpad until 21 August 2026.** Fifty-four
tests, enforcing the honesty rules that the forecast and entitlement engines
are built on, sitting in a directory that gets wiped between sessions. The
rules are only rules while something checks them.

## Running them

    npm test

Each suite bundles the real `src/lib` source with esbuild and runs it under
Node with a `localStorage` shim, so the code under test is the code that
ships — no mocks of the modules themselves.

## What they protect

- `forecast` — no invented dates, her amounts on the government's dates, the
  record correcting the plan, and no balance claim without a starting balance
- `entitlements` — nothing quantified without the household fact under it,
  unknowables never estimated and never in the total, per-year age banding
- `debt` — a one-time lump is not a recurring payment
- `csv` — formula injection in user-typed labels, quoting, the BOM
