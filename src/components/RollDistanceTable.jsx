// Reference table for a roll distance chart (weight x pressure altitude x temperature),
// split into two side-by-side tables as in the printed charts
function RollDistanceTable({ data, note, revision }) {
  const { weights, pressureAltitudes, temperatures, table } = data
  const half = Math.ceil(weights.length / 2)
  const weightGroups = [weights.slice(0, half), weights.slice(half)]

  return (
    <div className="reference">
      <p className="reference-note">{note}</p>

      <div className="reference-tables">
        {weightGroups.map((group) => (
          <div key={group[0]} className="reference-table-wrap">
            <table className="reference-table">
              <caption>
                Weights {group[0]} – {group[group.length - 1]} kg
              </caption>
              <thead>
                <tr>
                  <th rowSpan={2} scope="col" className="col-weight">
                    Weight [kg]
                  </th>
                  <th rowSpan={2} scope="col" className="col-pa">
                    PA [ft]
                  </th>
                  <th colSpan={temperatures.length} scope="colgroup" className="col-temp">
                    Temp
                  </th>
                </tr>
                <tr>
                  {temperatures.map((t) => (
                    <th key={t} scope="col" className="col-temp">
                      {t}°C
                    </th>
                  ))}
                </tr>
              </thead>
              {group.map((weight) => (
                <tbody key={weight}>
                  {pressureAltitudes.map((pa, paIndex) => (
                    <tr key={pa}>
                      {paIndex === 0 && (
                        <th rowSpan={pressureAltitudes.length} scope="rowgroup" className="col-weight">
                          {weight}
                        </th>
                      )}
                      <th scope="row" className="col-pa">
                        {pa}
                      </th>
                      {table[weight][paIndex].map((distance, tIndex) => (
                        <td key={temperatures[tIndex]}>{distance}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        ))}
      </div>

      {revision && <p className="reference-revision">{revision}</p>}
    </div>
  )
}

export default RollDistanceTable
