import React, { useState } from 'react'

export default function OutputPanel({ entry, googleUser, saveStatus, onSave, onClear }) {
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

      <div className="entry-text">{entry}</div>

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
    </div>
  )
}