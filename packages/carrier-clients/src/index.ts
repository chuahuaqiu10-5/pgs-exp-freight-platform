/**
 * Carrier tracking API clients.
 *
 * Every carrier exposes tracking differently; clients normalize responses
 * into NormalizedTrackingEvent. All requests go through a shared transport
 * with exponential backoff + jitter and a per-carrier rate limiter.
 */

export interface NormalizedTrackingEvent {
  carrier: string;
  trackingNo: string;
  eventCode: string;
  location?: string;
  occurredAt: Date;
}

interface CarrierClientConfig {
  apiKey: string;
  baseUrl: string;
  maxRequestsPerMinute: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export abstract class CarrierClient {
  private lastRequestAt = 0;

  constructor(
    public readonly carrierCode: string,
    protected readonly config: CarrierClientConfig,
  ) {}

  protected async request<T>(path: string): Promise<T> {
    // Simple token spacing to respect the per-carrier rate limit.
    const minInterval = 60_000 / this.config.maxRequestsPerMinute;
    const wait = this.lastRequestAt + minInterval - Date.now();
    if (wait > 0) await sleep(wait);

    let attempt = 0;
    for (;;) {
      this.lastRequestAt = Date.now();
      const res = await fetch(`${this.config.baseUrl}${path}`, {
        headers: { Authorization: `Bearer ${this.config.apiKey}` },
      });
      if (res.ok) return (await res.json()) as T;
      if (res.status < 500 && res.status !== 429) {
        throw new Error(`${this.carrierCode} request failed: ${res.status}`);
      }
      attempt += 1;
      if (attempt > 4) throw new Error(`${this.carrierCode} unavailable after retries`);
      const backoff = Math.min(30_000, 1000 * 2 ** attempt) * (0.5 + Math.random());
      await sleep(backoff);
    }
  }

  abstract fetchTracking(trackingNo: string): Promise<NormalizedTrackingEvent[]>;
}

export class OceanCarrierClient extends CarrierClient {
  async fetchTracking(trackingNo: string): Promise<NormalizedTrackingEvent[]> {
    const raw = await this.request<{ events: Array<{ code: string; place?: string; time: string }> }>(
      `/tracking/containers/${encodeURIComponent(trackingNo)}`,
    );
    return raw.events.map((e) => ({
      carrier: this.carrierCode,
      trackingNo,
      eventCode: e.code,
      location: e.place,
      occurredAt: new Date(e.time),
    }));
  }
}

// TODO: AirCarrierClient (airline cargo tracking), RailCarrierClient (rail waybills)
