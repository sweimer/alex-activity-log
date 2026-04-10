import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LegacyActivityForm from './legacy/LegacyActivityForm.jsx'
import LegacyResultsPage from './legacy/LegacyResultsPage.jsx'
import { useRotation } from './hooks/useRotation.js'
import { useGoogleDocs } from './hooks/useGoogleDocs.js'
import { CHECKLIST_SECTIONS } from './constants/sections.js'
import { SYSTEM_PROMPT } from './constants/prompts.js'
import { buildPrompt } from './utils/buildPrompt.js'
import StaffCard from './components/StaffCard.jsx'
import DayDetailsCard from './components/DayDetailsCard.jsx'
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
  const [dayType, setDayType] = useState('routine')
  const [staffMode, setStaffMode] = useState('both')
  const [sponsorName, setSponsorName] = useState('Heather')
  const [reliefName, setReliefName] = useState('Scott')

  // Rotation
  const { rotation, todayRole, isOverridden, initRotation, toggleOverride } = useRotation()

  // Day details
  const [wakeTime, setWakeTime] = useState('')
  const [outfitToday, setOutfitToday] = useState('')
  const [breakfastOffered, setBreakfastOffered] = useState('')
  const [breakfastChose, setBreakfastChose] = useState('')
  const [vanArrived, setVanArrived] = useState('')
  const [vanReturned, setVanReturned] = useState('')
  const [kiearraArrived, setKiearraArrived] = useState('')
  const [kiearraActivities, setKiearraActivities] = useState('')
  const [kiearraReturned, setKiearraReturned] = useState('')
  const [middayCustom, setMiddayCustom] = useState('')
  const [afterLunchCustom, setAfterLunchCustom] = useState('')
  const [eveningCustom, setEveningCustom] = useState('')

  // Tags
  const [selectedTags, setSelectedTags] = useState([])
  const [tagInputs, setTagInputs] = useState({})

  // Non-routine
  const [nonRoutineText, setNonRoutineText] = useState('')

  // Checklist
  const [checkedItems, setCheckedItems] = useState({}) // { sectionId: Set<string> }
  const [sectionNotes, setSectionNotes] = useState({}) // { sectionId: string }
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Generation
  const [generating, setGenerating] = useState(false)
  const [entry, setEntry] = useState('')

  // Google
  const { googleUser, accessToken, saveStatus, setSaveStatus, handleGoogleSuccess, signOut, saveToGoogleDocs } = useGoogleDocs()

  // Set up Google Token Client
  useEffect(() => {
    if (!window.google) return
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile',
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
  const canGenerate = dayType === 'nonroutine'
    ? nonRoutineText.trim().length > 0
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
        selectedTags,
        tagInputs,
        wakeTime,
        outfitToday,
        breakfastOffered,
        breakfastChose,
        vanArrived,
        vanReturned,
        kiearraArrived,
        kiearraActivities,
        kiearraReturned,
        middayCustom,
        afterLunchCustom,
        eveningCustom,
        dayType,
        nonRoutineText,
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
    setDayType('routine')
    setStaffMode('sponsor')
    setWakeTime('')
    setOutfitToday('')
    setBreakfastOffered('')
    setBreakfastChose('')
    setVanArrived('')
    setVanReturned('')
    setKiearraArrived('')
    setKiearraActivities('')
    setKiearraReturned('')
    setMiddayCustom('')
    setAfterLunchCustom('')
    setEveningCustom('')
    setSelectedTags([])
    setTagInputs({})
    setNonRoutineText('')
    setCheckedItems({})
    setSectionNotes({})
    setAdditionalNotes('')
    setEntry('')
    setSaveStatus(null)
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
            <div className="header-title">Alex's Log</div>
            <div className="header-subtitle">Daily Activity Log</div>
          </div>
          <div className="header-auth">
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
          dayType={dayType} setDayType={setDayType}
          staffMode={staffMode} setStaffMode={setStaffMode}
          sponsorName={sponsorName} setSponsorName={setSponsorName}
          reliefName={reliefName} setReliefName={setReliefName}
          todayRole={todayRole}
          isOverridden={isOverridden}
          initRotation={initRotation}
          toggleOverride={toggleOverride}
          rotation={rotation}
        />

        <DayDetailsCard
          dayOfWeek={dayOfWeek}
          wakeTime={wakeTime} setWakeTime={setWakeTime}
          outfitToday={outfitToday} setOutfitToday={setOutfitToday}
          breakfastOffered={breakfastOffered} setBreakfastOffered={setBreakfastOffered}
          breakfastChose={breakfastChose} setBreakfastChose={setBreakfastChose}
          vanArrived={vanArrived} setVanArrived={setVanArrived}
          vanReturned={vanReturned} setVanReturned={setVanReturned}
          kiearraArrived={kiearraArrived} setKiearraArrived={setKiearraArrived}
          kiearraActivities={kiearraActivities} setKiearraActivities={setKiearraActivities}
          kiearraReturned={kiearraReturned} setKiearraReturned={setKiearraReturned}
          middayCustom={middayCustom} setMiddayCustom={setMiddayCustom}
          afterLunchCustom={afterLunchCustom} setAfterLunchCustom={setAfterLunchCustom}
          eveningCustom={eveningCustom} setEveningCustom={setEveningCustom}
        />

        <TagsCard
          dayOfWeek={dayOfWeek}
          selectedTags={selectedTags} setSelectedTags={setSelectedTags}
          tagInputs={tagInputs} setTagInputs={setTagInputs}
        />

        {/* Non-routine panel */}
        {dayType === 'nonroutine' && (
          <div className="card">
            <h2 className="card-title">Describe Alex's Day</h2>
            <p className="card-caption">Write as much or as little as you know — where she went, who was there, how she did. Claude will shape it into a proper log entry.</p>
            <textarea
              className="custom-textarea"
              rows={8}
              placeholder="e.g. Alex traveled to Philadelphia with her family to visit her aunt Carol. They drove up Friday morning and stopped for lunch on the way. Alex did well in the car and was excited to see Carol..."
              value={nonRoutineText}
              onChange={e => setNonRoutineText(e.target.value)}
            />
          </div>
        )}

        {/* Routine checklist */}
        {dayType === 'routine' && (
          <div className="card">
            <h2 className="card-title">Routine Checklist</h2>

            {visibleSections.map(section => (
              <ChecklistSection
                key={section.id}
                section={section}
                checkedItems={checkedItems[section.id]}
                onToggle={toggleItem}
                note={sectionNotes[section.id]}
                onNoteChange={setNote}
                outfitToday={outfitToday}
                kiearraArrived={kiearraArrived}
                kiearraActivities={kiearraActivities}
                kiearraReturned={kiearraReturned}
                middayCustom={middayCustom}
                afterLunchCustom={afterLunchCustom}
                eveningCustom={eveningCustom}
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
          </div>
        )}

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
            googleUser={googleUser}
            saveStatus={saveStatus}
            onSave={handleSave}
            onClear={handleClear}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/legacy" element={<LegacyActivityForm />} />
        <Route path="/legacy/results" element={<LegacyResultsPage />} />
      </Routes>
    </BrowserRouter>
  )
}