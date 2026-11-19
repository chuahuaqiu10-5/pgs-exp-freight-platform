# Architecture notes

## Data flow

1. Operations staff import carrier rate sheets (or the worker syncs them via API).
2. A quote request hits `apps/api`, which loads candidate rates and runs them
   through `@pgs/pricing-engine` to compute chargeable weight and surcharges.
3. Bookings become shipments; `services/worker` polls carrier tracking endpoints
   through `@pgs/carrier-clients` and writes normalized tracking events.
4. The portal reads shipments and tracking events for customer-facing status.

## Pricing engine rules (summary)

- Air: volumetric weight = L x W x H (cm) / 6000; chargeable = max(actual, volumetric).
- Rail: divisor 5000. Ocean LCL: per revenue ton (max of CBM and tonnes).
- Surcharges: BAF (bunker adjustment), CAF (currency adjustment), PSS (peak season),
  plus per-mode fuel index adjustments. Rules are versioned by validity period.

## Reliability

- Carrier clients: exponential backoff with jitter, per-carrier rate limiting,
  and a circuit breaker after repeated 5xx responses.
- Worker jobs are idempotent; tracking events are deduplicated on
  (carrier, eventCode, occurredAt).
