# The Cost of Growth

An interactive strategic finance web application modeling customer-level unit economics and comparing subscription, usage-based, and hybrid pricing structures for a fictional AI software company (Strata AI).

## Run & Operate

- `pnpm --filter @workspace/cost-of-growth run dev` — run the web app (via managed workflow `artifacts/cost-of-growth: web`)
- `pnpm --filter @workspace/cost-of-growth run typecheck` — typecheck the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Recharts, Lucide icons
- All financial data and deterministic calculations live locally in `artifacts/cost-of-growth/src/lib/financeModel.ts` (no database, authentication, or external APIs).

## Where things live

- `artifacts/cost-of-growth/src/lib/financeModel.ts` — single source of truth for the immutable 12-customer dataset, `ORIGINAL_BUSINESS` baseline, pricing calculators, input sanitizers, formatters, and deterministic `generateFinanceTakeaway` generator.
- `artifacts/cost-of-growth/src/pages/` & `artifacts/cost-of-growth/src/components/` — single-page editorial finance experience (baseline summary, sortable customer economics table, customer margin waterfall, pricing experiment controls & comparison, bill impact analysis, finance takeaway, collapsible methodology).

## Architecture decisions

- Client-only deterministic financial modeling: all calculations execute at full floating-point precision in `financeModel.ts` and round only at display time.
- Immutable original baseline: `ORIGINAL_CUSTOMERS` and `ORIGINAL_BUSINESS` are frozen constants so scenario edits never mutate baseline metrics or customer bill comparison references.
- Pricing-structure-independent cost calculation: monthly requests, inference costs, and fixed infrastructure costs are calculated identically across all three pricing structures.

## Product

- Fixed **Original business** baseline showing monthly revenue ($70,800), gross profit ($18,532), gross margin (26.2%), unprofitable account count (3 of 12), and the largest-loss finding (Northstar Logistics at −$6,250/mo).
- **Customer Economics** sortable table with reconciled totals and click-to-inspect **Customer Margin Waterfall** supporting negative gross profit.
- **Pricing Experiment** with global usage and inference-cost multipliers, editable tier/usage/hybrid assumptions, and live side-by-side 3-scenario comparison.
- **Who Pays More?** bill impact comparison against each customer's immutable original subscription fee.
- **Finance Takeaway** deterministic narrative highlighting profit leaders (with tie handling), bill increases, unprofitable accounts, and unmodeled behavioral boundaries, plus a collapsible **Assumptions & Methodology** panel and one-click Reset.
