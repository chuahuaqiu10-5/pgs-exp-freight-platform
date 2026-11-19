/**
 * Multi-modal freight pricing engine.
 *
 * Computes chargeable weight and applies surcharge rules (BAF, CAF, PSS,
 * fuel index) on top of a carrier base rate. Rules are kept deliberately
 * explicit: freight pricing mistakes are expensive, so no magic.
 */

export type TransportMode = "OCEAN" | "AIR" | "RAIL" | "TRUCKING";

export interface DimensionsCm {
  length: number;
  width: number;
  height: number;
  pieces: number;
}

export interface SurchargeRule {
  code: "BAF" | "CAF" | "PSS" | "FUEL";
  /** Percentage of base freight, e.g. 0.12 = 12%. */
  percentOfBase?: number;
  /** Flat amount in the quote currency. */
  flatAmount?: number;
}

export interface QuoteInput {
  mode: TransportMode;
  grossWeightKg: number;
  dims?: DimensionsCm;
  volumeCbm?: number;
  baseRatePerUnit: number; // per kg (air/rail) or per RT (ocean LCL)
  surcharges: SurchargeRule[];
}

export interface QuoteResult {
  chargeableWeightKg: number;
  billableUnits: number; // kg for air/rail, revenue tons for ocean LCL
  baseFreight: number;
  surchargeTotal: number;
  total: number;
}

const VOLUMETRIC_DIVISOR: Record<string, number> = {
  AIR: 6000,
  RAIL: 5000,
};

export function volumetricWeightKg(mode: TransportMode, dims: DimensionsCm): number {
  const divisor = VOLUMETRIC_DIVISOR[mode];
  if (!divisor) return 0;
  const perPiece = (dims.length * dims.width * dims.height) / divisor;
  return perPiece * dims.pieces;
}

export function chargeableWeightKg(input: QuoteInput): number {
  if (input.mode === "OCEAN") {
    // LCL bills per revenue ton: greater of weight (t) and volume (CBM), in kg terms.
    const volumeKgEquivalent = (input.volumeCbm ?? 0) * 1000;
    return Math.max(input.grossWeightKg, volumeKgEquivalent);
  }
  const volumetric = input.dims ? volumetricWeightKg(input.mode, input.dims) : 0;
  return Math.max(input.grossWeightKg, volumetric);
}

export function quote(input: QuoteInput): QuoteResult {
  const chargeable = chargeableWeightKg(input);
  const billableUnits =
    input.mode === "OCEAN" ? chargeable / 1000 : Math.ceil(chargeable * 2) / 2; // air/rail round up to 0.5 kg
  const baseFreight = billableUnits * input.baseRatePerUnit;
  const surchargeTotal = input.surcharges.reduce((sum, rule) => {
    return sum + (rule.percentOfBase ? baseFreight * rule.percentOfBase : 0) + (rule.flatAmount ?? 0);
  }, 0);
  return {
    chargeableWeightKg: chargeable,
    billableUnits,
    baseFreight,
    surchargeTotal,
    total: baseFreight + surchargeTotal,
  };
}
