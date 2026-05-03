import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useRotation } from './hooks/useRotation.js'
import { useGoogleDocs } from './hooks/useGoogleDocs.js'
import { useGoogleCalendar } from './hooks/useGoogleCalendar.js'
import { CHECKLIST_SECTIONS } from './constants/sections.js'
import { TAG_CONFIG } from './constants/tags.js'
import { SYSTEM_PROMPT } from './constants/prompts.js'
import { buildPrompt } from './utils/buildPrompt.js'
import StaffCard from './components/StaffCard.jsx'
import TagsCard from './components/TagsCard.jsx'
import ChecklistSection from './components/ChecklistSection.jsx'
import OutputPanel from './components/OutputPanel.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoToLabel(iso) {
  // Parse as local date to avoid timezone shift
  const [y, m, day] = iso.split('-').map(Number)
  const d = new Date(y, m - 1, day)
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function MainApp() {
  const [selectedISO, setSelectedISO] = useState(toISO(new Date()))

  const [y, m, day] = selectedISO.split('-').map(Number)
  const selectedDate = new Date(y, m - 1, day)
  const dayOfWeek = selectedDate.getDay()
  const dateLabel = isoToLabel(selectedISO)

  // Staff
  const [staffMode, setStaffMode] = useState('both')
  const [sponsorName, setSponsorName] = useState('Heather Weimer')
  const [reliefName, setReliefName] = useState('Scott Weimer')

  // Auto-set staffMode based on day of week:
  // Thu (4), Fri (5), Sat (6) → Scott Weimer, Relief
  // Sun (0), Mon (1), Tue (2), Wed (3) → Heather Weimer, Sponsor
  useEffect(() => {
    setStaffMode('both')
  }, [selectedISO])

  // Rotation
  const { todayRole, isOverridden, toggleOverride } = useRotation(selectedISO)

  // Day details
  const [wakeTime, setWakeTime] = useState('')
  const [outfitToday, setOutfitToday] = useState('')
  const [breakfastOffered, setBreakfastOffered] = useState('')
  const [breakfastChose, setBreakfastChose] = useState('')
  const [cadOffered, setCadOffered] = useState('')
  const [cadChose, setCadChose] = useState('')
  const [vanArrived, setVanArrived] = useState('')
  const [vanReturned, setVanReturned] = useState('')
  const [kiearraArrived, setKiearraArrived] = useState('')
  const [kiearraActivities, setKiearraActivities] = useState('')
  const [kiearraReturned, setKiearraReturned] = useState('')
  const [middayCustom, setMiddayCustom] = useState('')
  const [afterLunchCustom, setAfterLunchCustom] = useState('')
  const [eveningCustom, setEveningCustom] = useState('')

  // Non-routine day
  const [nonRoutineDay, setNonRoutineDay] = useState(true)
  const [nonRoutineNotes, setNonRoutineNotes] = useState('- ')
  const [additionalPeople, setAdditionalPeople] = useState({
    grandmaBetty: false,
    grandpaDave: false,
    grandpaBob: false,
    other: '',
  })

  // Tags
  const [selectedTags, setSelectedTags] = useState([])

  // Checklist
  const [checkedItems, setCheckedItems] = useState({}) // { sectionId: Set<string> }
  const [sectionNotes, setSectionNotes] = useState({}) // { sectionId: string }
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Auto-check checklist items when their corresponding input fields are filled
  const CAD_ITEM = 'Sponsor/Relief asked Alex if she wanted to work on a __CAD_OFFERED__ craft. Alex said yes and chose __CAD_CHOSE__. Sponsor/Relief set Alex up with __CAD_CHOSE__ in the family room and checked in on her as she worked.'
  useEffect(() => {
    const mappings = [
      { sectionId: 'morning',     item: 'Alex picked __OUTFIT__ from the outfits hanging outside her dresser.',                         active: !!outfitToday.trim() },
      { sectionId: 'breakfast',   item: 'Sponsor/Relief prepared breakfast, monitored Alex as she ate and administered AM meds.',        active: !!(breakfastOffered.trim() || breakfastChose.trim()) },
      { sectionId: 'diversityVan', item: 'Van arrived to take Alex to Diversity.',                                                       active: !!vanArrived.trim() },
      { sectionId: 'diversityVan', item: 'Van returned with Alex.',                                                                      active: !!vanReturned.trim() },
      { sectionId: 'kiearra',     item: "Kiearra arrived to take Alex out for a girl's day.",                                            active: !!kiearraArrived.trim() },
      { sectionId: 'kiearra',     item: '__KIEARRA_ACTIVITIES__',                                                                        active: !!kiearraActivities.trim() },
      { sectionId: 'kiearra',     item: 'Kiearra returned Alex home.',                                                                   active: !!kiearraReturned.trim() },
      { sectionId: 'midday',      item: '__MIDDAY_CUSTOM__',                                                                             active: !!middayCustom.trim() },
      { sectionId: 'midday',      item: CAD_ITEM,                                                                                        active: !!(cadOffered.trim() || cadChose.trim()) },
      { sectionId: 'afterLunch',  item: '__AFTER_LUNCH_CUSTOM__',                                                                        active: !!afterLunchCustom.trim() },
      { sectionId: 'afterLunch',  item: CAD_ITEM,                                                                                        active: !!(cadOffered.trim() || cadChose.trim()) },
      { sectionId: 'evening',     item: '__EVENING_CUSTOM__',                                                                            active: !!eveningCustom.trim() },
      { sectionId: 'evening',     item: CAD_ITEM,                                                                                        active: !!(cadOffered.trim() || cadChose.trim()) },
    ]
    setCheckedItems(prev => {
      const next = Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, new Set(v)]))
      for (const { sectionId, item, active } of mappings) {
        if (active) {
          if (!next[sectionId]) next[sectionId] = new Set()
          next[sectionId].add(item)
        }
      }
      return next
    })
  }, [outfitToday, breakfastOffered, breakfastChose, vanArrived, vanReturned, kiearraArrived, kiearraActivities, kiearraReturned, middayCustom, afterLunchCustom, eveningCustom, cadOffered, cadChose])

  // Tag suggestions
  const [suggestedTags, setSuggestedTags] = useState([])
  const [suggesting, setSuggesting] = useState(false)

  async function handleSuggestTags() {
    if (!nonRoutineNotes.trim() || nonRoutineNotes.trim() === '-') return
    setSuggesting(true)
    setSuggestedTags([])
    try {
      const tagList = TAG_CONFIG.map(t => t.id).join(', ')
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: `Given these daily activity notes, which of the following tags apply? Return only a JSON array of matching tag IDs, nothing else.\n\nAvailable tags: ${tagList}\n\nNotes:\n${nonRoutineNotes}`,
          }],
        }),
      })
      const data = await res.json()
      const raw = data.content?.[0]?.text ?? '[]'
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      const parsed = JSON.parse(text)
      const valid = parsed.filter(id => TAG_CONFIG.some(t => t.id === id) && !selectedTags.includes(id))
      setSuggestedTags(valid)
    } catch (err) {
      console.error('Tag suggestion error:', err)
    } finally {
      setSuggesting(false)
    }
  }

  function acceptSuggestion(id) {
    setSelectedTags(prev => [...prev, id])
    setSuggestedTags(prev => prev.filter(t => t !== id))
  }

  function dismissSuggestion(id) {
    setSuggestedTags(prev => prev.filter(t => t !== id))
  }

  // Generation
  const [generating, setGenerating] = useState(false)
  const [entry, setEntry] = useState('')

  // Google
  const { googleUser, accessToken, saveStatus, setSaveStatus, handleGoogleSuccess, signOut, saveToGoogleDocs, checkDuplicateDate } = useGoogleDocs()
  const { saveMealsToCalendar } = useGoogleCalendar(accessToken)
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [addToCalendar, setAddToCalendar] = useState(false)
  const [calendarStatus, setCalendarStatus] = useState(null) // null | 'saving' | 'done' | 'error'

  // Trigger calendar save after a successful Google Docs save
  useEffect(() => {
    if (!addToCalendar || !saveStatus || typeof saveStatus !== 'object' || !saveStatus.docId) return
    setCalendarStatus('saving')
    saveMealsToCalendar(entry, selectedDate, !!vanArrived)
      .then(() => setCalendarStatus('done'))
      .catch(err => { console.error('Calendar save error:', err); setCalendarStatus('error') })
  }, [saveStatus])

  useEffect(() => {
    if (!googleUser) return
    setDuplicateWarning(false)
    checkDuplicateDate(selectedDate).then(isDupe => setDuplicateWarning(isDupe))
  }, [selectedISO, googleUser])

  // Set up Google Token Client
  useEffect(() => {
    if (!window.google) return
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar.events',
      callback: handleGoogleSuccess,
    })
    window._googleTokenClient = client
  }, [handleGoogleSuccess])

  function requestGoogleToken() {
    window._googleTokenClient?.requestAccessToken()
  }

  // Checklist toggle
  function toggleItem(sectionId, item) {
    setCheckedItems(prev => {
      const current = prev[sectionId] ? new Set(prev[sectionId]) : new Set()
      if (current.has(item)) current.delete(item)
      else current.add(item)
      return { ...prev, [sectionId]: current }
    })
  }

  function setNote(sectionId, value) {
    setSectionNotes(prev => ({ ...prev, [sectionId]: value }))
  }

  // Derive signature string
  function getSignature() {
    if (!todayRole) return ''
    if (staffMode === 'sponsor') return `${sponsorName}, Sponsor`
    if (staffMode === 'relief') return `${reliefName}, Relief`
    // Both — the signing role determines who signs
    if (todayRole === 'Sponsor') return `${sponsorName}, Sponsor`
    return `${reliefName}, Relief`
  }

  // Can we generate?
  const canGenerate = nonRoutineDay
    ? nonRoutineNotes.trim().length > 0
    : Object.values(checkedItems).some(s => s && s.size > 0)

  async function handleGenerate() {
    setGenerating(true)
    setEntry('')
    setSaveStatus(null)

    try {
      const prompt = buildPrompt({
        dateLabel,
        staffMode,
        sponsorName,
        reliefName,
        signature: getSignature(),
        nonRoutineDay,
        nonRoutineNotes,
        additionalPeople,
        selectedTags,
        wakeTime,
        outfitToday,
        breakfastOffered,
        breakfastChose,
        cadOffered,
        cadChose,
        vanArrived,
        vanReturned,
        kiearraArrived,
        kiearraActivities,
        kiearraReturned,
        middayCustom,
        afterLunchCustom,
        eveningCustom,
        checkedItems,
        sectionNotes,
        additionalNotes,
      })

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error))
      setEntry(data.content?.[0]?.text ?? 'No response received.')
    } catch (err) {
      console.error(err)
      setEntry('Error generating entry. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function handleClear() {
    if (!window.confirm('Clear all fields and start over?')) return
    setStaffMode('both')
    setNonRoutineDay(true)
    setNonRoutineNotes('- ')
    setSuggestedTags([])
    setAdditionalPeople({ grandmaBetty: false, grandpaDave: false, grandpaBob: false, other: '' })
    setWakeTime('')
    setOutfitToday('')
    setBreakfastOffered('')
    setBreakfastChose('')
    setCadOffered('')
    setCadChose('')
    setVanArrived('')
    setVanReturned('')
    setKiearraArrived('')
    setKiearraActivities('')
    setKiearraReturned('')
    setMiddayCustom('')
    setAfterLunchCustom('')
    setEveningCustom('')
    setSelectedTags([])
    setCheckedItems({})
    setSectionNotes({})
    setAdditionalNotes('')
    setEntry('')
    setSaveStatus(null)
    setCalendarStatus(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSave() {
    saveToGoogleDocs(entry, selectedDate)
  }

  // Visible checklist sections based on day
  const visibleSections = CHECKLIST_SECTIONS.filter(s => {
    if (s.weekdayOnly && !(dayOfWeek >= 1 && dayOfWeek <= 5)) return false
    if (s.saturdayOnly && dayOfWeek !== 6) return false
    return true
  })

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div>
            <div className="header-title">Alex's Daily Log</div>
            <div className="header-subtitle">Daily Activity Log</div>
          </div>
          <div className="header-auth">
            <a
              className="header-gdrive-btn"
              href="https://calendar.google.com/calendar/u/0?cid=Z3Q5YnUyZzU3dmp0amZwcmswcjloY2MycGtAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ"
              target="_blank"
              rel="noreferrer"
            >GCal</a>
            <a
              className="header-gdrive-btn"
              href="https://drive.google.com/drive/folders/1WouU-VuYWgM4Cl4ZeGkEV9vyhqVYPCOT"
              target="_blank"
              rel="noreferrer"
            >GDrive</a>
            <button className="header-clear-btn" onClick={handleClear}>Clear</button>
            {googleUser ? (
              <div className="user-info">
                <span className="user-name">{googleUser.name}</span>
                <button className="sign-out-btn" onClick={signOut}>Sign out</button>
              </div>
            ) : (
              <button className="google-sign-in-btn" onClick={requestGoogleToken}>
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <StaffCard
          dateLabel={dateLabel}
          selectedISO={selectedISO} setSelectedISO={setSelectedISO}
          duplicateWarning={duplicateWarning}
          staffMode={staffMode} setStaffMode={setStaffMode}
          sponsorName={sponsorName} setSponsorName={setSponsorName}
          reliefName={reliefName} setReliefName={setReliefName}
          todayRole={todayRole}
          isOverridden={isOverridden}
          toggleOverride={toggleOverride}
          nonRoutineDay={nonRoutineDay} setNonRoutineDay={setNonRoutineDay}
          additionalPeople={additionalPeople} setAdditionalPeople={setAdditionalPeople}
        />

        <TagsCard
          dayOfWeek={dayOfWeek}
          selectedTags={selectedTags} setSelectedTags={setSelectedTags}
        />

        {/* Checklist or freeform notes */}
        <div className="card">
          <h2 className="card-title">{nonRoutineDay ? 'Day Notes' : 'Routine Checklist'}</h2>

          {nonRoutineDay ? (
            <div className="field">
              <p className="field-caption">Jot down bullet points of what happened today. The AI will turn them into a full log entry.</p>
              <textarea
                className="custom-textarea"
                rows={10}
                placeholder={"- Alex woke up around 8am\n- Grandma Betty made pancakes for breakfast\n- Alex and Grandpa Dave worked in the garden\n- ..."}
                value={nonRoutineNotes}
                onChange={e => setNonRoutineNotes(e.target.value)}
                onBlur={handleSuggestTags}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const el = e.target
                    const { selectionStart, selectionEnd, value } = el
                    const newValue = value.slice(0, selectionStart) + '\n- ' + value.slice(selectionEnd)
                    setNonRoutineNotes(newValue)
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = selectionStart + 3
                      const totalLines = newValue.split('\n').length
                      const cursorLine = newValue.slice(0, selectionStart + 3).split('\n').length
                      const lineHeight = el.scrollHeight / totalLines
                      const cursorBottom = cursorLine * lineHeight
                      if (cursorBottom > el.scrollTop + el.clientHeight) {
                        el.scrollTop = cursorBottom - el.clientHeight
                      }
                    })
                  }
                }}
              />
              {suggesting && <p className="suggestion-status">Suggesting tags...</p>}
              {suggestedTags.length > 0 && (
                <div className="suggestion-row">
                  <span className="suggestion-label">Suggested tags:</span>
                  {suggestedTags.map(id => {
                    const tag = TAG_CONFIG.find(t => t.id === id)
                    return (
                      <span key={id} className="suggestion-chip">
                        <button type="button" className="chip-add" onClick={() => acceptSuggestion(id)}>
                          + {tag?.label ?? id}
                        </button>
                        <button type="button" className="chip-dismiss" onClick={() => dismissSuggestion(id)}>✕</button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
          {visibleSections.map(section => (
            <ChecklistSection
              key={section.id}
              section={section}
              checkedItems={checkedItems[section.id]}
              onToggle={toggleItem}
              note={sectionNotes[section.id]}
              onNoteChange={setNote}
              wakeTime={wakeTime}
              setWakeTime={setWakeTime}
              outfitToday={outfitToday}
              setOutfitToday={setOutfitToday}
              breakfastOffered={breakfastOffered}
              setBreakfastOffered={setBreakfastOffered}
              breakfastChose={breakfastChose}
              setBreakfastChose={setBreakfastChose}
              vanArrived={vanArrived}
              setVanArrived={setVanArrived}
              vanReturned={vanReturned}
              setVanReturned={setVanReturned}
              kiearraArrived={kiearraArrived}
              setKiearraArrived={setKiearraArrived}
              kiearraActivities={kiearraActivities}
              setKiearraActivities={setKiearraActivities}
              kiearraReturned={kiearraReturned}
              setKiearraReturned={setKiearraReturned}
              middayCustom={middayCustom}
              setMiddayCustom={setMiddayCustom}
              afterLunchCustom={afterLunchCustom}
              setAfterLunchCustom={setAfterLunchCustom}
              eveningCustom={eveningCustom}
              setEveningCustom={setEveningCustom}
              cadOffered={cadOffered}
              setCadOffered={setCadOffered}
              cadChose={cadChose}
              setCadChose={setCadChose}
            />
          ))}

          <div className="field" style={{ marginTop: '20px' }}>
            <label className="field-label">Additional Notes</label>
            <p className="field-caption">Weather, mood, a small detail that colored the day</p>
            <textarea
              className="custom-textarea"
              rows={3}
              placeholder="e.g. It was a beautiful day so Sponsor prepared breakfast on the deck..."
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
            />
          </div>
            </>
          )}
        </div>

        {/* Generate button */}
        <div className="generate-row">
          <button
            type="button"
            className={`generate-btn ${!canGenerate ? 'generate-btn-disabled' : ''}`}
            disabled={!canGenerate || generating}
            onClick={handleGenerate}
          >
            {generating ? 'Writing entry...' : '✦ Generate Log Entry'}
          </button>
          <button type="button" className="clear-btn" onClick={handleClear}>
            Clear
          </button>
        </div>

        {/* Output */}
        {entry && (
          <OutputPanel
            entry={entry}
            onEntryChange={setEntry}
            googleUser={googleUser}
            saveStatus={saveStatus}
            onSave={handleSave}
            onClear={handleClear}
            addToCalendar={addToCalendar}
            setAddToCalendar={setAddToCalendar}
            calendarStatus={calendarStatus}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<MainApp />} />
      </Routes>
    </BrowserRouter>
  )
}