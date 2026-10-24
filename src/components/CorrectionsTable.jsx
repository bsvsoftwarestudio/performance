import C208B_Corrections from '../utilities/corrections.js'

const percent = (fraction) => {
  const value = Number((fraction * 100).toFixed(1))
  return value === 0 ? '0%' : `${value > 0 ? '+' : '−'} ${Math.abs(value)}%`
}

// Rows built from the same values the calculation uses, grouped as in the printed table
const GROUPS = [
  [
    { label: 'Every 1° upslope', value: percent(C208B_Corrections.upslopePerDeg) },
    { label: 'Every 1° downslope', value: percent(C208B_Corrections.downslopePerDeg) },
    { label: 'Each 1 kt headwind', value: percent(C208B_Corrections.headwindPerKt) },
    { label: 'Each 1 kt tailwind', value: percent(C208B_Corrections.tailwindPerKt) },
  ],
  C208B_Corrections.surfaces.map((s) => ({ label: s.label, value: percent(s.percent / 100) })),
  [{ label: 'Inertial separator in bypass *', value: percent(C208B_Corrections.inertialSeparatorBypass) }],
]

function CorrectionsTable({ applyWindFactors = true }) {
  return (
    <div className="reference">
      <p className="reference-note">
        Reference only. Source: MAF Cockpit Printables – C208B – UGA (Jul 2023), page 6.
      </p>

      <div className="reference-table-wrap corrections-table-wrap">
        <table className="reference-table corrections-table">
          <caption>Take-off Correction Factors C208B</caption>
          {GROUPS.map((group) => (
            <tbody key={group[0].label}>
              {group.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>

      <p className="reference-footnote">
        * With take-off power set below the torque limit of 1865 ft-lbs increase both TORR and TODR by 3% with
        inertial separator in bypass.
      </p>
      <p className="reference-revision">Revision 2 – November 2019</p>

      <ul className="reference-app-notes">
        <li>Corrections are multiplied together and applied to the chart ground roll to give TORR.</li>
        <li>
          {applyWindFactors ? (
            <>
              This app uses {C208B_Corrections.headwindFactor * 100}% of the reported headwind and{' '}
              {C208B_Corrections.tailwindFactor * 100}% of the reported tailwind (SOP wind factors on).
            </>
          ) : (
            <>This app uses 100% of the reported headwind or tailwind (SOP wind factors off).</>
          )}
        </li>
        <li>Airstrip chart slope in % is converted to degrees before the slope correction is applied.</li>
        <li>The inertial separator +3% is applied whenever bypass is selected.</li>
      </ul>
    </div>
  )
}

export default CorrectionsTable
