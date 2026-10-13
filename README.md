# SMA

Sales and operations pretotype built as a TypeScript monorepo. The goal is to validate how a single product can support day-to-day store work: selling, customers, stock, warehouse transfers, and staff access.

For the full capability write-up, see [docs/pretotype-features.md](./docs/pretotype-features.md).

## Pretotype scope

### Handle sales

End-to-end support for recording revenue and following up on money still owed.

- **Record sales** — Capture sales with customer (when known), line items, pricing, discounts, payment method, and timestamp. Confirm transactions, share receipt summaries, and reflect activity in reports and inventory where applicable.
- **Track pending payments** — See outstanding balances per customer or sale, support partial payments and payment terms, and record payments against open balances without re-entering the full sale.

### Manage customers

One place for customer identity and context used across sales and payments: profiles, search when selling, and purchase and payment history for front-line staff.

### Manage inventory

Control what can be sold at the store and how quantities change over time.

- **Restock products** — Increase on-hand quantity with who/when (and optional supplier or document reference); quantities update immediately.
- **View available stock** — Browse products with live quantities, low-stock signals, and filters by category, location, or level.

### Warehouse management

Warehouse stock stays separate from store-floor inventory, with traceable movement between them.

- **Track warehouse availability** — Source of truth for what is in the warehouse (and optional location/bin), distinct from store stock.
- **Restock store from warehouse** — Transfer quantities in one step with warehouse decrement, store increment, and an audit trail.

### Manage employees

Onboard staff and assign configured roles (e.g. cashier, inventory clerk, manager) that bundle permissions. Role changes apply on new sessions without shared accounts.

## Repository layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js customer-facing / staff UI |
| `apps/api` | NestJS API |
| `apps/storybook` | Component documentation (`@repo/ui`) |
| `packages/ui` | Shared React components (shadcn/ui) |
| `packages/eslint-config` | Shared ESLint config |
| `packages/typescript-config` | Shared TypeScript config |

## Prerequisites

- Node.js **≥ 24**
- npm **12** (workspaces)

## Getting started

Install dependencies from the repository root:

```sh
npm install
```

Run all apps in development (via Turborepo):

```sh
npm run dev
```

Run a single workspace:

```sh
npm run dev --workspace=web
npm run dev --workspace=api
npm run dev --workspace=storybook
```

Other root scripts:

```sh
npm run build          # build all packages/apps
npm run lint           # lint all packages/apps
npm run check-types    # TypeScript check across the monorepo
npm run format         # Prettier
```

## UI components

Shared UI lives in `@repo/ui`. Add shadcn components from the web app:

```sh
cd apps/web
npx shadcn@latest add button
```

Components are installed under `packages/ui/src/components/ui/`.
