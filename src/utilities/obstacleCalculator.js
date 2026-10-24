/**
 * Airstrip Obstacle Clearance and Displacement Calculator
 * Port of "Airstrip Obstacle Calculator.xlsx" (Obstacles sheet).
 *
 * Inputs:  distance to obstacle from the runway threshold (m) and the
 *          inclination (deg) measured from the threshold to the obstacle top.
 * Outputs: obstacle height, take-off displacement / clearway (OPS C 6.1.5),
 *          landing displacement (OPS B 7.9.2 b) and landing displacement with
 *          clearway (OPS C 6.1.4).
 *
 * All gradients are applied as exact percentages (5%, 3.5%, 2.5%), not as
 * rounded angles. Obstacles are measured from the runway threshold.
 *
 * Usage:
 *   const r = calculateObstacleDisplacement(400, 5.9);
 *   console.log(r.landingOpsB.displacement); // ≈ 781 m (the spreadsheet's 2 deg line gives 784 m)
 */
 
const deg2rad = (d) => (d * Math.PI) / 180;
const rad2deg = (r) => (r * 180) / Math.PI;
 
/** Slope converters (the "Converter" block in the sheet). */
const degToPercent = (deg) => Math.tan(deg2rad(deg)) * 100;
const percentToDeg = (pct) => rad2deg(Math.atan(pct / 100));
 
/**
 * @param {number} distance      Distance from threshold to obstacle (m)
 * @param {number} inclination   Inclination to top of obstacle (deg)
 * @param {object} [options]
 * @param {number} [options.landingClearway=90]  Clearway used for OPS C 6.1.4 landing (m)
 * @param {number} [options.tan5=0.05]            5% obstacle gradient (take-off and OPS C landing)
 * @param {number} [options.tan35=0.035]          3.5% OPS B landing approach gradient
 * @param {number} [options.tan25=0.025]          2.5% clearway gradient
 */
function calculateObstacleDisplacement(distance, inclination, options = {}) {
  const {
    landingClearway = 90,
    tan5 = 0.05,
    tan35 = 0.035,
    tan25 = 0.025,
  } = options;
 
  if (!(distance > 0)) throw new Error("Distance must be a positive number (m).");
  if (!(inclination >= -5 && inclination < 90)) throw new Error("Inclination must be between -5 and 90 degrees.");
 
  const round = (x) => Math.round(x);
 
  // Obstacle height (E7)
  const height = distance * Math.tan(deg2rad(inclination));
 
  // ---------- Take-off: OPS C 6.1.5 ----------
  // 5% line from the top of the obstacle down to runway level.
  // If it meets the ground before the threshold, the runway end must be displaced.
  // If it meets the ground beyond the threshold, a 2.5% clearway is available
  // out to where the 2.5% line from the threshold crosses the 5% line.
  const d2 = height / tan5;                                 // N17: 5% distance to obstacle height
  const takeoffDisplacement = d2 - distance;               // C16
  const d1 = distance - d2;                                 // N18: threshold to start of OFG
  const d3 = (d1 * tan25) / (tan5 - tan25);                 // N19: overlap distance
  const d4 = distance - (d1 + d3);                          // N20: crossover to obstacle
 
  const takeoff = {
    displacementRequired: takeoffDisplacement > 0,
    displacement: Math.max(0, takeoffDisplacement),
    clearwayAvailable: takeoffDisplacement <= 0,
    clearway: takeoffDisplacement <= 0 ? d1 + d3 : 0,      // C19
    workings: { d1, d2, d3, d4 },
    message: "",
  };
  takeoff.message = takeoff.displacementRequired
    ? `Displacement required for take-off: ${round(takeoffDisplacement)} m. No clearway is available. TODA = TORA`
    : `No displacement. There is a clearway available. With the clearway TODA = TORA + ${round(takeoff.clearway)} m`;
 
  // ---------- Landing: OPS B 7.9.2 b ----------
  // 3.5% line from the top of the obstacle to the runway surface.
  const landBRaw = height / tan35 - distance;               // C25
  const landingOpsB = {
    displacementRequired: landBRaw > 0,
    displacement: Math.max(0, landBRaw),
    message: landBRaw <= 0
      ? "No displacement"
      : `Displacement required for landing. LDA = RWY Length - ${round(landBRaw)} m`,
  };
 
  // ---------- Landing: OPS C 6.1.4 ----------
  // Working backwards from the obstacle: 5% line down from the obstacle top to
  // the clearway height, then the 2.5% clearway down to runway level. Where that
  // reaches the ground is the required threshold; the clearway may therefore
  // lie partly or wholly on the runway.
  const clearwayEndHeight = tan25 * landingClearway;                              // F29
  const landCRaw = height > clearwayEndHeight
    ? (height - clearwayEndHeight) / tan5 + landingClearway - distance          // C30
    : height / tan25 - distance; // obstacle lower than clearway end: 2.5% line only
  const landingOpsC = {
    clearway: landingClearway,
    clearwayEndHeight,
    displacementRequired: landCRaw >= 0,
    displacement: Math.max(0, landCRaw),
    message: landCRaw < 0
      ? "No displacement"
      : `Displacement required for landing. LDA = RWY Length - ${round(landCRaw)} m`,
  };
 
  return { distance, inclination, height, takeoff, landingOpsB, landingOpsC };
}
 
/**
 * Several obstacles off the same threshold: returns each result plus the
 * governing (largest) displacement for each case.
 * @param {Array<{name?:string, distance:number, inclination:number}>} obstacles
 */
function calculateGoverningObstacle(obstacles, options = {}) {
  const results = obstacles.map((o) => ({
    name: o.name ?? "",
    ...calculateObstacleDisplacement(o.distance, o.inclination, options),
  }));
  const worst = (key) =>
    results.reduce((a, b) => (b[key].displacement > a[key].displacement ? b : a));
  return {
    results,
    governing: {
      takeoff: worst("takeoff"),
      landingOpsB: worst("landingOpsB"),
      landingOpsC: worst("landingOpsC"),
    },
  };
}
 
export {
  calculateObstacleDisplacement,
  calculateGoverningObstacle,
  degToPercent,
  percentToDeg,
};
 