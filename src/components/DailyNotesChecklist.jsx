import React from 'react'
import { ISP_SECTIONS } from '../constants/ispItems.js'

const EyeIcon = () => (
  <svg className="isp-needs-review" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const MONTHLY_FREQS = new Set(['monthly'])
const QUARTERLY_FREQS = new Set(['quarterly', '5/year'])
const WEEKLY_FREQS = new Set(['weekly', 'weekly/as needed'])
const AS_NEEDED_FREQS = new Set(['as needed', 'PRN'])

export default function DailyNotesChecklist({ ispChecked, ispResponses, onToggle, onResponseChange, bathingData = { type: 'bath', temp: '' }, onBathingChange, bmData = { time: '', type: '', notes: '' }, onBmChange, checkedThisMonth = new Set(), checkedThisQuarter = new Set(), checkedThisWeek = new Set(), selectedDate, selectedYear, onSetDate }) {
  const isWeekend = selectedDate && (selectedDate.getDay() === 0 || selectedDate.getDay() === 6)
  const getDefault = (item) => (isWeekend && item.weekendResponse) ? item.weekendResponse : item.defaultResponse

  return (
    <div className="isp-checklist">
      {ISP_SECTIONS.map(section => (
        <div key={section.id} className="isp-section">
          <div className="isp-section-header">{section.label}</div>
          <table className="isp-table">
            <tbody>
              {section.items.map(item => {
                const checked = !!ispChecked[item.id]
                const response = ispResponses[item.id] ?? getDefault(item)
                const isPeriodic = item.defaultChecked === false
                const needed = isPeriodic && (
                  (MONTHLY_FREQS.has(item.freq) && !checkedThisMonth.has(item.id)) ||
                  (QUARTERLY_FREQS.has(item.freq) && !checkedThisQuarter.has(item.id)) ||
                  (WEEKLY_FREQS.has(item.freq) && !checkedThisWeek.has(item.id))
                )
                const isAsNeeded = AS_NEEDED_FREQS.has(item.freq)
                const isDisasterDrill = item.id === 'disaster-drill'
                return (
                  <tr key={item.id} className={`isp-row ${checked ? 'isp-row-checked' : ''}`}>
                    <td className="isp-col-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(item.id, getDefault(item))}
                      />
                    </td>
                    <td className="isp-col-label">
                      {item.needsReview && <EyeIcon />}
                      {item.label}
                      {isAsNeeded
                        ? <span className="isp-freq-as-needed">AS NEEDED</span>
                        : <span className="isp-freq">({item.freq})</span>
                      }
                      {needed && !isDisasterDrill && <span className="isp-needed">NEEDED</span>}
                      {needed && isDisasterDrill && (
                        <button
                          type="button"
                          className="isp-add-dec01"
                          onClick={() => onSetDate && onSetDate(`${selectedYear}-12-01`)}
                        >
                          ADD DEC 01
                        </button>
                      )}
                    </td>
                    <td className="isp-col-response">
                      {checked && item.id === 'bathing' && (
                        <div className="bathing-fields">
                          <label className="bathing-type-label">
                            <input type="radio" name="bathing-type" value="bath"
                              checked={bathingData.type === 'bath'}
                              onChange={() => onBathingChange('type', 'bath')} />
                            Bath
                          </label>
                          <label className="bathing-type-label">
                            <input type="radio" name="bathing-type" value="shower"
                              checked={bathingData.type === 'shower'}
                              onChange={() => onBathingChange('type', 'shower')} />
                            Shower
                          </label>
                          <input
                            type="number"
                            className="bathing-temp-input"
                            min="100" max="110"
                            placeholder="°F"
                            value={bathingData.temp}
                            onChange={e => onBathingChange('temp', e.target.value)}
                          />
                          {bathingData.temp && (Number(bathingData.temp) < 100 || Number(bathingData.temp) > 110) && (
                            <span className="bathing-temp-warn">Must be 100–110°F</span>
                          )}
                        </div>
                      )}
                      {checked && item.id === 'bowel-movement' ? (
                        <div className="bm-fields">
                          <input
                            type="time"
                            className="bm-time-input"
                            value={bmData.time}
                            onChange={e => onBmChange('time', e.target.value)}
                          />
                          <select
                            className="bm-type-select"
                            value={bmData.type}
                            onChange={e => onBmChange('type', e.target.value)}
                          >
                            <option value="">Type...</option>
                            <option value="1">1 — Separate hard lumps</option>
                            <option value="2">2 — Sausage-shaped, lumpy</option>
                            <option value="3">3 — Sausage with cracks</option>
                            <option value="4">4 — Smooth sausage/snake</option>
                            <option value="5">5 — Soft blobs, clear edges</option>
                            <option value="6">6 — Fluffy, mushy</option>
                            <option value="7">7 — Watery, no solid pieces</option>
                          </select>
                          <input
                            type="text"
                            className="bm-notes-input"
                            placeholder="Notes..."
                            value={bmData.notes}
                            onChange={e => onBmChange('notes', e.target.value)}
                          />
                        </div>
                      ) : checked ? (
                        <textarea
                          className="isp-response-input"
                          value={response}
                          rows={1}
                          ref={el => {
                            if (el) {
                              el.style.height = 'auto'
                              el.style.height = el.scrollHeight + 'px'
                            }
                          }}
                          onChange={e => {
                            onResponseChange(item.id, e.target.value)
                            e.target.style.height = 'auto'
                            e.target.style.height = e.target.scrollHeight + 'px'
                          }}
                        />
                      ) : (
                        <span className="isp-na">N/A</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
