import { useState } from 'react'
import SelectField from './SelectField.jsx'
import LandingRollTable from './LandingRollTable.jsx'
import LandingDistanceTable from './LandingDistanceTable.jsx'
import SpeedGrid from './SpeedGrid.jsx'
import LandingCorrectionsTable from './LandingCorrectionsTable.jsx'
import SpeedTable from './SpeedTable.jsx'
import C208B_LandingRoll from '../utilities/landingroll.js'
import C208B_LandingDistance from '../utilities/landingdistance.js'
import C208B_LandingCorrections from '../utilities/landingcorrections.js'
import C208B_Speeds from '../utilities/speeds.js'
import { range } from '../utilities/range.js'
import { TEMPERATURES, WINDS } from '../utilities/options.js'

const WEIGHTS = [...range(3000, 4075, 25), 4082].reverse() // kg, heaviest first (MLW 4082 kg)
// Surface options show the dry or wet correction, whichever is selected
const surfaceOptions = (wet) =>
  C208B_LandingCorrections.surfaces.map((s) => {
    const pct = wet ? s.wet : s.dry
    return { value: s.id, label: `${C208B_LandingCorrections.surfaceName(s)} (${pct ? `+${pct}` : 0}%)` }
  })
const TOUCHDOWN_OFFSET = 25 // m into the airstrip for the touchdown check
const REVERSE_THRUST = [
  { value: 'beta', label: 'Beta only' },
  { value: 'full', label: 'Full reverse (−10%)' },
]

function Landing({ lda, pressureAltitude, slopePercent, applyWindFactors }) {
  const [weight, setWeight] = useState(4082)
  const [temperature, setTemperature] = useState(30)
  const [surface, setSurface] = useState('tarmac')
  const [wet, setWet] = useState(false)
  const [wind, setWind] = useState(0)
  const [reverseThrust, setReverseThrust] = useState('beta')
  const [displacedThreshold, setDisplacedThreshold] = useState(false)

  let landingRoll = null
  let landingDistance = null
  let corrections = null
  let error = null
  try {
    landingRoll = C208B_LandingRoll.calculate(weight, pressureAltitude, temperature)
    landingDistance = C208B_LandingDistance.calculate(weight, pressureAltitude, temperature)
    corrections = C208B_LandingCorrections.calculate({
      slopeDeg: C208B_LandingCorrections.percentToDegrees(slopePercent),
      headwindKt: Math.max(wind, 0),
      tailwindKt: Math.max(-wind, 0),
      surface,
      wet,
      maximumReverse: reverseThrust === 'full',
      applyWindFactors,
    })
  } catch (e) {
    error = e.message
  }

  // Each required distance must not exceed 70% of LDA (compared as required x 10 <= LDA x 7 to avoid rounding)
  const ldaLimit = Math.floor((lda * 7) / 10)
  // The same correction factor applies to both the landing roll and the landing distance
  const factor = corrections ? corrections.factor.toFixed(3) : null
  const roll = corrections ? corrections.apply(landingRoll.landingRoll) : null
  const distance = corrections ? corrections.apply(landingDistance.landingDistance) : null
  const checks = error
    ? []
    : [
        {
          id: 'normal',
          title: 'Normal landing',
          tableLabel: 'Landing distance (table)',
          table: landingDistance.landingDistance,
          label: 'Landing distance from 50 ft',
          required: distance,
          formula: 'Landing distance × correction factor',
          verdict: {
            className: 'check--pass',
            title: 'Landing OK',
            notes: ['No declared safe approach area required.'],
          },
        },
        // Declared safe area: touchdown at the displaced threshold (start of the LDA) when the
        // airstrip has close-in obstacles, otherwise touchdown TOUCHDOWN_OFFSET m into the airstrip
        {
          id: 'safeArea',
          title: displacedThreshold
            ? 'Landing over close obstacles with displaced threshold'
            : 'Landing with declared safe area',
          caution: true,
          ...(displacedThreshold
            ? {
                tableLabel: 'Landing roll (table)',
                table: landingRoll.landingRoll,
                label: 'Landing roll',
                required: roll,
                formula: 'Landing roll × correction factor',
              }
            : {
                tableLabel: 'Landing roll (table)',
                table: landingRoll.landingRoll,
                label: `Landing roll + ${TOUCHDOWN_OFFSET} m`,
                required: roll + TOUCHDOWN_OFFSET,
                formula: `Landing roll × correction factor (${roll} m) + ${TOUCHDOWN_OFFSET} m`,
              }),
          verdict: {
            className: 'check--caution',
            title: 'Landing OK – conditions apply',
            emphasis: displacedThreshold ? (
              <>
                <span className="check-highlight">Runway has a displaced threshold.</span> Touch down at the displaced
                threshold.
              </>
            ) : (
              <>
                <span className="check-highlight">A declared safe area is required.</span> Touch down {TOUCHDOWN_OFFSET}m
                from the threshold.
              </>
            ),
            notes: [],
          },
        },
      ].map((check) => ({ ...check, ok: check.required * 10 <= lda * 7 }))
  // Checks are worked through in order and stop at the first one that passes
  const firstPass = checks.findIndex((check) => check.ok)
  const shownChecks = firstPass === -1 ? checks : checks.slice(0, firstPass + 1)
  const verdict = checks[firstPass]?.verdict ?? null
  const speeds = verdict ? C208B_Speeds.lookup(weight) : null

  return (
    <section className="phase">
      <div className="input-groups input-groups--stacked">
        <fieldset className="input-group input-group--aircraft">
          <legend>Aircraft details</legend>
          <div className="fields fields--pair">
            <SelectField
              id="landing-weight"
              label="Landing weight"
              unit="kg"
              value={weight}
              options={WEIGHTS}
              onChange={setWeight}
            />
            <SelectField
              id="landing-reverse-thrust"
              label="Reverse thrust"
              value={reverseThrust}
              options={REVERSE_THRUST}
              onChange={setReverseThrust}
            />
          </div>
        </fieldset>

        <fieldset className="input-group input-group--conditions">
          <legend>Landing conditions</legend>
          <div className="fields fields--pair">
            <SelectField
              id="landing-oat"
              label="OAT"
              unit="°C"
              value={temperature}
              options={TEMPERATURES}
              onChange={setTemperature}
            />
            <SelectField
              id="landing-wind"
              label={applyWindFactors ? 'Wind (reported)' : 'Wind (actual)'}
              value={wind}
              options={WINDS}
              onChange={setWind}
            />
            <SelectField
              id="landing-surface"
              label={`Surface (${wet ? 'wet' : 'dry'})`}
              value={surface}
              options={surfaceOptions(wet)}
              onChange={setSurface}
            />
            {/* Beside the surface dropdown: the wet switch on the label line, the threshold switch level with the dropdown */}
            <div className="toggle-stack">
              <label className="toggle toggle--field">
                <input type="checkbox" role="switch" checked={wet} onChange={(e) => setWet(e.target.checked)} />
                <span className="toggle-control">
                  <span className="toggle-title">Surface wet</span>
                  <span className="toggle-track" aria-hidden="true" />
                </span>
              </label>
              <label className="toggle toggle--field">
                <input
                  type="checkbox"
                  role="switch"
                  checked={displacedThreshold}
                  onChange={(e) => setDisplacedThreshold(e.target.checked)}
                />
                <span className="toggle-control">
                  <span className="toggle-title">Airstrip has displaced threshold with close in obstacles</span>
                  <span className="toggle-track" aria-hidden="true" />
                </span>
              </label>
            </div>
          </div>
        </fieldset>
      </div>

      {error ? (
        <div className="check check--fail" role="alert">
          <p className="check-status">{error}</p>
        </div>
      ) : (
        shownChecks.map((check) => (
          <div key={check.id} className={`check ${!check.ok ? 'check--fail' : check.caution ? 'check--caution' : 'check--pass'}`} aria-live="polite">
            <p className="check-title">{check.title}</p>
            <dl className="check-figures check-figures--columns">
              <div>
                <dt>{check.tableLabel}</dt>
                <dd>{check.table} m</dd>
              </div>
              <div>
                <dt>Correction factor</dt>
                <dd>× {factor}</dd>
              </div>
              <div>
                <dt>{check.label}</dt>
                <dd>{check.required} m</dd>
                <dd className="check-formula">{check.formula}</dd>
              </div>
              <div>
                <dt>LDA × 70%</dt>
                <dd>{ldaLimit} m</dd>
              </div>
            </dl>
            {check.ok ? (
              <p className="check-status">{check.label} is within 70% of LDA</p>
            ) : (
              <p className="check-status" role="alert">
                Warning: {check.label.toLowerCase()} ({check.required} m) is greater than 70% of LDA ({ldaLimit} m).
              </p>
            )}
            {check.id === 'normal' && corrections.components.length > 0 && (
              <ul className="check-breakdown">
                {corrections.components.map((c) => (
                  <li key={c.id}>
                    {c.label}: {c.id === 'slope' && `${Math.abs(slopePercent)}% chart = `}
                    {c.detail} = × {c.factor.toFixed(3)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
      {verdict && (
        <div className={`check verdict ${verdict.className}`} role="status" aria-live="polite">
          <p className="verdict-title">{verdict.title}</p>
          {verdict.emphasis && <p className="check-emphasis">{verdict.emphasis}</p>}
          {verdict.notes.map((note) => (
            <p key={note} className="check-status">{note}</p>
          ))}
          <div className="verdict-speeds">
            <SpeedGrid weight={weight} speeds={speeds} />
          </div>
        </div>
      )}
      {!error &&
        [...new Set([...landingRoll.warnings, ...landingDistance.warnings])].map((warning) => (
          <p key={warning} className="check-note">{warning}</p>
        ))}

      <details className="reference-section">
        <summary>Speed table (reference)</summary>
        <SpeedTable />
      </details>

      <details className="reference-section">
        <summary>Landing roll table (reference)</summary>
        <LandingRollTable />
      </details>

      <details className="reference-section">
        <summary>Landing distance from 50 ft table (reference)</summary>
        <LandingDistanceTable />
      </details>

      <details className="reference-section">
        <summary>Landing correction factors (reference)</summary>
        <LandingCorrectionsTable applyWindFactors={applyWindFactors} />
      </details>
    </section>
  )
}

export default Landing
