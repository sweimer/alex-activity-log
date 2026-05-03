import React, { useState } from 'react'

export default function OutputPanel({ entry, onEntryChange, googleUser, saveStatus, onSave, onClear, addToCalendar, setAddToCalendar, calendarStatus }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(entry)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card output-card">
      <div className="output-header">
        <span className="output-title">Generated Entry</span>
        <div className="output-actions">
          <button
            type="button"
            className={`action-btn ${copied ? 'action-btn-success' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button
            type="button"
            className={`action-btn ${!googleUser ? 'action-btn-disabled' : ''}`}
            onClick={onSave}
            disabled={!googleUser || saveStatus === 'saving'}
            title={!googleUser ? 'Sign in to Google to save' : 'Save to Google Docs'}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save to Google Docs'}
          </button>
          <button type="button" className="action-btn action-btn-clear" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      <textarea
        className="entry-text entry-editable"
        value={entry}
        onChange={e => onEntryChange(e.target.value)}
        rows={12}
      />

      {saveStatus && saveStatus !== 'saving' && saveStatus !== 'error' && (
        <div className="save-confirm">
          ✓ Saved to{' '}
          <a
            href={`https://docs.google.com/document/d/${saveStatus.docId}/edit`}
            target="_blank"
            rel="noreferrer"
          >
            {saveStatus.docName}
          </a>
          {saveStatus.insertedInMiddle && ' — Entry inserted in chronological order.'}
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="save-error">There was a problem saving to Google Docs. Please try again.</div>
      )}

      {googleUser && (
        <div className="calendar-toggle">
          <label className="person-checkbox">
            <input
              type="checkbox"
              checked={addToCalendar}
              onChange={e => setAddToCalendar(e.target.checked)}
            />
            <span>Add meals to Google Calendar</span>
          </label>
          {calendarStatus === 'saving' && <span className="calendar-status">Adding meals to calendar...</span>}
          {calendarStatus === 'done'   && <span className="calendar-status calendar-done">✓ Meals added to calendar</span>}
          {calendarStatus === 'error'  && <span className="calendar-status calendar-error">Problem saving to calendar. Please try again.</span>}
        </div>
      )}
    </div>
  )
}