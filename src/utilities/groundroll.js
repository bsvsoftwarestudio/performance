/**
 * C208B Ground Roll Distance [m]
 * Source: MAF Cockpit Printables - C208B - UGA (Jul 2023), page 5
 *         (table marked "Revision 1 - May 2016")
 *
 * Usage:
 *   const r = C208B_GroundRoll.calculate(3850, 4500, 27);
 *   r.groundRoll  -> ground roll in metres (rounded UP to the next whole metre)
 *   r.exact       -> interpolated value before rounding
 *   r.warnings    -> array of notes if any input was below the table range
 *
 * Method: linear interpolation in all three dimensions (weight, PA, temperature).
 * Inputs ABOVE the table (weight > 4111 kg, PA > 8000 ft, temp > 40 C) throw an
 * error - the chart is never extrapolated.
 * Inputs BELOW the table are clamped to the lowest tabulated value (3000 kg,
 * 0 ft, 10 C), which gives a conservative (longer) figure, and a warning is added.
 * Apply any AFM corrections (wind, slope, surface) separately.
 */
const C208B_GroundRoll = {
  weights: [4111, 4000, 3900, 3800, 3700, 3600, 3500, 3400, 3300, 3200, 3100, 3000], // kg
  pressureAltitudes: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000],           // ft
  temperatures: [10, 20, 30, 40],                                                     // deg C

  // table[weight][paIndex][tempIndex]  ->  metres
  //          10C   20C   30C   40C
  table: {
    4111: [
      [ 452,  483,  514,  542], // 0 ft
      [ 489,  514,  545,  589], // 1000 ft
      [ 521,  545,  581,  639], // 2000 ft
      [ 552,  580,  624,  697], // 3000 ft
      [ 585,  620,  676,  766], // 4000 ft
      [ 623,  669,  740,  848], // 5000 ft
      [ 669,  729,  818,  946], // 6000 ft
      [ 725,  803,  914, 1065], // 7000 ft
      [ 794,  894, 1028, 1205], // 8000 ft
    ],
    4000: [
      [ 422,  450,  479,  505], // 0 ft
      [ 455,  479,  508,  548], // 1000 ft
      [ 485,  507,  541,  595], // 2000 ft
      [ 513,  539,  580,  648], // 3000 ft
      [ 544,  577,  628,  711], // 4000 ft
      [ 579,  622,  687,  785], // 5000 ft
      [ 621,  677,  759,  875], // 6000 ft
      [ 673,  745,  846,  983], // 7000 ft
      [ 737,  828,  951, 1112], // 8000 ft
    ],
    3900: [
      [ 395,  422,  448,  472], // 0 ft
      [ 426,  448,  475,  513], // 1000 ft
      [ 453,  475,  506,  556], // 2000 ft
      [ 480,  505,  542,  605], // 3000 ft
      [ 509,  539,  587,  663], // 4000 ft
      [ 542,  581,  641,  732], // 5000 ft
      [ 581,  633,  708,  814], // 6000 ft
      [ 629,  695,  788,  913], // 7000 ft
      [ 688,  772,  884, 1032], // 8000 ft
    ],
    3800: [
      [ 370,  394,  418,  441], // 0 ft
      [ 398,  418,  444,  479], // 1000 ft
      [ 423,  443,  473,  519], // 2000 ft
      [ 448,  471,  507,  565], // 3000 ft
      [ 475,  504,  548,  618], // 4000 ft
      [ 506,  543,  598,  681], // 5000 ft
      [ 542,  590,  659,  757], // 6000 ft
      [ 587,  648,  733,  847], // 7000 ft
      [ 642,  718,  821,  956], // 8000 ft
    ],
    3700: [
      [ 346,  368,  390,  412], // 0 ft
      [ 371,  390,  414,  447], // 1000 ft
      [ 395,  413,  441,  484], // 2000 ft
      [ 418,  439,  472,  526], // 3000 ft
      [ 443,  469,  510,  574], // 4000 ft
      [ 471,  506,  556,  632], // 5000 ft
      [ 505,  549,  613,  702], // 6000 ft
      [ 547,  603,  680,  785], // 7000 ft
      [ 597,  667,  761,  884], // 8000 ft
    ],
    3600: [
      [ 322,  343,  364,  383], // 0 ft
      [ 346,  364,  385,  416], // 1000 ft
      [ 367,  385,  410,  450], // 2000 ft
      [ 389,  409,  439,  489], // 3000 ft
      [ 412,  437,  474,  533], // 4000 ft
      [ 439,  470,  517,  586], // 5000 ft
      [ 470,  511,  569,  650], // 6000 ft
      [ 508,  560,  631,  726], // 7000 ft
      [ 555,  619,  705,  817], // 8000 ft
    ],
    3500: [
      [ 300,  319,  338,  356], // 0 ft
      [ 321,  338,  358,  386], // 1000 ft
      [ 341,  358,  381,  418], // 2000 ft
      [ 361,  380,  408,  453], // 3000 ft
      [ 383,  406,  441,  494], // 4000 ft
      [ 408,  437,  480,  543], // 5000 ft
      [ 437,  474,  527,  601], // 6000 ft
      [ 472,  519,  584,  671], // 7000 ft
      [ 515,  574,  652,  753], // 8000 ft
    ],
    3400: [
      [ 278,  297,  314,  331], // 0 ft
      [ 298,  314,  333,  358], // 1000 ft
      [ 317,  332,  353,  387], // 2000 ft
      [ 336,  353,  378,  420], // 3000 ft
      [ 356,  377,  408,  458], // 4000 ft
      [ 378,  405,  445,  502], // 5000 ft
      [ 405,  440,  488,  556], // 6000 ft
      [ 438,  481,  540,  619], // 7000 ft
      [ 477,  531,  602,  694], // 8000 ft
    ],
    3300: [
      [ 258,  275,  292,  306], // 0 ft
      [ 277,  291,  308,  331], // 1000 ft
      [ 294,  308,  327,  358], // 2000 ft
      [ 311,  327,  350,  388], // 3000 ft
      [ 330,  349,  378,  423], // 4000 ft
      [ 351,  376,  411,  464], // 5000 ft
      [ 376,  407,  452,  513], // 6000 ft
      [ 405,  445,  499,  571], // 7000 ft
      [ 441,  491,  556,  639], // 8000 ft
    ],
    3200: [
      [ 238,  255,  271,  283], // 0 ft
      [ 256,  269,  285,  306], // 1000 ft
      [ 272,  285,  303,  331], // 2000 ft
      [ 288,  302,  324,  359], // 3000 ft
      [ 306,  323,  349,  391], // 4000 ft
      [ 325,  348,  380,  429], // 5000 ft
      [ 348,  377,  417,  473], // 6000 ft
      [ 375,  412,  461,  526], // 7000 ft
      [ 408,  453,  513,  588], // 8000 ft
    ],
    3100: [
      [ 220,  236,  251,  261], // 0 ft
      [ 237,  249,  263,  282], // 1000 ft
      [ 252,  263,  279,  305], // 2000 ft
      [ 267,  280,  299,  331], // 3000 ft
      [ 283,  299,  323,  361], // 4000 ft
      [ 301,  321,  351,  396], // 5000 ft
      [ 322,  348,  386,  437], // 6000 ft
      [ 346,  381,  426,  485], // 7000 ft
      [ 376,  419,  473,  541], // 8000 ft
    ],
    3000: [
      [ 202,  218,  232,  241], // 0 ft
      [ 218,  230,  243,  260], // 1000 ft
      [ 233,  243,  257,  281], // 2000 ft
      [ 247,  258,  275,  305], // 3000 ft
      [ 262,  276,  297,  333], // 4000 ft
      [ 278,  297,  324,  365], // 5000 ft
      [ 297,  322,  356,  403], // 6000 ft
      [ 320,  352,  394,  448], // 7000 ft
      [ 347,  387,  437,  499], // 8000 ft
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
    return { groundRoll: Math.ceil(exact - 1e-9), exact, warnings };
  },
};

export default C208B_GroundRoll;