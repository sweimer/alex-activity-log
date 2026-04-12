import React from 'react'

export default function DayDetailsCard({
  dayOfWeek,
  wakeTime, setWakeTime,
  outfitToday, setOutfitToday,
  breakfastOffered, setBreakfastOffered,
  breakfastChose, setBreakfastChose,
  cadOffered, setCadOffered,
  cadChose, setCadChose,
  vanArrived, setVanArrived,
  vanReturned, setVanReturned,
  kiearraArrived, setKiearraArrived,
  kiearraActivities, setKiearraActivities,
  kiearraReturned, setKiearraReturned,
  middayCustom, setMiddayCustom,
  afterLunchCustom, setAfterLunchCustom,
  eveningCustom, setEveningCustom,
}) {
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

  return (
    <div className="card">
      <h2 className="card-title">Day Details</h2>

      {/* Row 1 */}
      <div className="field-row">
        <div className="field">
          <label className="field-label">Alex Woke At</label>
          <input className="text-input" value={wakeTime} onChange={e => setWakeTime(e.target.value)} placeholder="e.g. 7:30am" />
        </div>
        <div className="field">
          <label className="field-label">Today's Outfit</label>
          <input className="text-input" value={outfitToday} onChange={e => setOutfitToday(e.target.value)} placeholder="e.g. the pink dress with black tights" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="field-row">
        <div className="field">
          <label className="field-label">Breakfast Choices Offered</label>
          <input className="text-input" value={breakfastOffered} onChange={e => setBreakfastOffered(e.target.value)} placeholder="e.g. cereal or oats" />
        </div>
        <div className="field">
          <label className="field-label">Alex Chose</label>
          <input className="text-input" value={breakfastChose} onChange={e => setBreakfastChose(e.target.value)} placeholder="e.g. oats" />
        </div>
      </div>

      {/* Row 3 — CAD choices */}
      <div className="field-row">
        <div className="field">
          <label className="field-label">CAD Choices Offered</label>
          <input className="text-input" value={cadOffered} onChange={e => setCadOffered(e.target.value)} placeholder="e.g. beading or painting" />
        </div>
        <div className="field">
          <label className="field-label">Alex Chose</label>
          <input className="text-input" value={cadChose} onChange={e => setCadChose(e.target.value)} placeholder="e.g. beading" />
        </div>
      </div>

      {/* Diversity Van — weekdays only */}
      {isWeekday && (
        <div className="field-row">
          <div className="field">
            <label className="field-label">Diversity Van Arrived</label>
            <input className="text-input" value={vanArrived} onChange={e => setVanArrived(e.target.value)} placeholder="e.g. 8:30am" />
          </div>
          <div className="field">
            <label className="field-label">Diversity Van Returned</label>
            <input className="text-input" value={vanReturned} onChange={e => setVanReturned(e.target.value)} placeholder="e.g. 2:30pm" />
          </div>
        </div>
      )}

      {/* Kiearra */}
      <div className="field-row">
        <div className="field">
          <label className="field-label">Kiearra Arrived</label>
          <input className="text-input" value={kiearraArrived} onChange={e => setKiearraArrived(e.target.value)} placeholder="e.g. 9:00am" />
        </div>
        <div className="field">
          <label className="field-label">Kiearra Returned</label>
          <input className="text-input" value={kiearraReturned} onChange={e => setKiearraReturned(e.target.value)} placeholder="e.g. 4:00pm" />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label className="field-label">Kiearra Activities</label>
          <input className="text-input" value={kiearraActivities} onChange={e => setKiearraActivities(e.target.value)} placeholder="e.g. Kiearra and Alex had a manicure, went to a movie and had lunch at the theater" />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label">Midday Activity</label>
          <input className="text-input" value={middayCustom} onChange={e => setMiddayCustom(e.target.value)} placeholder="e.g. Sponsor/Relief and Alex baked cookies together." />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label className="field-label">After Lunch Activity</label>
          <input className="text-input" value={afterLunchCustom} onChange={e => setAfterLunchCustom(e.target.value)} placeholder="e.g. Sponsor/Relief and Alex worked on a puzzle." />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label className="field-label">Evening Activity</label>
          <input className="text-input" value={eveningCustom} onChange={e => setEveningCustom(e.target.value)} placeholder="e.g. Sponsor/Relief and Alex watched a movie together." />
        </div>
      </div>
    </div>
  )
}