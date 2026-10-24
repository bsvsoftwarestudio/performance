// TODA used in the take-off checks cannot be longer than TORA x 1.5
export const TODA_MAX_FACTOR = 1.5

export const usableToda = (tora, toda) => Math.min(toda, Math.floor(tora * TODA_MAX_FACTOR))
