import React from 'react'

export default function MenuCard({ breakfast, setBreakfast, lunch, setLunch, dinner, setDinner, snack, setSnack }) {
  return (
    <div className="card">
      <h2 className="card-title">Today's Menu</h2>
      <div className="field-row">
        <div className="field">
          <label className="field-label">Breakfast</label>
          <input
            className="text-input"
            value={breakfast}
            onChange={e => setBreakfast(e.target.value)}
            placeholder="e.g. Oatmeal with fruit"
          />
        </div>
        <div className="field">
          <label className="field-label">Lunch</label>
          <input
            className="text-input"
            value={lunch}
            onChange={e => setLunch(e.target.value)}
            placeholder="e.g. Turkey sandwich"
          />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label className="field-label">Dinner</label>
          <input
            className="text-input"
            value={dinner}
            onChange={e => setDinner(e.target.value)}
            placeholder="e.g. Spaghetti and salad"
          />
        </div>
        <div className="field">
          <label className="field-label">Snack</label>
          <input
            className="text-input"
            value={snack}
            onChange={e => setSnack(e.target.value)}
            placeholder="e.g. Apple slices"
          />
        </div>
      </div>
    </div>
  )
}
