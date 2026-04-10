import React from 'react'
import { TAG_CONFIG } from '../constants/tags.js'

export default function TagsCard({ dayOfWeek, selectedTags, setSelectedTags, tagInputs, setTagInputs }) {
  function toggleTag(id) {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function setTagInput(id, value) {
    setTagInputs(prev => ({ ...prev, [id]: value }))
  }

  function setTagInputField(id, field, value) {
    setTagInputs(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: value } }))
  }

  const expectedToday = TAG_CONFIG.filter(t => t.expectedDays.includes(dayOfWeek))
  const unselectedExpected = expectedToday.filter(t => !selectedTags.includes(t.id))
  const allExpectedSelected = unselectedExpected.length === 0 && expectedToday.length > 0

  const noteToHeatherLine = selectedTags.length > 0
    ? 'NOTE TO HEATHER: ' + selectedTags.map(id => {
        const t = TAG_CONFIG.find(t => t.id === id)
        return t ? `(${t.label})` : `(${id})`
      }).join(' ')
    : null

  return (
    <div className="card">
      <h2 className="card-title">Tags / Note to Heather</h2>

      {/* Tag buttons */}
      <div className="tag-grid">
        {TAG_CONFIG.map(tag => {
          const isSelected = selectedTags.includes(tag.id)
          const isExpected = tag.expectedDays.includes(dayOfWeek)
          return (
            <button
              key={tag.id}
              type="button"
              className={[
                'tag-btn',
                isSelected ? 'tag-selected' : '',
                !isSelected && isExpected ? 'tag-expected' : '',
              ].join(' ')}
              onClick={() => toggleTag(tag.id)}
            >
              {tag.label}
              {isExpected && !isSelected && <span className="tag-dot"> ●</span>}
              {tag.hasCustomInput && <span className="tag-pencil"> ✎</span>}
            </button>
          )
        })}
      </div>

      {/* Day reminder */}
      {expectedToday.length > 0 && (
        <div className={`day-reminder ${allExpectedSelected ? 'reminder-done' : 'reminder-pending'}`}>
          {allExpectedSelected ? (
            <span>✓ All expected tags for today are covered</span>
          ) : (
            <span>
              Expected today but not yet tagged:{' '}
              {unselectedExpected.map((t, i) => (
                <React.Fragment key={t.id}>
                  {i > 0 && ', '}
                  <button
                    type="button"
                    className="reminder-tag-link"
                    onClick={() => toggleTag(t.id)}
                  >
                    {t.label}
                  </button>
                </React.Fragment>
              ))}
            </span>
          )}
        </div>
      )}

      {/* Custom input panels */}
      {selectedTags.includes('CHOICE') && (
        <div className="custom-panel">
          <div className="custom-panel-label">CHOICE</div>
          <div className="pill-group">
            <button
              type="button"
              className={`pill ${(tagInputs['CHOICE']?.mode ?? 'breakfast') === 'breakfast' ? 'pill-active' : ''}`}
              onClick={() => setTagInputField('CHOICE', 'mode', 'breakfast')}
            >
              Breakfast choice
            </button>
            <button
              type="button"
              className={`pill ${tagInputs['CHOICE']?.mode === 'custom' ? 'pill-active' : ''}`}
              onClick={() => setTagInputField('CHOICE', 'mode', 'custom')}
            >
              Custom scenario
            </button>
          </div>
          {tagInputs['CHOICE']?.mode === 'custom' && (
            <textarea
              className="custom-textarea"
              rows={3}
              placeholder="Describe the choice scenario..."
              value={tagInputs['CHOICE']?.text ?? ''}
              onChange={e => setTagInputField('CHOICE', 'text', e.target.value)}
            />
          )}
        </div>
      )}

      {selectedTags.includes('NEW_SKILL') && (
        <div className="custom-panel">
          <div className="custom-panel-label">NEW SKILL</div>
          <textarea
            className="custom-textarea"
            rows={3}
            placeholder="Describe the new skill Alex worked on or demonstrated today..."
            value={tagInputs['NEW_SKILL']?.text ?? ''}
            onChange={e => setTagInput('NEW_SKILL', { text: e.target.value })}
          />
        </div>
      )}

      {selectedTags.includes('BEHAVIOR_ISSUE') && (
        <div className="custom-panel">
          <div className="custom-panel-label behavior-label">BEHAVIOR ISSUE</div>
          <div className="behavior-warning">⚠ This section will be written with extra care for Heather's review.</div>
          <textarea
            className="custom-textarea"
            rows={5}
            placeholder="Describe what happened, how Alex responded, and how it was handled. Be specific — this is reviewed by Heather."
            value={tagInputs['BEHAVIOR_ISSUE']?.text ?? ''}
            onChange={e => setTagInput('BEHAVIOR_ISSUE', { text: e.target.value })}
          />
        </div>
      )}

      {selectedTags.includes('OUTING') && (
        <div className="custom-panel">
          <div className="custom-panel-label">OUTING</div>
          <textarea
            className="custom-textarea"
            rows={3}
            placeholder="Where did Alex go? Who went with her? What did she do? How did she do?"
            value={tagInputs['OUTING']?.text ?? ''}
            onChange={e => setTagInput('OUTING', { text: e.target.value })}
          />
        </div>
      )}

      {selectedTags.includes('INTERACTION') && (
        <div className="custom-panel">
          <div className="custom-panel-label">INTERACTION</div>
          <textarea
            className="custom-textarea"
            rows={3}
            placeholder="Describe the interaction — who was involved, what happened, how Alex engaged..."
            value={tagInputs['INTERACTION']?.text ?? ''}
            onChange={e => setTagInput('INTERACTION', { text: e.target.value })}
          />
        </div>
      )}

      {/* Live header preview */}
      {noteToHeatherLine && (
        <div className="note-preview">
          {noteToHeatherLine}
        </div>
      )}
    </div>
  )
}