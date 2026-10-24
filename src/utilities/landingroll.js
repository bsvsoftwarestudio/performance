/**
 * C208B APE III Landing Roll [m]
 * Source: C208B (APE III) Short-Field Landing table - Landing Roll & Landing Distance
 * from 50 ft (C208B_APE_III_Landing_Table_Metric.pdf, Oct 2026)
 * Conditions: flaps 30, short-field technique, idle after obstacle, BETA after
 * touchdown, max braking, paved level DRY runway, ZERO wind, cargo pod installed.
 * 3100 and 3000 kg rows repeat the lightest published weight (7000 lb / 3175 kg).
 * 40 C at 7000 ft and above exceeds the hot-day ground-ops limit (ISA+37 C above
 * 5000 ft); those values are published for interpolation only.
 *
 * Usage:
 *   const r = C208B_LandingRoll.calculate(3850, 4500, 27);
 *   r.landingRoll     -> landing roll in metres (rounded UP to the next whole metre)
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
const C208B_LandingRoll = {
  weights: [4082, 4000, 3900, 3800, 3700, 3600, 3500, 3400, 3300, 3200, 3100, 3000], // kg
  pressureAltitudes: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000],           // ft
  temperatures: [10, 20, 30, 40],                                                     // deg C

  // table[weight][paIndex][tempIndex]  ->  metres
  //          10C   20C   30C   40C
  table: {
    4082: [
      [ 292,  302,  314,  322], // 0 ft
      [ 302,  313,  325,  335], // 1000 ft
      [ 313,  324,  336,  348], // 2000 ft
      [ 324,  337,  347,  360], // 3000 ft
      [ 334,  349,  359,  372], // 4000 ft
      [ 348,  362,  373,  386], // 5000 ft
      [ 362,  374,  388,  400], // 6000 ft
      [ 375,  390,  402,  416], // 7000 ft
      [ 389,  406,  417,  432], // 8000 ft
    ],
    4000: [
      [ 286,  296,  307,  315], // 0 ft
      [ 296,  306,  318,  328], // 1000 ft
      [ 306,  317,  329,  340], // 2000 ft
      [ 318,  330,  341,  352], // 3000 ft
      [ 329,  343,  352,  365], // 4000 ft
      [ 341,  354,  366,  378], // 5000 ft
      [ 354,  366,  380,  392], // 6000 ft
      [ 368,  382,  394,  407], // 7000 ft
      [ 382,  398,  409,  423], // 8000 ft
    ],
    3900: [
      [ 278,  288,  298,  307], // 0 ft
      [ 288,  298,  309,  319], // 1000 ft
      [ 298,  309,  320,  331], // 2000 ft
      [ 310,  321,  332,  343], // 3000 ft
      [ 321,  334,  344,  355], // 4000 ft
      [ 333,  346,  357,  369], // 5000 ft
      [ 345,  358,  370,  383], // 6000 ft
      [ 359,  373,  385,  398], // 7000 ft
      [ 373,  388,  399,  413], // 8000 ft
    ],
    3800: [
      [ 271,  280,  290,  299], // 0 ft
      [ 281,  290,  301,  311], // 1000 ft
      [ 291,  301,  311,  322], // 2000 ft
      [ 302,  313,  323,  334], // 3000 ft
      [ 313,  325,  336,  346], // 4000 ft
      [ 325,  337,  348,  360], // 5000 ft
      [ 337,  349,  361,  373], // 6000 ft
      [ 351,  363,  375,  388], // 7000 ft
      [ 364,  377,  390,  403], // 8000 ft
    ],
    3700: [
      [ 263,  272,  282,  291], // 0 ft
      [ 273,  283,  293,  302], // 1000 ft
      [ 283,  293,  303,  313], // 2000 ft
      [ 294,  304,  315,  325], // 3000 ft
      [ 305,  316,  327,  337], // 4000 ft
      [ 317,  328,  339,  351], // 5000 ft
      [ 328,  340,  352,  364], // 6000 ft
      [ 341,  354,  366,  378], // 7000 ft
      [ 355,  367,  380,  392], // 8000 ft
    ],
    3600: [
      [ 256,  265,  274,  283], // 0 ft
      [ 266,  275,  285,  294], // 1000 ft
      [ 276,  285,  295,  305], // 2000 ft
      [ 286,  296,  307,  317], // 3000 ft
      [ 297,  307,  318,  329], // 4000 ft
      [ 308,  319,  330,  341], // 5000 ft
      [ 320,  332,  342,  354], // 6000 ft
      [ 332,  344,  356,  368], // 7000 ft
      [ 345,  357,  369,  382], // 8000 ft
    ],
    3500: [
      [ 249,  258,  267,  276], // 0 ft
      [ 259,  268,  277,  286], // 1000 ft
      [ 268,  277,  287,  296], // 2000 ft
      [ 279,  288,  298,  308], // 3000 ft
      [ 289,  299,  309,  319], // 4000 ft
      [ 300,  310,  321,  332], // 5000 ft
      [ 311,  322,  333,  344], // 6000 ft
      [ 323,  335,  346,  358], // 7000 ft
      [ 336,  347,  359,  372], // 8000 ft
    ],
    3400: [
      [ 243,  250,  259,  269], // 0 ft
      [ 252,  260,  269,  278], // 1000 ft
      [ 261,  270,  279,  288], // 2000 ft
      [ 271,  280,  290,  299], // 3000 ft
      [ 281,  290,  301,  310], // 4000 ft
      [ 291,  301,  312,  322], // 5000 ft
      [ 302,  313,  323,  334], // 6000 ft
      [ 314,  325,  336,  348], // 7000 ft
      [ 326,  337,  349,  361], // 8000 ft
    ],
    3300: [
      [ 235,  243,  251,  261], // 0 ft
      [ 244,  252,  261,  270], // 1000 ft
      [ 253,  262,  270,  280], // 2000 ft
      [ 262,  272,  281,  290], // 3000 ft
      [ 272,  281,  291,  301], // 4000 ft
      [ 283,  292,  303,  312], // 5000 ft
      [ 293,  303,  314,  324], // 6000 ft
      [ 305,  315,  326,  337], // 7000 ft
      [ 316,  327,  339,  350], // 8000 ft
    ],
    3200: [
      [ 228,  236,  243,  252], // 0 ft
      [ 236,  245,  253,  262], // 1000 ft
      [ 245,  254,  262,  271], // 2000 ft
      [ 254,  263,  272,  282], // 3000 ft
      [ 263,  272,  282,  292], // 4000 ft
      [ 274,  283,  293,  303], // 5000 ft
      [ 285,  294,  305,  314], // 6000 ft
      [ 295,  305,  316,  326], // 7000 ft
      [ 306,  317,  328,  339], // 8000 ft
    ],
    3100: [
      [ 226,  234,  241,  250], // 0 ft
      [ 234,  243,  250,  260], // 1000 ft
      [ 243,  252,  260,  269], // 2000 ft
      [ 252,  261,  269,  279], // 3000 ft
      [ 261,  270,  279,  290], // 4000 ft
      [ 272,  281,  291,  301], // 5000 ft
      [ 282,  292,  302,  311], // 6000 ft
      [ 293,  303,  314,  324], // 7000 ft
      [ 304,  314,  325,  336], // 8000 ft
    ],
    3000: [
      [ 226,  234,  241,  250], // 0 ft
      [ 234,  243,  250,  260], // 1000 ft
      [ 243,  252,  260,  269], // 2000 ft
      [ 252,  261,  269,  279], // 3000 ft
      [ 261,  270,  279,  290], // 4000 ft
      [ 272,  281,  291,  301], // 5000 ft
      [ 282,  292,  302,  311], // 6000 ft
      [ 293,  303,  314,  324], // 7000 ft
      [ 304,  314,  325,  336], // 8000 ft
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
    return { landingRoll: Math.ceil(exact - 1e-9), exact, warnings };
  },
};

export default C208B_LandingRoll;
