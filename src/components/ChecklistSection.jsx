import React from 'react'

function resolveItem(item, { outfitToday, kiearraArrived, kiearraActivities, kiearraReturned, middayCustom, afterLunchCustom, eveningCustom, cadOffered, cadChose }) {
  return item
    .replace('__OUTFIT__', outfitToday || 'her outfit today')
    .replace('__KIEARRA_ARRIVED__', kiearraArrived || '___')
    .replace('__KIEARRA_ACTIVITIES__', kiearraActivities || '___')
    .replace('__KIEARRA_RETURNED__', kiearraReturned || '___')
    .replace('__MIDDAY_CUSTOM__', middayCustom || '___')
    .replace('__AFTER_LUNCH_CUSTOM__', afterLunchCustom || '___')
    .replace('__EVENING_CUSTOM__', eveningCustom || '___')
    .replace(/__CAD_OFFERED__/g, cadOffered || '___')
    .replace(/__CAD_CHOSE__/g, cadChose || '___')
}

export default function ChecklistSection({ section, checkedItems, onToggle, note, onNoteChange, wakeTime, setWakeTime, outfitToday, setOutfitToday, breakfastOffered, setBreakfastOffered, breakfastChose, setBreakfastChose, vanArrived, setVanArrived, vanReturned, setVanReturned, kiearraArrived, setKiearraArrived, kiearraActivities, setKiearraActivities, kiearraReturned, setKiearraReturned, middayCustom, setMiddayCustom, afterLunchCustom, setAfterLunchCustom, eveningCustom, setEveningCustom, cadOffered, setCadOffered, cadChose, setCadChose }) {
  const selectedCount = checkedItems ? checkedItems.size : 0
  const hasSelections = selectedCount > 0

  return (
    <div className={`checklist-section ${hasSelections ? 'section-active' : ''}`}>
      <div className={`section-header ${hasSelections ? 'section-header-active' : ''}`}>
        <span className="section-label">{section.label}</span>
        {selectedCount > 0 && <span className="section-count">{selectedCount} selected</span>}
      </div>

      <div className="section-items">
        {section.id === 'wake' && (
          <div className="field" style={{ marginBottom: '10px' }}>
            <label className="field-label">Alex Woke At</label>
            <input className="text-input" value={wakeTime ?? ''} onChange={e => setWakeTime(e.target.value)} placeholder="e.g. 7:30am" />
          </div>
        )}
        {section.id === 'morning' && (
          <div className="field" style={{ marginBottom: '10px' }}>
            <label className="field-label">Today's Outfit</label>
            <input className="text-input" value={outfitToday ?? ''} onChange={e => setOutfitToday(e.target.value)} placeholder="e.g. the pink dress with black tights" />
          </div>
        )}
        {section.id === 'evening' && (
          <div style={{ marginBottom: '10px' }}>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Evening Activity</label>
                <input className="text-input" value={eveningCustom ?? ''} onChange={e => setEveningCustom(e.target.value)} placeholder="e.g. Sponsor/Relief and Alex watched a movie together." />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label">CAD Choices Offered</label>
                <input className="text-input" value={cadOffered ?? ''} onChange={e => setCadOffered(e.target.value)} placeholder="e.g. beading or painting" />
              </div>
              <div className="field">
                <label className="field-label">Alex Chose</label>
                <input className="text-input" value={cadChose ?? ''} onChange={e => setCadChose(e.target.value)} placeholder="e.g. beading" />
              </div>
            </div>
          </div>
        )}
        {section.id === 'afterLunch' && (
          <div style={{ marginBottom: '10px' }}>
            <div className="field-row">
              <div className="field">
                <label className="field-label">After Lunch Activity</label>
                <input className="text-input" value={afterLunchCustom ?? ''} onChange={e => setAfterLunchCustom(e.target.value)} placeholder="e.g. Sponsor/Relief and Alex worked on a puzzle." />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label">CAD Choices Offered</label>
                <input className="text-input" value={cadOffered ?? ''} onChange={e => setCadOffered(e.target.value)} placeholder="e.g. beading or painting" />
              </div>
              <div className="field">
                <label className="field-label">Alex Chose</label>
                <input className="text-input" value={cadChose ?? ''} onChange={e => setCadChose(e.target.value)} placeholder="e.g. beading" />
              </div>
            </div>
          </div>
        )}
        {section.id === 'midday' && (
          <div style={{ marginBottom: '10px' }}>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Midday Activity</label>
                <input className="text-input" value={middayCustom ?? ''} onChange={e => setMiddayCustom(e.target.value)} placeholder="e.g. Sponsor/Relief and Alex baked cookies together." />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label">CAD Choices Offered</label>
                <input className="text-input" value={cadOffered ?? ''} onChange={e => setCadOffered(e.target.value)} placeholder="e.g. beading or painting" />
              </div>
              <div className="field">
                <label className="field-label">Alex Chose</label>
                <input className="text-input" value={cadChose ?? ''} onChange={e => setCadChose(e.target.value)} placeholder="e.g. beading" />
              </div>
            </div>
          </div>
        )}
        {section.id === 'kiearra' && (
          <div style={{ marginBottom: '10px' }}>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Kiearra Arrived</label>
                <input className="text-input" value={kiearraArrived ?? ''} onChange={e => setKiearraArrived(e.target.value)} placeholder="e.g. 9:00am" />
              </div>
              <div className="field">
                <label className="field-label">Kiearra Returned</label>
                <input className="text-input" value={kiearraReturned ?? ''} onChange={e => setKiearraReturned(e.target.value)} placeholder="e.g. 4:00pm" />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Kiearra Activities</label>
                <input className="text-input" value={kiearraActivities ?? ''} onChange={e => setKiearraActivities(e.target.value)} placeholder="e.g. Kiearra and Alex had a manicure, went to a movie and had lunch at the theater" />
              </div>
            </div>
          </div>
        )}
        {section.id === 'diversityVan' && (
          <div className="field-row" style={{ marginBottom: '10px' }}>
            <div className="field">
              <label className="field-label">Diversity Van Arrived</label>
              <input className="text-input" value={vanArrived ?? ''} onChange={e => setVanArrived(e.target.value)} placeholder="e.g. 8:30am" />
            </div>
            <div className="field">
              <label className="field-label">Diversity Van Returned</label>
              <input className="text-input" value={vanReturned ?? ''} onChange={e => setVanReturned(e.target.value)} placeholder="e.g. 2:30pm" />
            </div>
          </div>
        )}
        {section.id === 'breakfast' && (
          <div className="field-row" style={{ marginBottom: '10px' }}>
            <div className="field">
              <label className="field-label">Breakfast Choices Offered</label>
              <input className="text-input" value={breakfastOffered ?? ''} onChange={e => setBreakfastOffered(e.target.value)} placeholder="e.g. cereal or oats" />
            </div>
            <div className="field">
              <label className="field-label">Alex Chose</label>
              <input className="text-input" value={breakfastChose ?? ''} onChange={e => setBreakfastChose(e.target.value)} placeholder="e.g. oats" />
            </div>
          </div>
        )}
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
              <span className="item-text">{resolveItem(item, { outfitToday, kiearraArrived, kiearraActivities, kiearraReturned, middayCustom, afterLunchCustom, eveningCustom, cadOffered, cadChose })}</span>
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