import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { chargeableWeightKg, quote } from "../src/index";

describe("chargeableWeightKg", () => {
  it("air: uses volumetric weight when it exceeds gross weight", () => {
    const w = chargeableWeightKg({
      mode: "AIR",
      grossWeightKg: 10,
      dims: { length: 100, width: 100, height: 60, pieces: 1 },
      baseRatePerUnit: 5,
      surcharges: [],
    });
    assert.equal(w, 100); // 100*100*60/6000 = 100 kg
  });

  it("ocean LCL: bills per revenue ton (volume wins)", () => {
    const w = chargeableWeightKg({
      mode: "OCEAN",
      grossWeightKg: 400,
      volumeCbm: 1.2,
      baseRatePerUnit: 50,
      surcharges: [],
    });
    assert.equal(w, 1200);
  });
});

describe("quote", () => {
  it("applies percentage and flat surcharges", () => {
    const q = quote({
      mode: "AIR",
      grossWeightKg: 20,
      baseRatePerUnit: 5,
      surcharges: [
        { code: "FUEL", percentOfBase: 0.1 },
        { code: "PSS", flatAmount: 15 },
      ],
    });
    assert.equal(q.baseFreight, 100);
    assert.equal(q.surchargeTotal, 25);
    assert.equal(q.total, 125);
  });
});
