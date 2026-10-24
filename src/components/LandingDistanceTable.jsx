import RollDistanceTable from './RollDistanceTable.jsx'
import C208B_LandingDistance from '../utilities/landingdistance.js'

function LandingDistanceTable() {
  return (
    <RollDistanceTable
      data={C208B_LandingDistance}
      note="Reference only. Source: C208B APE III Short-Field Landing table. Values are uncorrected landing distance from 50 ft (flaps 30°, paved level dry runway, zero wind). 3100 and 3000 kg use the lightest published weight (3175 kg)."
    />
  )
}

export default LandingDistanceTable
