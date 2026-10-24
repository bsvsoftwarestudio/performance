/**
 * C208B Speed Reference Table [KIAS]
 * Source: MAF Cockpit Printables - C208B - UGA (Jul 2023), page 2
 *         (table marked "Revision 2 - November 2019")
 *
 * Usage:
 *   const s = C208B_Speeds.lookup(3850);
 *   s.weight      -> tabulated weight used (the next heavier row, here 3900 kg)
 *   s.speeds      -> { Vr20: 69, Voc20: 82, Vy: 104, Vref: 78, Vx20: 70, Va: 141, Vglide: 94 }
 *   s.vrefAtMlw   -> true when the Vref shown is Vref at MLW for APE III (4111 / 4000 kg rows)
 *   s.warnings    -> array of notes if the weight was below the table range
 *
 * Method: no interpolation. A weight between two rows uses the higher speed of the
 * two bracketing rows for each speed (in this table that is always the heavier row).
 * Weights ABOVE the table (> 4111 kg) throw an error. Weights BELOW the table use the
 * lightest row (2750 kg), which gives the higher speeds, and a warning is added.
 */
const C208B_Speeds = {
  speedNames: ["Vr20", "Voc20", "Vy", "Vref", "Vx20", "Va", "Vglide"],

  //  weight    Vr20 Voc20  Vy  Vref Vx20  Va  Vglide
  rows: [
    { weight: 4111, Vr20: 71, Voc20: 86, Vy: 105, Vref: 80, Vx20: 72, Va: 143, Vglide: 96, vrefAtMlw: true },
    { weight: 4000, Vr20: 70, Voc20: 83, Vy: 104, Vref: 80, Vx20: 71, Va: 142, Vglide: 95, vrefAtMlw: true },
    { weight: 3900, Vr20: 69, Voc20: 82, Vy: 104, Vref: 78, Vx20: 70, Va: 141, Vglide: 94 },
    { weight: 3800, Vr20: 68, Voc20: 81, Vy: 103, Vref: 77, Vx20: 69, Va: 141, Vglide: 92 },
    { weight: 3700, Vr20: 66, Voc20: 79, Vy: 102, Vref: 76, Vx20: 68, Va: 140, Vglide: 91 },
    { weight: 3600, Vr20: 65, Voc20: 77, Vy: 102, Vref: 75, Vx20: 67, Va: 139, Vglide: 89 },
    { weight: 3500, Vr20: 63, Voc20: 75, Vy: 101, Vref: 74, Vx20: 65, Va: 138, Vglide: 88 },
    { weight: 3250, Vr20: 60, Voc20: 72, Vy: 98,  Vref: 72, Vx20: 62, Va: 135, Vglide: 85 },
    { weight: 3000, Vr20: 60, Voc20: 70, Vy: 95,  Vref: 70, Vx20: 59, Va: 129, Vglide: 81 },
    { weight: 2750, Vr20: 60, Voc20: 70, Vy: 93,  Vref: 68, Vx20: 55, Va: 123, Vglide: 77 },
  ],

  lookup(weightKg) {
    if (typeof weightKg !== "number" || !Number.isFinite(weightKg)) throw new Error(`Invalid weight: ${weightKg}`);
    const rows = [...this.rows].sort((a, b) => a.weight - b.weight); // lightest first
    const lightest = rows[0], heaviest = rows[rows.length - 1];
    if (weightKg > heaviest.weight) {
      throw new Error(`Weight ${weightKg} kg is above the table maximum of ${heaviest.weight} kg.`);
    }

    const warnings = [];
    let lower, upper;
    if (weightKg <= lightest.weight) {
      if (weightKg < lightest.weight) {
        warnings.push(`Weight ${weightKg} kg below table minimum - ${lightest.weight} kg speeds used.`);
      }
      lower = upper = lightest;
    } else {
      const i = rows.findIndex((r) => r.weight >= weightKg);
      upper = rows[i];
      lower = rows[i].weight === weightKg ? rows[i] : rows[i - 1];
    }

    const speeds = {};
    for (const name of this.speedNames) speeds[name] = Math.max(lower[name], upper[name]);
    return { weight: upper.weight, speeds, vrefAtMlw: Boolean(upper.vrefAtMlw), warnings };
  },
};

export default C208B_Speeds;
