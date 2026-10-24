import { useState } from 'react'
import SelectField from './SelectField.jsx'
import GroundRollTable from './GroundRollTable.jsx'
import CorrectionsTable from './CorrectionsTable.jsx'
import SpeedGrid from './SpeedGrid.jsx'
import SpeedTable from './SpeedTable.jsx'
import C208B_GroundRoll from '../utilities/groundroll.js'
import C208B_Corrections from '../utilities/corrections.js'
import C208B_Speeds from '../utilities/speeds.js'
import { range } from '../utilities/range.js'
import { TEMPERATURES, WINDS } from '../utilities/options.js'
import { TODA_MAX_FACTOR, usableToda as limitToda } from '../utilities/limits.js'

const WEIGHTS = [...range(3000, 4100, 25), 4111].reverse() // kg, heaviest first
const TODR_FACTOR = 1.78 // TODR = TORR x 1.78
const TODA_MARGIN = 1.15 // TODA must be at least TODR x 1.15, otherwise a Vx20 departure is required
const TODA_CHECK_CLASS = { ok: 'check--pass', vx20: 'check--caution', fail: 'check--fail' }
const VERDICT_CLASS = { ok: 'check--pass', vx20: 'check--caution', nogo: 'check--fail' }
const SURFACES = C208B_Corrections.surfaces.map((s) => ({
  value: s.id,
  label: `${s.label} (${s.percent ? `+${s.percent}` : 0}%)`,
}))
const INERTIAL_SEPARATOR = [
  { value: 'normal', label: 'Normal' },
  { value: 'bypass', label: 'Bypass (+3%)' },
]

function TakeOff({ tora, toda, pressureAltitude, slopePercent, applyWindFactors }) {
  const [weight, setWeight] = useState(4111)
  const [temperature, setTemperature] = useState(30)
  const [surface, setSurface] = useState('tarmac')
  const [wind, setWind] = useState(0)
  const [inertialSeparator, setInertialSeparator] = useState('normal')

  let result = null
  let corrections = null
  let torr = null
  let error = null
  try {
    result = C208B_GroundRoll.calculate(weight, pressureAltitude, temperature)
    corrections = C208B_Corrections.calculate({
      slopeDeg: C208B_Corrections.percentToDegrees(slopePercent),
      headwindKt: Math.max(wind, 0),
      tailwindKt: Math.max(-wind, 0),
      surface,
      inertialSeparatorBypass: inertialSeparator === 'bypass',
      applyWindFactors,
    })
    torr = corrections.apply(result.groundRoll)
  } catch (e) {
    error = e.message
  }

  // TORR must not exceed 2/3 of TORA (compared as TORR x 3 <= TORA x 2 to avoid rounding)
  const toraLimit = (tora * 2) / 3
  const torrWithinLimit = torr !== null && torr * 3 <= tora * 2
  const todr = torr !== null ? Math.ceil(torr * TODR_FACTOR) : null
  const todrWithMargin = todr * TODA_MARGIN
  // TODA used in the checks is limited to TORA x 1.5
  const usableToda = limitToda(tora, toda)
  const todaCapped = toda > usableToda
  // 'ok': TODA >= TODR x 1.15, 'vx20': TODR <= TODA < TODR x 1.15, 'fail': TODA < TODR
  // TODR x 1.15 is compared as TODR x 115 <= TODA x 100 to avoid rounding
  let todaStatus = 'fail'
  if (todr !== null && todr * 115 <= usableToda * 100) todaStatus = 'ok'
  else if (todr !== null && todr <= usableToda) todaStatus = 'vx20'

  // Overall decision: 'ok' (both checks green), 'vx20' (TORR green, TODA caution), 'nogo' otherwise
  let verdict = 'nogo'
  if (torrWithinLimit && todaStatus === 'ok') verdict = 'ok'
  else if (torrWithinLimit && todaStatus === 'vx20') verdict = 'vx20'
  const speeds = verdict === 'nogo' ? null : C208B_Speeds.lookup(weight)
  // Acceleration check point: 50% of TORR (rounded down, i.e. earlier) at 70% of Vr20 (rounded up, i.e. faster)
  const accelCheckDistance = speeds ? Math.floor(torr / 2) : null
  const accelCheckSpeed = speeds ? Math.ceil((speeds.speeds.Vr20 * 7) / 10) : null

  return (
    <section className="phase">
      <div className="input-groups input-groups--stacked">
        <fieldset className="input-group input-group--aircraft">
          <legend>Aircraft details</legend>
          <div className="fields fields--pair">
            <SelectField
              id="takeoff-weight"
              label="Take-off weight"
              unit="kg"
              value={weight}
              options={WEIGHTS}
              onChange={setWeight}
            />
            <SelectField
              id="takeoff-inertial-separator"
              label="Inertial separator"
              value={inertialSeparator}
              options={INERTIAL_SEPARATOR}
              onChange={setInertialSeparator}
            />
          </div>
        </fieldset>

        <fieldset className="input-group input-group--conditions">
          <legend>Take-off conditions</legend>
          <div className="fields fields--pair">
            <SelectField
              id="takeoff-oat"
              label="OAT"
              unit="°C"
              value={temperature}
              options={TEMPERATURES}
              onChange={setTemperature}
            />
            <SelectField
              id="takeoff-wind"
              label={applyWindFactors ? 'Wind (reported)' : 'Wind (actual)'}
              value={wind}
              options={WINDS}
              onChange={setWind}
            />
            <SelectField id="takeoff-surface" label="Surface" value={surface} options={SURFACES} onChange={setSurface} />
          </div>
        </fieldset>
      </div>

      {error ? (
        <div className="check check--fail" role="alert">
          <p className="check-status">{error}</p>
        </div>
      ) : (
        <>
          <div className={`check ${torrWithinLimit ? 'check--pass' : 'check--fail'}`} aria-live="polite">
            <dl className="check-figures">
              <div>
                <dt>Ground roll (table)</dt>
                <dd>{result.groundRoll} m</dd>
              </div>
              <div>
                <dt>Correction factor</dt>
                <dd>× {corrections.factor.toFixed(3)}</dd>
              </div>
              <div>
                <dt>Take-off run required (TORR)</dt>
                <dd>{torr} m</dd>
                <dd className="check-formula">TORR = ground roll × correction factor</dd>
              </div>
              <div>
                <dt>TORA × 2/3</dt>
                <dd>{Math.floor(toraLimit)} m</dd>
              </div>
            </dl>
            {torrWithinLimit ? (
              <p className="check-status">TORR is within 2/3 of TORA</p>
            ) : (
              <p className="check-status" role="alert">
                Warning: TORR ({torr} m) is greater than 2/3 × TORA ({Math.floor(toraLimit)} m).
                Take-off run required exceeds the limit.
              </p>
            )}
            {corrections.components.length > 0 && (
              <ul className="check-breakdown">
                {corrections.components.map((c) => (
                  <li key={c.id}>
                    {c.label}: {c.id === 'slope' && `${Math.abs(slopePercent)}% chart = `}
                    {c.detail} = × {c.factor.toFixed(3)}
                  </li>
                ))}
              </ul>
            )}
            {result.warnings.map((warning) => (
              <p key={warning} className="check-note">{warning}</p>
            ))}
          </div>

          <div className={`check ${TODA_CHECK_CLASS[todaStatus]}`} aria-live="polite">
            <dl className="check-figures">
              <div>
                <dt>Take-off distance required (TODR)</dt>
                <dd>{todr} m</dd>
                <dd className="check-formula">TODR = TORR × {TODR_FACTOR}</dd>
              </div>
              <div>
                <dt>TODR × {TODA_MARGIN}</dt>
                <dd>{Math.ceil(todrWithMargin)} m</dd>
              </div>
              <div>
                <dt>{todaCapped ? 'TODA (limited)' : 'TODA'}</dt>
                <dd>{usableToda} m</dd>
                {todaCapped && (
                  <dd className="check-formula">
                    TORA × {TODA_MAX_FACTOR} (selected {toda} m)
                  </dd>
                )}
              </div>
            </dl>
            {todaStatus === 'ok' && (
              <p className="check-status">TODA is at least TODR × {TODA_MARGIN}</p>
            )}
            {todaStatus === 'vx20' && (
              <p className="check-status">
                Caution: TODA ({usableToda} m) is at least TODR ({todr} m) but less than TODR × {TODA_MARGIN} (
                {Math.ceil(todrWithMargin)} m).
              </p>
            )}
            {todaStatus === 'fail' && (
              <p className="check-status" role="alert">
                Warning: TODA ({usableToda} m) is less than TODR ({todr} m). Take-off distance required exceeds the
                distance available.
              </p>
            )}
          </div>

          <div className={`check verdict ${VERDICT_CLASS[verdict]}`} role="status" aria-live="polite">
            {verdict === 'ok' && <p className="verdict-title">Take-off OK</p>}
            {verdict === 'vx20' && (
              <>
                <p className="verdict-title">Take-off OK – conditions apply</p>
                <p className="check-emphasis">A Vx20 departure is required.</p>
                <p className="check-status">Confirm aircraft climb gradient meets obstacle clearance requirements.</p>
              </>
            )}
            {verdict === 'nogo' && (
              <>
                <p className="verdict-title">Do not take off</p>
                <p className="check-status">Performance requirements not met:</p>
                <ul className="check-breakdown">
                  {!torrWithinLimit && <li>TORR is greater than 2/3 × TORA</li>}
                  {todaStatus === 'fail' && <li>TODR is greater than TODA</li>}
                </ul>
              </>
            )}

            {speeds && (
              <div className="verdict-speeds">
                <SpeedGrid weight={weight} speeds={speeds} highlight={verdict === 'vx20' ? 'Vx20' : undefined} />

                <div className="accel-check">
                  <p className="accel-check-title">Acceleration check point</p>
                  <p className="accel-check-text">
                    <strong>ACP:</strong>
                    <strong>{accelCheckDistance}m</strong>
                    <strong>{accelCheckSpeed}kts</strong>
                  </p>
                  <p className="check-formula">
                    50% of TORR ({torr} m) · 70% of Vr20 ({speeds.speeds.Vr20} KIAS)
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <details className="reference-section">
        <summary>Speed table (reference)</summary>
        <SpeedTable />
      </details>
      <details className="reference-section">
        <summary>Ground roll table (reference)</summary>
        <GroundRollTable />
      </details>
      <details className="reference-section">
        <summary>Take-off correction factors (reference)</summary>
        <CorrectionsTable applyWindFactors={applyWindFactors} />
      </details>
    </section>
  )
}

export default TakeOff
