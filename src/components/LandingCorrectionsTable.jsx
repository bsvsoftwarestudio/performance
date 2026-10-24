import C208B_LandingCorrections from '../utilities/landingcorrections.js'

const percent = (fraction) => {
  const value = Number((fraction * 100).toFixed(1))
  return value === 0 ? '0%' : `${value > 0 ? '+' : '−'} ${Math.abs(value)}%`
}

// Slope and wind rows, built from the same values the calculation uses
const SLOPE_WIND = [
  { label: 'Every 1° upslope', value: percent(C208B_LandingCorrections.upslopePerDeg) },
  { label: 'Every 1° downslope', value: percent(C208B_LandingCorrections.downslopePerDeg) },
  { label: 'Each 1 kt headwind', value: percent(C208B_LandingCorrections.headwindPerKt) },
  { label: 'Each 1 kt tailwind', value: percent(C208B_LandingCorrections.tailwindPerKt) },
]

function LandingCorrectionsTable({ applyWindFactors = true }) {
  return (
    <div className="reference">
      <p className="reference-note">Reference only. Source: Airstrip Correction Factors for Landing card.</p>

      <div className="reference-table-wrap corrections-table-wrap">
        <table className="reference-table corrections-table">
          <caption>Landing Correction Factors C208B</caption>
          <tbody>
            {SLOPE_WIND.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td colSpan={2}>{row.value}</td>
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr className="corrections-subhead">
              <th scope="col">Surface type</th>
              <th scope="col">Dry</th>
              <th scope="col">Wet</th>
            </tr>
            {C208B_LandingCorrections.surfaces.map((s) => (
              <tr key={s.id}>
                <th scope="row">{C208B_LandingCorrections.surfaceName(s)}</th>
                <td>{percent(s.dry / 100)}</td>
                <td>{percent(s.wet / 100)}</td>
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr>
              <th scope="row">Maximum reverse</th>
              <td colSpan={2}>{percent(C208B_LandingCorrections.maximumReverse)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="reference-revision">Table Revision 3 – April 2022</p>

      <ul className="reference-app-notes">
        <li>Corrections are multiplied together and applied equally to the chart landing roll and landing distance.</li>
        <li>
          {applyWindFactors ? (
            <>
              This app uses {C208B_LandingCorrections.headwindFactor * 100}% of the reported headwind and{' '}
              {C208B_LandingCorrections.tailwindFactor * 100}% of the reported tailwind (SOP wind factors on).
            </>
          ) : (
            <>This app uses 100% of the reported headwind or tailwind (SOP wind factors off).</>
          )}
        </li>
        <li>Slope works the opposite way to take-off: upslope shortens the landing, downslope lengthens it.</li>
        <li>Airstrip chart slope in % is converted to degrees before the slope correction is applied.</li>
      </ul>
    </div>
  )
}

export default LandingCorrectionsTable
