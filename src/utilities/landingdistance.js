/**
 * C208B APE III Landing Distance from 50 ft [m]
 * Source: C208B (APE III) Short-Field Landing table - Landing Roll & Landing Distance
 * from 50 ft (C208B_APE_III_Landing_Table_Metric.pdf, Oct 2026)
 * Conditions: flaps 30, short-field technique, idle after obstacle, BETA after
 * touchdown, max braking, paved level DRY runway, ZERO wind, cargo pod installed.
 * 3100 and 3000 kg rows repeat the lightest published weight (7000 lb / 3175 kg).
 * 40 C at 7000 ft and above exceeds the hot-day ground-ops limit (ISA+37 C above
 * 5000 ft); those values are published for interpolation only.
 *
 * Usage:
 *   const r = C208B_LandingDistance.calculate(3850, 4500, 27);
 *   r.landingDistance -> landing distance from 50 ft in metres (rounded UP to the next whole metre)
 *   r.exact           -> interpolated value before rounding
 *   r.warnings        -> array of notes if any input was below the table range
 *
 * Method: linear interpolation in all three dimensions (weight, PA, temperature).
 * Inputs ABOVE the table (weight > 4082 kg, PA > 8000 ft, temp > 40 C) throw an
 * error - the chart is never extrapolated.
 * Inputs BELOW the table are clamped to the lowest tabulated value (3000 kg,
 * 0 ft, 10 C), which gives a conservative (longer) figure, and a warning is added.
 * Apply any corrections separately.
 */
const C208B_LandingDistance = {
  weights: [4082, 4000, 3900, 3800, 3700, 3600, 3500, 3400, 3300, 3200, 3100, 3000], // kg
  pressureAltitudes: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000],           // ft
  temperatures: [10, 20, 30, 40],                                                     // deg C

  // table[weight][paIndex][tempIndex]  ->  metres
  //          10C   20C   30C   40C
  table: {
    4082: [
      [ 548,  564,  580,  593], // 0 ft
      [ 564,  580,  595,  610], // 1000 ft
      [ 580,  596,  610,  627], // 2000 ft
      [ 596,  612,  626,  644], // 3000 ft
      [ 613,  627,  642,  662], // 4000 ft
      [ 630,  645,  662,  680], // 5000 ft
      [ 647,  663,  682,  698], // 6000 ft
      [ 666,  686,  702,  721], // 7000 ft
      [ 686,  708,  721,  743], // 8000 ft
    ],
    4000: [
      [ 539,  556,  570,  583], // 0 ft
      [ 555,  571,  585,  600], // 1000 ft
      [ 571,  586,  600,  617], // 2000 ft
      [ 587,  602,  617,  634], // 3000 ft
      [ 603,  618,  633,  652], // 4000 ft
      [ 620,  636,  653,  670], // 5000 ft
      [ 637,  653,  672,  689], // 6000 ft
      [ 656,  674,  692,  710], // 7000 ft
      [ 675,  695,  711,  731], // 8000 ft
    ],
    3900: [
      [ 528,  544,  558,  571], // 0 ft
      [ 544,  559,  573,  588], // 1000 ft
      [ 559,  574,  588,  604], // 2000 ft
      [ 575,  590,  605,  621], // 3000 ft
      [ 591,  606,  622,  639], // 4000 ft
      [ 608,  624,  640,  657], // 5000 ft
      [ 625,  641,  659,  676], // 6000 ft
      [ 644,  661,  679,  696], // 7000 ft
      [ 663,  682,  698,  717], // 8000 ft
    ],
    3800: [
      [ 518,  533,  546,  560], // 0 ft
      [ 533,  548,  561,  575], // 1000 ft
      [ 548,  563,  576,  591], // 2000 ft
      [ 564,  579,  593,  609], // 3000 ft
      [ 579,  595,  609,  626], // 4000 ft
      [ 596,  612,  628,  644], // 5000 ft
      [ 613,  629,  646,  662], // 6000 ft
      [ 631,  649,  665,  683], // 7000 ft
      [ 650,  668,  685,  703], // 8000 ft
    ],
    3700: [
      [ 508,  522,  535,  548], // 0 ft
      [ 522,  536,  550,  564], // 1000 ft
      [ 537,  551,  565,  579], // 2000 ft
      [ 552,  567,  581,  596], // 3000 ft
      [ 568,  583,  597,  613], // 4000 ft
      [ 584,  600,  615,  631], // 5000 ft
      [ 600,  617,  633,  650], // 6000 ft
      [ 619,  636,  652,  669], // 7000 ft
      [ 637,  655,  671,  689], // 8000 ft
    ],
    3600: [
      [ 497,  511,  525,  537], // 0 ft
      [ 512,  525,  539,  552], // 1000 ft
      [ 526,  540,  553,  567], // 2000 ft
      [ 541,  556,  569,  584], // 3000 ft
      [ 556,  571,  585,  600], // 4000 ft
      [ 572,  588,  603,  618], // 5000 ft
      [ 588,  605,  620,  637], // 6000 ft
      [ 606,  623,  639,  655], // 7000 ft
      [ 625,  641,  658,  674], // 8000 ft
    ],
    3500: [
      [ 487,  500,  513,  525], // 0 ft
      [ 501,  514,  528,  540], // 1000 ft
      [ 515,  528,  542,  555], // 2000 ft
      [ 529,  543,  558,  571], // 3000 ft
      [ 544,  559,  573,  588], // 4000 ft
      [ 560,  575,  590,  605], // 5000 ft
      [ 575,  591,  607,  622], // 6000 ft
      [ 593,  609,  625,  641], // 7000 ft
      [ 611,  627,  644,  660], // 8000 ft
    ],
    3400: [
      [ 477,  489,  502,  514], // 0 ft
      [ 490,  503,  516,  528], // 1000 ft
      [ 503,  517,  531,  543], // 2000 ft
      [ 518,  531,  546,  559], // 3000 ft
      [ 532,  546,  561,  575], // 4000 ft
      [ 547,  562,  577,  592], // 5000 ft
      [ 563,  578,  593,  608], // 6000 ft
      [ 580,  595,  611,  627], // 7000 ft
      [ 598,  613,  630,  645], // 8000 ft
    ],
    3300: [
      [ 467,  479,  491,  502], // 0 ft
      [ 480,  492,  505,  517], // 1000 ft
      [ 492,  505,  519,  531], // 2000 ft
      [ 507,  520,  533,  546], // 3000 ft
      [ 521,  534,  548,  562], // 4000 ft
      [ 536,  549,  564,  578], // 5000 ft
      [ 551,  565,  580,  595], // 6000 ft
      [ 567,  582,  597,  612], // 7000 ft
      [ 584,  599,  615,  630], // 8000 ft
    ],
    3200: [
      [ 456,  468,  480,  491], // 0 ft
      [ 469,  481,  493,  505], // 1000 ft
      [ 482,  494,  506,  519], // 2000 ft
      [ 496,  508,  521,  534], // 3000 ft
      [ 509,  522,  536,  549], // 4000 ft
      [ 524,  537,  551,  565], // 5000 ft
      [ 538,  552,  566,  581], // 6000 ft
      [ 555,  569,  583,  598], // 7000 ft
      [ 571,  586,  600,  615], // 8000 ft
    ],
    3100: [
      [ 453,  465,  478,  488], // 0 ft
      [ 466,  478,  490,  502], // 1000 ft
      [ 479,  491,  503,  516], // 2000 ft
      [ 493,  505,  518,  531], // 3000 ft
      [ 506,  519,  532,  546], // 4000 ft
      [ 521,  534,  548,  562], // 5000 ft
      [ 535,  549,  563,  578], // 6000 ft
      [ 551,  566,  580,  595], // 7000 ft
      [ 567,  583,  596,  612], // 8000 ft
    ],
    3000: [
      [ 453,  465,  478,  488], // 0 ft
      [ 466,  478,  490,  502], // 1000 ft
      [ 479,  491,  503,  516], // 2000 ft
      [ 493,  505,  518,  531], // 3000 ft
      [ 506,  519,  532,  546], // 4000 ft
      [ 521,  534,  548,  562], // 5000 ft
      [ 535,  549,  563,  578], // 6000 ft
      [ 551,  566,  580,  595], // 7000 ft
      [ 567,  583,  596,  612], // 8000 ft
    ],
  },

  calculate(weightKg, pressureAltFt, tempC) {
    for (const [name, v] of [["weight", weightKg], ["pressure altitude", pressureAltFt], ["temperature", tempC]]) {
      if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`Invalid ${name}: ${v}`);
    }
    const warnings = [];
    const W = [...this.weights].sort((a, b) => a - b);
    const P = this.pressureAltitudes;
    const T = this.temperatures;

    const bound = (v, axis, name, unit) => {
      const lo = axis[0], hi = axis[axis.length - 1];
      if (v > hi) throw new Error(`${name} ${v} ${unit} is above the table maximum of ${hi} ${unit} - outside chart, do not extrapolate.`);
      if (v < lo) {
        warnings.push(`${name} ${v} ${unit} below table minimum - ${lo} ${unit} used (conservative).`);
        return lo;
      }
      return v;
    };
    const w = bound(weightKg, W, "Weight", "kg");
    const p = bound(pressureAltFt, P, "Pressure altitude", "ft");
    const t = bound(tempC, T, "Temperature", "C");

    // Find the bracketing indices and fraction along an axis
    const bracket = (axis, v) => {
      let i = 0;
      while (i < axis.length - 2 && v > axis[i + 1]) i++;
      return { i, f: (v - axis[i]) / (axis[i + 1] - axis[i]) };
    };
    const lerp = (a, b, f) => a + (b - a) * f;

    const bw = bracket(W, w), bp = bracket(P, p), bt = bracket(T, t);

    const atWeight = (wt) => {
      const rows = this.table[wt];
      const lo = lerp(rows[bp.i][bt.i], rows[bp.i][bt.i + 1], bt.f);
      const hi = lerp(rows[bp.i + 1][bt.i], rows[bp.i + 1][bt.i + 1], bt.f);
      return lerp(lo, hi, bp.f);
    };

    const exact = lerp(atWeight(W[bw.i]), atWeight(W[bw.i + 1]), bw.f);
    return { landingDistance: Math.ceil(exact - 1e-9), exact, warnings };
  },
};

export default C208B_LandingDistance;
