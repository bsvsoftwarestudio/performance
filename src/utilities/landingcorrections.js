/**
 * C208B Airstrip Correction Factors for Landing
 * Source: LDG Airstrip Correction Factors for Landing card
 *         (table marked "Table Revision 3 - April 2022")
 *
 * Usage:
 *   const c = C208B_LandingCorrections.calculate({
 *     slopeDeg: 1,                  // signed: + upslope, - downslope
 *                                   // (convert chart % with C208B_LandingCorrections.percentToDegrees)
 *     headwindKt: 10,               // reported headwind component (50% is used)
 *     tailwindKt: 0,                // reported tailwind component (150% is used)
 *     applyWindFactors: true,       // false uses the reported wind as-is
 *     surface: "gravel",            // one of C208B_LandingCorrections.surfaces[].id
 *     wet: false,                   // true uses the wet surface percentage
 *     maximumReverse: false,        // true applies the maximum reverse -10%
 *   });
 *   c.factor          -> combined correction factor (unrounded)
 *   c.components      -> [{ id, label, detail, factor }] one entry per correction
 *   c.apply(350)      -> corrected distance, rounded UP to the next whole metre
 *
 * Method: each correction is converted to a multiplier, and the multipliers are
 * multiplied together, as for the take-off corrections. Within a correction the
 * percentage scales linearly (2 deg downslope = +20%).
 * Note the slope effect is the reverse of take-off: upslope shortens the landing,
 * downslope lengthens it.
 */
const C208B_LandingCorrections = {
  upslopePerDeg: -0.05,     // -5% per 1 deg upslope
  downslopePerDeg: 0.10,    // +10% per 1 deg downslope
  headwindPerKt: -0.009,    // -0.9% per 1 kt (usable) headwind
  tailwindPerKt: 0.05,      // +5% per 1 kt (usable) tailwind
  headwindFactor: 0.5,      // only 50% of the reported headwind is used
  tailwindFactor: 1.5,      // 150% of the reported tailwind is used
  maximumReverse: -0.10,    // -10%

  // dry / wet in percent
  surfaces: [
    { id: "tarmac",        group: "Tarmac",       label: "Tarmac",         dry: 0,  wet: 10 },
    { id: "murram",        group: "Murram",       label: "Murram",         dry: 5,  wet: 15 },
    { id: "gravel",        group: "Gravel",       label: "Gravel",         dry: 10, wet: 20 },
    { id: "soilHard",      group: "Soil",         label: "Hard",           dry: 15, wet: 30 },
    { id: "soilSoft",      group: "Soil",         label: "Soft",           dry: 15, wet: 30 },
    { id: "soilMudSand",   group: "Soil",         label: "Mud / Sand",     dry: 15, wet: 30 },
    { id: "witheredGrass", group: "Grass",        label: "Withered grass", dry: 15, wet: 30 },
    { id: "grass",         group: "Grass",        label: "Grass",          dry: 40, wet: 55 },
    { id: "blackCotton",   group: "Black cotton", label: "Black cotton",   dry: 5,  wet: 50 },
  ],

  // Display name, e.g. "Soil – hard"; groups with a single entry use the group name only
  surfaceName(s) {
    return s.group === s.label ? s.label : `${s.group} – ${s.label.toLowerCase()}`;
  },

  // Airstrip charts give slope in percent (rise / run x 100); the corrections use degrees
  percentToDegrees(percent) {
    return (Math.atan(percent / 100) * 180) / Math.PI;
  },

  calculate({ slopeDeg = 0, headwindKt = 0, tailwindKt = 0, surface = "tarmac", wet = false, maximumReverse = false, applyWindFactors = true } = {}) {
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
        detail: `${round2(slopeDeg)}° up × -5%`,
        factor: 1 + this.upslopePerDeg * slopeDeg,
      });
    } else if (slopeDeg < 0) {
      components.push({
        id: "slope",
        label: "Downslope",
        detail: `${round2(-slopeDeg)}° down × +10%`,
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

    const surfacePercent = wet ? surfaceEntry.wet : surfaceEntry.dry;
    if (surfacePercent !== 0) {
      components.push({
        id: "surface",
        label: "Surface",
        detail: `${this.surfaceName(surfaceEntry)} (${wet ? "wet" : "dry"}) +${surfacePercent}%`,
        factor: 1 + surfacePercent / 100,
      });
    }

    if (maximumReverse) {
      components.push({
        id: "reverse",
        label: "Reverse thrust",
        detail: "Maximum reverse -10%",
        factor: 1 + this.maximumReverse,
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

export default C208B_LandingCorrections;
