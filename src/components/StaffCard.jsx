import React, { useState } from 'react'

export default function StaffCard({
  dateLabel,
  selectedISO, setSelectedISO,
  staffMode, setStaffMode,
  sponsorName, setSponsorName,
  reliefName, setReliefName,
  todayRole, isOverridden, toggleOverride,
  nonRoutineDay, setNonRoutineDay,
  additionalPeople, setAdditionalPeople,
}) {
  const [showPeople, setShowPeople] = useState(false)

  function togglePerson(key) {
    setAdditionalPeople(prev => ({ ...prev, [key]: !prev[key] }))
  }
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

      {/* Non-routine day toggle */}
      <div className="field-row">
        <div className="field">
          <label className="field-label">Input Method</label>
          <div className="pill-group">
            <button
              type="button"
              className={`pill ${!nonRoutineDay ? 'pill-active' : ''}`}
              onClick={() => setNonRoutineDay(false)}
            >
              Checklist
            </button>
            <button
              type="button"
              className={`pill ${nonRoutineDay ? 'pill-active' : ''}`}
              onClick={() => setNonRoutineDay(true)}
            >
              Bullet points
            </button>
          </div>
        </div>
      </div>

      {/* Additional people — only on non-routine days */}
      {nonRoutineDay && (
        <div className="field">
          <button
            type="button"
            className="toggle-label-btn"
            onClick={() => setShowPeople(p => !p)}
          >
            <span className="field-label">Additional People Present</span>
            <span className="toggle-caret">{showPeople ? '▲' : '▼'}</span>
          </button>
          {showPeople && (
            <div className="additional-people">
              {[
                { key: 'grandmaBetty', label: 'Grandma Betty' },
                { key: 'grandpaDave',  label: 'Grandpa Dave' },
                { key: 'grandpaBob',   label: 'Grandpa Bob' },
              ].map(({ key, label }) => (
                <label key={key} className="person-checkbox">
                  <input
                    type="checkbox"
                    checked={additionalPeople[key]}
                    onChange={() => togglePerson(key)}
                  />
                  <span>{label}</span>
                </label>
              ))}
              <input
                className="text-input"
                placeholder="Other (e.g. Aunt Sue)"
                value={additionalPeople.other}
                onChange={e => setAdditionalPeople(prev => ({ ...prev, other: e.target.value }))}
              />
            </div>
          )}
        </div>
      )}

      {/* Signature */}
      <div className="rotation-block">
        <div className="rotation-display">
          <span className="rotation-label">
            Today's signature: <strong>{todayRole}</strong>
            {isOverridden && <span className="override-badge"> (overridden)</span>}
          </span>
          <button type="button" className="override-btn" onClick={toggleOverride}>
            {isOverridden ? 'Restore' : 'Override'}
          </button>
        </div>
      </div>
    </div>
  )
}