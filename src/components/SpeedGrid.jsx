import C208B_Speeds from '../utilities/speeds.js'

// Background colour groups for the speeds: Vr20/Voc20/Vy, Vref, Vx20/Va/Vglide
const SPEED_GROUP_CLASS = {
  Vr20: 'speed-group-a',
  Voc20: 'speed-group-a',
  Vy: 'speed-group-a',
  Vref: 'speed-group-b',
  Vx20: 'speed-group-c',
  Va: 'speed-group-c',
  Vglide: 'speed-group-c',
}

// Speeds (KIAS) looked up for the given weight; `highlight` names a speed to emphasise
function SpeedGrid({ weight, speeds, highlight }) {
  return (
    <>
      <p className="verdict-speeds-title">
        Speeds (KIAS) for {weight} kg
        {speeds.weight !== weight && ` – from the ${speeds.weight} kg row`}
      </p>
      <dl className="speed-grid">
        {C208B_Speeds.speedNames.map((name) => (
          <div key={name} className={`${SPEED_GROUP_CLASS[name]}${name === highlight ? ' speed-highlight' : ''}`}>
            <dt>{name}</dt>
            <dd>
              {speeds.speeds[name]}
              {name === 'Vref' && speeds.vrefAtMlw && '*'}
            </dd>
          </div>
        ))}
      </dl>
      {speeds.vrefAtMlw && <p className="check-note">* Vref at MLW for APE III</p>}
    </>
  )
}

export default SpeedGrid
