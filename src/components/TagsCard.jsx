import React from 'react'
import { TAG_CONFIG } from '../constants/tags.js'

export default function TagsCard({ dayOfWeek, selectedTags, setSelectedTags }) {
  function toggleTag(id) {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
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


      {/* Live header preview */}
      {noteToHeatherLine && (
        <div className="note-preview">
          {noteToHeatherLine}
        </div>
      )}
    </div>
  )
}