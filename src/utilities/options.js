import C208B_Corrections from './corrections.js'
import { range } from './range.js'
import { degToPercent } from './obstacleCalculator.js'

// Dropdown options shared by the take-off and landing inputs
export const PRESSURE_ALTITUDES = range(0, 8000, 100).reverse() // ft
export const TEMPERATURES = range(10, 40, 1).reverse() // deg C
export const RUNWAY_DISTANCES = [...range(400, 1280, 20), ...range(1300, 2900, 100), ...range(3000, 4000, 200)].reverse() // m
// Slope as reported on airstrip charts, in percent: + upslope, - downslope
export const SLOPES = range(-6, 6, 0.5).map((pct) => {
  const deg = C208B_Corrections.percentToDegrees(Math.abs(pct)).toFixed(2)
  return {
    value: pct,
    label: pct === 0 ? 'Level' : `${Math.abs(pct)}% ${pct > 0 ? 'up' : 'down'} (${deg}°)`,
  }
}).reverse()
// Reported wind component in kt: + headwind, - tailwind
export const WINDS = range(-20, 30, 1).map((kt) => ({
  value: kt,
  label: kt === 0 ? 'Calm' : `${Math.abs(kt)} kt ${kt > 0 ? 'headwind' : 'tailwind'}`,
}))
// Obstacle inclination from the threshold in deg, -2 to 8 in 0.1 steps (built from integers to avoid float drift)
export const OBSTACLE_INCLINATIONS = range(-20, 80, 1).map((n) => {
  const deg = n / 10
  return { value: deg, label: `${deg.toFixed(1)}° (${degToPercent(deg).toFixed(1)}%)` }
}).reverse()
export const OBSTACLE_DISTANCES = range(20, 800, 10).reverse() // m from the threshold
