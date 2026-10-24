// options can be plain numbers (shown with the unit) or { value, label } objects
function SelectField({ id, label, unit, value, options, onChange }) {
  const normalised = options.map((option) =>
    typeof option === 'object' ? option : { value: option, label: unit ? `${option} ${unit}` : String(option) },
  )

  const handleChange = (e) => {
    const selected = normalised.find((option) => String(option.value) === e.target.value)
    if (selected) onChange(selected.value)
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={handleChange}>
        {normalised.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default SelectField
