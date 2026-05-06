import React from 'react'
import { TAG_CONFIG } from '../constants/tags.js'

const SCHEDULED_IDS = ['CHORE', 'CAD', 'MEAL_PLAN', 'SHOWER']
const EVENT_IDS = ['NEW_SKILL', 'FIRE_DRILL', 'BEHAVIOR_ISSUE', 'OUTING', 'INTERACTION']

export default function TagTrackerCard({ tagCounts }) {
  if (!tagCounts) return null

  if (tagCounts === 'loading') return (
    <div className="card">
      <h2 className="card-title">Tag Tracker</h2>
      <p className="field-caption">Loading this month's counts...</p>
    </div>
  )

  if (tagCounts === 'error') return (
    <div className="card">
      <h2 className="card-title">Tag Tracker</h2>
      <p className="field-caption">Could not load tag counts.</p>
    </div>
  )

  const { counts, expected, monthLabel } = tagCounts
  const scheduledTags = TAG_CONFIG.filter(t => SCHEDULED_IDS.includes(t.id))
  const eventTags = TAG_CONFIG.filter(t => EVENT_IDS.includes(t.id))

  return (
    <div className="card">
      <h2 className="card-title">Tag Tracker — {monthLabel}</h2>

      <div className="tracker-group">
        <div className="tracker-group-label">Routine</div>
        {scheduledTags.map(tag => {
          const count = counts[tag.id] ?? 0
          const exp = expected[tag.id] ?? 0
          return (
            <div key={tag.id} className="tracker-row">
              <span className="tracker-tag">{tag.label}</span>
              <span className={`tracker-count ${count >= exp ? 'tracker-met' : 'tracker-behind'}`}>
                {count}
                <span className="tracker-expected"> / {exp}</span>
              </span>
            </div>
          )
        })}
      </div>

      <div className="tracker-group">
        <div className="tracker-group-label">Events</div>
        {eventTags.map(tag => (
          <div key={tag.id} className="tracker-row">
            <span className="tracker-tag">{tag.label}</span>
            <span className="tracker-count">{counts[tag.id] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}