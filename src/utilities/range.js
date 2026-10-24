// Inclusive list of numbers from start to end in the given step
export function range(start, end, step) {
  const values = []
  for (let v = start; v <= end; v += step) values.push(v)
  return values
}
