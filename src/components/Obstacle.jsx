import { useState } from 'react'
import SelectField from './SelectField.jsx'
import { calculateObstacleDisplacement } from '../utilities/obstacleCalculator.js'
import { OBSTACLE_DISTANCES, OBSTACLE_INCLINATIONS } from '../utilities/options.js'
import { TODA_MAX_FACTOR, usableToda } from '../utilities/limits.js'

const round = (m) => Math.round(m)

// Card colour: red when the obstacle uses up the whole runway, amber when a displacement is needed, otherwise green
const cardClass = (remaining, displaced) => {
  if (remaining <= 0) return 'check--fail'
  return displaced ? 'check--caution' : 'check--pass'
}

// Resulting declared distances as coloured blocks, like the speeds on the other tabs
function DistanceGrid({ distances }) {
  return (
    <dl className="distance-grid">
      {distances.map(({ id, label, value, formula }) => (
        <div key={id} className={`distance-${id}`}>
          <dt>{label}</dt>
          <dd>{value} m</dd>
          {formula && <dd className="distance-formula">{formula}</dd>}
        </div>
      ))}
    </dl>
  )
}

// Landing displacement card; the runway length is the LDA from the common settings
function LandingCard({ title, rule, displacement, lda }) {
  const displaced = displacement > 0
  const remaining = lda - round(displacement)
  return (
    <div className={`check ${cardClass(remaining, displaced)}`} aria-live="polite">
      <p className="check-title">{title}</p>
      <p className="check-note obstacle-rule">{rule}</p>
      {displaced ? (
        <div className="displacement-box">
          <p className="displacement-box-label">Displacement required</p>
          <p className="displacement-box-value">{round(displacement)} m</p>
        </div>
      ) : (
        <dl className="check-figures">
          <div>
            <dt>Displacement</dt>
            <dd>None</dd>
          </div>
        </dl>
      )}
      {remaining <= 0 ? (
        <p className="check-status" role="alert">
          Warning: the displacement is longer than the runway ({lda} m).
        </p>
      ) : (
        <>
          <p className="check-status">
            {displaced ? 'Displacement required for landing.' : 'No displacement required for landing.'}
          </p>
          <DistanceGrid
            distances={[
              {
                id: 'lda',
                label: 'LDA',
                value: remaining,
                formula: displaced ? `${lda} m − ${round(displacement)} m` : null,
              },
            ]}
          />
        </>
      )}
    </div>
  )
}

function Obstacle({ tora, lda }) {
  const [distance, setDistance] = useState(400)
  const [inclination, setInclination] = useState(1)

  let result = null
  let error = null
  try {
    result = calculateObstacleDisplacement(distance, inclination)
  } catch (e) {
    error = e.message
  }

  const takeoff = result?.takeoff
  const takeoffDisplacement = takeoff ? round(takeoff.displacement) : null
  const takeoffClearway = takeoff ? round(takeoff.clearway) : null
  // Displaced: TORA shortened and TODA = TORA (no clearway). Otherwise TORA unchanged and TODA = TORA + clearway
  const obstacleTora = takeoff ? tora - takeoffDisplacement : null
  // TODA with the clearway is limited to TORA x 1.5
  const unlimitedToda = takeoff ? obstacleTora + takeoffClearway : null
  const obstacleToda = takeoff ? usableToda(obstacleTora, unlimitedToda) : null
  const todaLimited = takeoff && obstacleToda < unlimitedToda

  return (
    <section className="phase">
      <fieldset className="input-group input-group--conditions">
        <legend>Obstacle</legend>
        <div className="fields fields--pair">
          <SelectField
            id="obstacle-distance"
            label="Distance from threshold"
            unit="m"
            value={distance}
            options={OBSTACLE_DISTANCES}
            onChange={setDistance}
          />
          <SelectField
            id="obstacle-inclination"
            label="Inclination to top of obstacle"
            value={inclination}
            options={OBSTACLE_INCLINATIONS}
            onChange={setInclination}
          />
        </div>
        <p className="check-note">
          Runway lengths are taken from the airstrip dimensions
        </p>
      </fieldset>

      {error ? (
        <div className="check check--fail" role="alert">
          <p className="check-status">{error}</p>
        </div>
      ) : (
        <>
          <h3 className="obstacle-heading">Take-off</h3>
          <p className="check-note">OPS B 7.4.3.1: still a work in progress.</p>

          <div className={`check ${cardClass(obstacleTora, takeoff.displacementRequired)}`} aria-live="polite">
            <p className="check-title">OPS C 6.1.5</p>
            <p className="check-note obstacle-rule">
              5% line from the top of the obstacle, then a 2.5% clearway (90m) if available.
            </p>
            {takeoff.displacementRequired ? (
              <div className="displacement-box">
                <p className="displacement-box-label">Reduction in Length Required</p>
                <p className="displacement-box-value">{takeoffDisplacement} m</p>
              </div>
            ) : (
              <dl className="check-figures">
                <div>
                  <dt>Reduction</dt>
                  <dd>None</dd>
                </div>
                <div>
                  <dt>Clearway</dt>
                  <dd>{takeoffClearway} m</dd>
                </div>
              </dl>
            )}
            {obstacleTora <= 0 ? (
              <p className="check-status" role="alert">
                Warning: the reduction is longer than the runway ({tora} m).
              </p>
            ) : (
              <>
                <p className="check-status">
                  {takeoff.displacementRequired
                    ? 'Reduction in length required for take-off. No clearway is available.'
                    : 'No reduction in length required for take-off. A clearway is available.'}
                </p>
                <DistanceGrid
                  distances={[
                    {
                      id: 'tora',
                      label: 'TORA',
                      value: obstacleTora,
                      formula: takeoff.displacementRequired ? `${tora} m − ${takeoffDisplacement} m` : null,
                    },
                    {
                      id: 'toda',
                      label: 'TODA',
                      value: obstacleToda,
                      formula: takeoff.displacementRequired
                        ? 'TODA = TORA'
                        : todaLimited
                          ? `Limit ${TODA_MAX_FACTOR} × ${obstacleTora} m`
                          : `${obstacleTora} m + ${takeoffClearway} m`,
                    },
                  ]}
                />
              </>
            )}
          </div>

          <h3 className="obstacle-heading">Landing</h3>
          <LandingCard
            title="OPS B 7.9.2 b"
            rule="3.5% line from the top of the obstacle to the runway surface."
            displacement={result.landingOpsB.displacement}
            lda={lda}
          />
          <LandingCard
            title="OPS C 6.1.4"
            rule="5% line from the top of the obstacle to the end of the clearway (at 2.5%), then adding in the 90m clearway."
            displacement={result.landingOpsC.displacement}
            lda={lda}
          />
        </>
      )}
    </section>
  )
}

export default Obstacle
