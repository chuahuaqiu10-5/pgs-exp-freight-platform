# PGS EXP Freight Platform

A production freight-forwarding platform for cross-border logistics: rate management,
multi-modal freight quoting, shipment tracking, and a customer portal.

## Overview

PGS EXP moves cargo between Asia and the world by ocean, air, rail, and trucking,
including Amazon FBA and overseas warehousing. This platform replaces spreadsheet-based
rate sheets and manual tracking with a single system used by operations staff and
customers.

## Architecture

Monorepo (npm workspaces + TypeScript):

| Path | Description |
| --- | --- |
| `apps/api` | REST API: rates, quotes, shipments, tracking, customers |
| `apps/portal` | Customer portal (shipment lookup, quote requests, documents) |
| `packages/pricing-engine` | Multi-modal pricing rule engine (chargeable weight, surcharges, fuel adjustments) |
| `packages/carrier-clients` | Carrier API clients (ocean / air / rail) with retry, backoff, and rate limiting |
| `services/worker` | Background jobs: rate-sheet sync, tracking status polling, exception alerts |
| `prisma` | PostgreSQL data model (Prisma schema) |

Infrastructure: PostgreSQL, Redis (queues + cache), Docker, GitHub Actions CI.

## Key engineering problems

- **Pricing rules**: chargeable weight differs per mode (air volumetric divisor 6000,
  rail 5000, LCL per RT), plus BAF/CAF/PSS surcharges and seasonal fuel adjustments.
- **Carrier integrations**: each carrier exposes a different tracking API shape;
  clients normalize events into one tracking model, with retry and rate-limit handling.
- **Background processing**: rate sheets expire and change frequently; the worker polls
  carrier status endpoints and flags exceptions (delays, rollovers, customs holds).

## Getting started

```bash
cp .env.example .env
docker compose up -d        # PostgreSQL + Redis
npm install
npm run build
npm test
```

## Roadmap

- [x] Monorepo scaffold, CI, Docker setup
- [x] Pricing engine core (chargeable weight + surcharge rules) with unit tests
- [ ] Carrier tracking clients: Maersk, MSC, CMA CGM (ocean); major airlines (air)
- [ ] Rate management API + admin import of carrier rate sheets
- [ ] Worker: tracking polling + exception alerts
- [ ] Customer portal: quote requests and live shipment tracking
- [ ] Amazon FBA shipment workflows

## License

Private — internal project.
