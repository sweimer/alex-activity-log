import React from 'react'

export default function StaffCard({
  dateLabel,
  selectedISO, setSelectedISO,
  dayType, setDayType,
  staffMode, setStaffMode,
  sponsorName, setSponsorName,
  reliefName, setReliefName,
  todayRole, isOverridden, initRotation, toggleOverride, rotation,
}) {
  return (
    <div className="card">
      <h2 className="card-title">Staff &amp; Date</h2>

      <div className="field-row">
        <div className="field">
          <label className="field-label">Date</label>
          <input
            type="date"
            className="text-input"
            value={selectedISO}
            onChange={e => setSelectedISO(e.target.value)}
          />
          <div className="date-display" style={{ marginTop: '6px', fontSize: '0.85rem', color: '#666' }}>{dateLabel}</div>
        </div>
      </div>

      {/* Day Type */}
      <div className="field-row">
        <div className="field">
          <label className="field-label">Day Type</label>
          <div className="pill-group">
            <button
              type="button"
              className={`pill ${dayType === 'routine' ? 'pill-active' : ''}`}
              onClick={() => setDayType('routine')}
            >
              ✦ Routine Day
            </button>
            <button
              type="button"
              className={`pill ${dayType === 'nonroutine' ? 'pill-active' : ''}`}
              onClick={() => setDayType('nonroutine')}
            >
              ✈ Non-Routine Day
            </button>
          </div>
        </div>
      </div>

      {/* Who Was On */}
      <div className="field-row">
        <div className="field">
          <label className="field-label">Who Was On Today</label>
          <div className="pill-group">
            {[
              { id: 'sponsor', label: 'Sponsor only' },
              { id: 'relief',  label: 'Relief only' },
              { id: 'both',    label: 'Both — shared duties' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                className={`pill ${staffMode === opt.id ? 'pill-active' : ''}`}
                onClick={() => setStaffMode(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Name fields */}
      <div className="field-row">
        {(staffMode === 'sponsor' || staffMode === 'both') && (
          <div className="field">
            <label className="field-label">Sponsor Name</label>
            <input
              className="text-input"
              value={sponsorName}
              onChange={e => setSponsorName(e.target.value)}
              placeholder="e.g. Scott Weimer"
            />
          </div>
        )}
        {(staffMode === 'relief' || staffMode === 'both') && (
          <div className="field">
            <label className="field-label">Relief Name</label>
            <input
              className="text-input"
              value={reliefName}
              onChange={e => setReliefName(e.target.value)}
              placeholder="e.g. Heather Weimer"
            />
          </div>
        )}
      </div>

      {/* Signature rotation */}
      <div className="rotation-block">
        {!rotation ? (
          <div>
            <p className="rotation-setup-label">To set up signature rotation — who signs today?</p>
            <div className="pill-group">
              <button type="button" className="pill" onClick={() => initRotation('Sponsor')}>Sponsor</button>
              <button type="button" className="pill" onClick={() => initRotation('Relief')}>Relief</button>
            </div>
          </div>
        ) : (
          <div className="rotation-display">
            <span className="rotation-label">
              Today's signature: <strong>{todayRole}</strong>
              {isOverridden && <span className="override-badge"> (overridden)</span>}
            </span>
            <button type="button" className="override-btn" onClick={toggleOverride}>
              {isOverridden ? 'Restore rotation' : 'Override for today'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}