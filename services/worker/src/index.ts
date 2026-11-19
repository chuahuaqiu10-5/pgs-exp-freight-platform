/**
 * Background worker.
 *
 * Jobs:
 *  - rate-sync:        refresh expiring carrier rate sheets (hourly)
 *  - tracking-poll:    poll carrier tracking for in-transit shipments (every 15 min)
 *  - exception-alerts: flag customs holds / rollovers / delays and notify ops
 *
 * Jobs are idempotent; tracking events dedupe on (carrier, eventCode, occurredAt).
 * Queue/scheduler wiring (Redis) lands in the next milestone.
 */

const JOBS = [
  { name: "rate-sync", intervalMs: 60 * 60_000 },
  { name: "tracking-poll", intervalMs: 15 * 60_000 },
  { name: "exception-alerts", intervalMs: 15 * 60_000 },
] as const;

async function runJob(name: string): Promise<void> {
  // TODO: implement against Prisma + @pgs/carrier-clients
  console.log(`[${new Date().toISOString()}] job ${name}: tick`);
}

for (const job of JOBS) {
  void runJob(job.name);
  setInterval(() => void runJob(job.name), job.intervalMs);
}

console.log("worker started:", JOBS.map((j) => j.name).join(", "));
