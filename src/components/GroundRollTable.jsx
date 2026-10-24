import RollDistanceTable from './RollDistanceTable.jsx'
import C208B_GroundRoll from '../utilities/groundroll.js'

function GroundRollTable() {
  return (
    <RollDistanceTable
      data={C208B_GroundRoll}
      note="Reference only. Source: MAF Cockpit Printables – C208B – UGA (Jul 2023), page 5. Values are uncorrected ground roll; apply airstrip correction factors separately."
      revision="Revision 1 – May 2016"
    />
  )
}

export default GroundRollTable
