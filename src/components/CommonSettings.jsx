import SelectField from './SelectField.jsx'
import { PRESSURE_ALTITUDES, RUNWAY_DISTANCES, SLOPES } from '../utilities/options.js'
import { TODA_MAX_FACTOR, usableToda } from '../utilities/limits.js'

// Airstrip and conditions shared by the take-off and landing tabs, shown under the tab bar; `onChange(key)` returns the setter for that setting
function CommonSettings({ settings, onChange }) {
  const { tora, toda, lda, pressureAltitude, slopePercent } = settings
  const todaLimit = usableToda(tora, toda)

  return (
    <section className="common-settings" aria-label="Common settings">
      <div className="input-groups">
        <fieldset className="input-group input-group--dimensions">
          <legend>Airstrip lengths</legend>
          <div className="fields">
            <SelectField
              id="common-tora"
              label="Take-off run available (TORA)"
              unit="m"
              value={tora}
              options={RUNWAY_DISTANCES}
              onChange={onChange('tora')}
            />
            <SelectField
              id="common-toda"
              label="Take-off distance available (TODA)"
              unit="m"
              value={toda}
              options={RUNWAY_DISTANCES}
              onChange={onChange('toda')}
            />
            <SelectField
              id="common-lda"
              label="Landing distance available (LDA)"
              unit="m"
              value={lda}
              options={RUNWAY_DISTANCES}
              onChange={onChange('lda')}
            />
          </div>
          {toda < tora && (
            <p className="field-warning" role="alert">
              TODA ({toda} m) is shorter than TORA ({tora} m). TODA should be equal to or longer than TORA.
            </p>
          )}
          {toda > todaLimit && (
            <p className="field-warning" role="alert">
              TODA ({toda} m) is longer than TORA × {TODA_MAX_FACTOR} ({todaLimit} m). {todaLimit} m is used as the
              TODA in the take-off calculations.
            </p>
          )}
        </fieldset>

        <fieldset className="input-group input-group--environment">
          <legend>Airstrip details</legend>
          <div className="fields">
            <SelectField
              id="common-pa"
              label="Pressure altitude"
              unit="ft"
              value={pressureAltitude}
              options={PRESSURE_ALTITUDES}
              onChange={onChange('pressureAltitude')}
            />
            <SelectField
              id="common-slope"
              label="Slope"
              value={slopePercent}
              options={SLOPES}
              onChange={onChange('slopePercent')}
            />
          </div>
        </fieldset>
      </div>
    </section>
  )
}

export default CommonSettings
