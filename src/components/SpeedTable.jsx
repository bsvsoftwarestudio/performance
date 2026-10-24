import C208B_Speeds from '../utilities/speeds.js'

const { speedNames, rows } = C208B_Speeds
// Column groups as coloured in the printed table
const TAKEOFF_CLIMB = ['Vr20', 'Voc20', 'Vy', 'Vref']

function SpeedTable() {
  return (
    <div className="reference">
      <p className="reference-note">
        Reference only. Source: MAF Cockpit Printables – C208B – UGA (Jul 2023), page 2. Speeds in KIAS.
      </p>

      <div className="reference-table-wrap">
        <table className="reference-table speed-table">
          <thead>
            <tr>
              <th scope="col" className="col-speed-weight">
                Weight kg
              </th>
              {speedNames.map((name) => (
                <th
                  key={name}
                  scope="col"
                  className={TAKEOFF_CLIMB.includes(name) ? 'col-speed-a' : 'col-speed-b'}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.weight}>
                <th scope="row" className="col-speed-weight">
                  {row.weight}
                </th>
                {speedNames.map((name) => (
                  <td key={name}>
                    {row[name]}
                    {name === 'Vref' && row.vrefAtMlw && '*'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="reference-footnote">* Indicates Vref at MLW for APE III</p>
      <p className="reference-revision">Revision 2 – November 2019</p>
    </div>
  )
}

export default SpeedTable
