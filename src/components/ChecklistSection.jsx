import React from 'react'

function resolveItem(item, { outfitToday, kiearraArrived, kiearraActivities, kiearraReturned, middayCustom, afterLunchCustom, eveningCustom }) {
  return item
    .replace('__OUTFIT__', outfitToday || 'her outfit today')
    .replace('__KIEARRA_ARRIVED__', kiearraArrived || '___')
    .replace('__KIEARRA_ACTIVITIES__', kiearraActivities || '___')
    .replace('__KIEARRA_RETURNED__', kiearraReturned || '___')
    .replace('__MIDDAY_CUSTOM__', middayCustom || '___')
    .replace('__AFTER_LUNCH_CUSTOM__', afterLunchCustom || '___')
    .replace('__EVENING_CUSTOM__', eveningCustom || '___')
}

export default function ChecklistSection({ section, checkedItems, onToggle, note, onNoteChange, outfitToday, kiearraArrived, kiearraActivities, kiearraReturned, middayCustom, afterLunchCustom, eveningCustom }) {
  const selectedCount = checkedItems ? checkedItems.size : 0
  const hasSelections = selectedCount > 0

  return (
    <div className={`checklist-section ${hasSelections ? 'section-active' : ''}`}>
      <div className={`section-header ${hasSelections ? 'section-header-active' : ''}`}>
        <span className="section-label">{section.label}</span>
        {selectedCount > 0 && <span className="section-count">{selectedCount} selected</span>}
      </div>

      <div className="section-items">
        {section.items.map((item, i) => {
          const isChecked = checkedItems?.has(item) ?? false
          return (
            <label key={i} className={`checklist-item ${isChecked ? 'item-checked' : ''}`}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onToggle(section.id, item)}
                className="checklist-checkbox"
              />
              <span className="item-text">{resolveItem(item, { outfitToday, kiearraArrived, kiearraActivities, kiearraReturned, middayCustom, afterLunchCustom, eveningCustom })}</span>
            </label>
          )
        })}
      </div>

      <input
        type="text"
        className="section-note-input"
        placeholder={`Add a detail for ${section.label}... e.g. nice outside, ate on the deck`}
        value={note ?? ''}
        onChange={e => onNoteChange(section.id, e.target.value)}
      />
    </div>
  )
}