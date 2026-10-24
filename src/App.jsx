import { useState } from 'react'
import TakeOff from './components/TakeOff.jsx'
import Landing from './components/Landing.jsx'
import Obstacle from './components/Obstacle.jsx'
import CommonSettings from './components/CommonSettings.jsx'
import './App.css'

const TABS = [
  { id: 'takeoff', label: 'Take-off', Component: TakeOff },
  { id: 'landing', label: 'Landing', Component: Landing },
  { id: 'obstacle', label: 'Obstacles', Component: Obstacle },
]

const DEFAULT_SETTINGS = {
  tora: 1000,
  toda: 1000,
  lda: 1000,
  pressureAltitude: 3500,
  slopePercent: 0,
  // Actual wind by default; the SOP wind factors (50% headwind / 150% tailwind) can be switched on, but the charts already allow for wind
  applyWindFactors: false,
}

function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  // Settings shared by all tabs
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const updateSetting = (key) => (value) => setSettings((current) => ({ ...current, [key]: value }))

  const handleKeyDown = (event) => {
    const index = TABS.findIndex((tab) => tab.id === activeTab)
    let next
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else return
    event.preventDefault()
    setActiveTab(TABS[next].id)
    document.getElementById(`tab-${TABS[next].id}`)?.focus()
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <div>
            <h1>C208B APE III (Uganda)</h1>
            <p className="app-version">
              Version {__APP_VERSION__} · {__BUILD_DATE__}
            </p>
          </div>
          <img className="app-header-icon" src="/favicon.svg" alt="" width="64" height="64" />
        </div>
      </header>

      <main className="app">
        <div className="app-bar">
          <h2>{TABS.find((tab) => tab.id === activeTab).label}</h2>
          <label className="toggle">
            <input
              type="checkbox"
              role="switch"
              checked={settings.applyWindFactors}
              onChange={(e) => updateSetting('applyWindFactors')(e.target.checked)}
            />
            <span className="toggle-control">
              <span className="toggle-title">Wind factors</span>
              <span className="toggle-track" aria-hidden="true" />
            </span>
            <span className="toggle-label">
              {settings.applyWindFactors ? '50% headwind / 150% tailwind' : 'Actual wind'}
            </span>
          </label>
        </div>

        <div className="tabs" role="tablist" aria-label="Sections" onKeyDown={handleKeyDown}>
          {TABS.map((tab) => {
            const selected = tab.id === activeTab
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                className="tab"
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        <CommonSettings settings={settings} onChange={updateSetting} />

        {TABS.map(({ id, Component }) => (
          <div
            key={id}
            id={`panel-${id}`}
            role="tabpanel"
            aria-labelledby={`tab-${id}`}
            className="tab-panel"
            hidden={id !== activeTab}
          >
            <Component {...settings} />
          </div>
        ))}
      </main>
    </>
  )
}

export default App
