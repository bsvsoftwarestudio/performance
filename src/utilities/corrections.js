/**
 * C208B Airstrip Correction Factors
 * Source: MAF Cockpit Printables - C208B - UGA (Jul 2023), page 6
 *         (table marked "Revision 2 - November 2019")
 *
 * Usage:
 *   const c = C208B_Corrections.calculate({
 *     slopeDeg: 1,                  // signed: + upslope, - downslope
 *                                   // (convert chart % with C208B_Corrections.percentToDegrees)
 *     headwindKt: 10,               // reported headwind component (50% is used)
 *     tailwindKt: 0,                // reported tailwind component (150% is used)
 *     applyWindFactors: true,       // false uses the reported wind as-is (the charts
 *                                   // already factor the wind, so the SOP factors double up)
 *     surface: "shortGrassRough",   // one of C208B_Corrections.surfaces[].id
 *     inertialSeparatorBypass: false,
 *   });
 *   c.factor          -> combined correction factor (unrounded)
 *   c.components      -> [{ id, label, detail, factor }] one entry per correction
 *   c.apply(577)      -> corrected distance, rounded UP to the next whole metre
 *
 * Method: each correction is converted to a multiplier, and the multipliers are
 * multiplied together, as in the page 6 example (1.1 x 0.955 x 1.15 = 1.208).
 * Within a correction the percentage scales linearly (2 deg upslope = +20%).
 * Apply the factor to the uncorrected ground roll to get TORR; TODR = TORR x 1.78
 * then carries the corrections (including the inertial separator +3%) through.
 *
 * The +3% inertial separator correction strictly applies only with take-off power
 * set below the 1865 ft-lbs torque limit; it is applied whenever BYPASS is set,
 * which is conservative.
 */
const C208B_Corrections = {
  upslopePerDeg: 0.10,      // +10% per 1 deg upslope
  downslopePerDeg: -0.05,   // -5% per 1 deg downslope
  headwindPerKt: -0.009,    // -0.9% per 1 kt (usable) headwind
  tailwindPerKt: 0.05,      // +5% per 1 kt (usable) tailwind
  headwindFactor: 0.5,      // only 50% of the reported headwind is used
  tailwindFactor: 1.5,      // 150% of the reported tailwind is used
  inertialSeparatorBypass: 0.03, // +3%

  surfaces: [
    { id: "tarmac",              label: "Dry tarmac",                          percent: 0 },
    { id: "shortGrassSmooth",    label: "Short grass – smooth",                percent: 8 },
    { id: "shortGrassRough",     label: "Short grass – slightly rough",        percent: 15 },
    { id: "mediumGrassRough",    label: "Medium grass – rough",                percent: 31 },
    { id: "longGrassVeryRough",  label: "Long grass – very rough; mud or sand", percent: 46 },
  ],

  // Airstrip charts give slope in percent (rise / run x 100); the corrections use degrees
  percentToDegrees(percent) {
    return (Math.atan(percent / 100) * 180) / Math.PI;
  },

  calculate({ slopeDeg = 0, headwindKt = 0, tailwindKt = 0, surface = "tarmac", inertialSeparatorBypass = false, applyWindFactors = true } = {}) {
    for (const [name, v] of [["slope", slopeDeg], ["headwind", headwindKt], ["tailwind", tailwindKt]]) {
      if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`Invalid ${name}: ${v}`);
    }
    if (headwindKt < 0) throw new Error(`Headwind ${headwindKt} kt cannot be negative - enter a tailwind instead.`);
    if (tailwindKt < 0) throw new Error(`Tailwind ${tailwindKt} kt cannot be negative - enter a headwind instead.`);
    if (headwindKt > 0 && tailwindKt > 0) throw new Error("Enter either a headwind or a tailwind, not both.");

    const surfaceEntry = this.surfaces.find((s) => s.id === surface);
    if (!surfaceEntry) throw new Error(`Unknown surface: ${surface}`);

    const components = [];
    const round2 = (n) => Number(n.toFixed(2));

    if (slopeDeg > 0) {
      components.push({
        id: "slope",
        label: "Upslope",
        detail: `${round2(slopeDeg)}° up × +10%`,
        factor: 1 + this.upslopePerDeg * slopeDeg,
      });
    } else if (slopeDeg < 0) {
      components.push({
        id: "slope",
        label: "Downslope",
        detail: `${round2(-slopeDeg)}° down × -5%`,
        factor: 1 + this.downslopePerDeg * -slopeDeg,
      });
    }

    if (headwindKt > 0) {
      const windFactor = applyWindFactors ? this.headwindFactor : 1;
      const usable = headwindKt * windFactor;
      components.push({
        id: "wind",
        label: "Headwind",
        detail: `${headwindKt} kt reported, ${usable} kt usable (${windFactor * 100}%) × -0.9%`,
        factor: 1 + this.headwindPerKt * usable,
      });
    } else if (tailwindKt > 0) {
      const windFactor = applyWindFactors ? this.tailwindFactor : 1;
      const usable = tailwindKt * windFactor;
      components.push({
        id: "wind",
        label: "Tailwind",
        detail: `${tailwindKt} kt reported, ${usable} kt usable (${windFactor * 100}%) × +5%`,
        factor: 1 + this.tailwindPerKt * usable,
      });
    }

    if (surfaceEntry.percent !== 0) {
      components.push({
        id: "surface",
        label: "Surface",
        detail: `${surfaceEntry.label} +${surfaceEntry.percent}%`,
        factor: 1 + surfaceEntry.percent / 100,
      });
    }

    if (inertialSeparatorBypass) {
      components.push({
        id: "inertialSeparator",
        label: "Inertial separator",
        detail: "Bypass +3%",
        factor: 1 + this.inertialSeparatorBypass,
      });
    }

    for (const c of components) {
      if (c.factor <= 0) throw new Error(`${c.label} correction (${c.detail}) is outside the usable range.`);
    }

    const factor = components.reduce((product, c) => product * c.factor, 1);
    return {
      factor,
      components,
      apply: (distance) => Math.ceil(distance * factor - 1e-9),
    };
  },
};

export default C208B_Corrections;
