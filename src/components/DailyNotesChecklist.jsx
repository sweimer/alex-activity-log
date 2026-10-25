import React from 'react'
import { ISP_SECTIONS } from '../constants/ispItems.js'

const MONTHLY_FREQS = new Set(['monthly'])
const QUARTERLY_FREQS = new Set(['quarterly', '5/year'])
const WEEKLY_FREQS = new Set(['weekly', 'weekly/as needed'])
const AS_NEEDED_FREQS = new Set(['as needed', 'PRN'])

export default function DailyNotesChecklist({ ispChecked, ispResponses, onToggle, onResponseChange, checkedThisMonth = new Set(), checkedThisQuarter = new Set(), checkedThisWeek = new Set(), selectedYear, onSetDate }) {
  return (
    <div className="isp-checklist">
      {ISP_SECTIONS.map(section => (
        <div key={section.id} className="isp-section">
          <div className="isp-section-header">{section.label}</div>
          <table className="isp-table">
            <tbody>
              {section.items.map(item => {
                const checked = !!ispChecked[item.id]
                const response = ispResponses[item.id] ?? item.defaultResponse
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
                        onChange={() => onToggle(item.id, item.defaultResponse)}
                      />
                    </td>
                    <td className="isp-col-label">
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
                      {checked ? (
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
