import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useRotation } from './hooks/useRotation.js'
import { useGoogleDocs } from './hooks/useGoogleDocs.js'
import { useGoogleCalendar } from './hooks/useGoogleCalendar.js'
import { CHECKLIST_SECTIONS } from './constants/sections.js'
import { TAG_CONFIG } from './constants/tags.js'
import { ISP_SECTIONS } from './constants/ispItems.js'
import { SYSTEM_PROMPT } from './constants/prompts.js'
import { buildPrompt } from './utils/buildPrompt.js'
import StaffCard from './components/StaffCard.jsx'
import TagsCard from './components/TagsCard.jsx'
import ChecklistSection from './components/ChecklistSection.jsx'
import DailyNotesChecklist from './components/DailyNotesChecklist.jsx'
import MenuCard from './components/MenuCard.jsx'
import OutputPanel from './components/OutputPanel.jsx'
import TagTrackerCard from './components/TagTrackerCard.jsx'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const BREAKFAST_OPTIONS = [
  'Eggs and meat',
  'Oatmeal and fruit',
  'Yogurt and fruit',
  'Avocado toast',
  'Cereal and toast',
  'French toast',
  'Pancakes',
  'Sausage and biscuits',
]

function dailyBreakfast(isoDate) {
  const hash = isoDate.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return BREAKFAST_OPTIONS[hash % BREAKFAST_OPTIONS.length]
}

const WEEKEND_LUNCH_OPTIONS = [
  'Soup and crackers',
  'Sandwich and chips',
  'Grilled cheese and chips',
  'Pepperoni rolls',
  'Salad',
  'Yogurt and fruit',
  'Pizza',
  'Quesadillas',
]

function dailyLunch(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  if (dow >= 1 && dow <= 5) return 'Lunch at Diversity'
  const hash = isoDate.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return WEEKEND_LUNCH_OPTIONS[hash % WEEKEND_LUNCH_OPTIONS.length]
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

  // Input mode: 'daily-notes' | 'bullets' | 'routine'
  const [inputMode, setInputMode] = useState('daily-notes')

  // ISP Daily Notes state — all items checked by default
  const [ispChecked, setIspChecked] = useState(() =>
    Object.fromEntries(ISP_SECTIONS.flatMap(s => s.items.map(i => [i.id, i.defaultChecked !== false])))
  )
  const [ispResponses, setIspResponses] = useState(() =>
    Object.fromEntries(ISP_SECTIONS.flatMap(s => s.items.map(i => [i.id, i.defaultResponse])))
  )

  // Check Laundry on Saturdays; Shopping and Banking on Sundays
  useEffect(() => {
    setIspChecked(prev => ({
      ...prev,
      laundry:  dayOfWeek === 6,
      shopping: dayOfWeek === 0,
      banking:  dayOfWeek === 0,
    }))
  }, [dayOfWeek])

  // Check Disaster Drill on December 1st
  useEffect(() => {
    const [, mo, d] = selectedISO.split('-').map(Number)
    setIspChecked(prev => ({ ...prev, 'disaster-drill': mo === 12 && d === 1 }))
  }, [selectedISO])

  // Auto-check Bathing on odd days (1, 3, 5 …); re-randomize temp on date change
  useEffect(() => {
    const d = Number(selectedISO.split('-')[2])
    setIspChecked(prev => ({ ...prev, bathing: d % 2 === 1 }))
    setBathingData(prev => ({ ...prev, temp: randomBathTemp() }))
  }, [selectedISO])

  // Auto-check Bowel Movement ~every 2–3 days using a date-seeded hash (non-strict pattern)
  useEffect(() => {
    const [y, mo, d] = selectedISO.split('-').map(Number)
    const seed = y * 366 + mo * 31 + d
    const r = Math.abs(Math.sin(seed * 12.9898 + 78.233))
    setIspChecked(prev => ({ ...prev, 'bowel-movement': r < 0.4 }))
    setBmData({ time: '', type: '', notes: '' })
  }, [selectedISO])

  // Smoke Detector follows Fire Drill
  useEffect(() => {
    setIspChecked(prev => ({ ...prev, 'smoke-detector': !!prev['fire-drill'] }))
  }, [ispChecked['fire-drill']])

  // Update meal defaults when date changes
  useEffect(() => {
    setMenuBreakfast(dailyBreakfast(selectedISO))
    setMenuLunch(dailyLunch(selectedISO))
  }, [selectedISO])

  // Today's Menu
  const [menuBreakfast, setMenuBreakfast] = useState(() => dailyBreakfast(selectedISO))
  const [menuLunch, setMenuLunch] = useState(() => dailyLunch(selectedISO))
  const [menuDinner, setMenuDinner] = useState('')
  const [menuSnack, setMenuSnack] = useState('')

  // Bullet points mode
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
    if (inputMode !== 'bullets') return
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
  const { googleUser, accessToken, saveStatus, setSaveStatus, handleGoogleSuccess, signOut, saveToGoogleDocs, saveAsDailyNotes, saveToChecklist, saveToWaterTempLog, saveToBMChart, fetchCheckedThisMonth, fetchCheckedThisQuarter, fetchCheckedThisWeek, checkDuplicateDate, tagCounts, fetchTagCounts } = useGoogleDocs()
  const { saveMealsToCalendar, saveDailyMenuToCalendar } = useGoogleCalendar(accessToken)
  const [duplicateWarning, setDuplicateWarning] = useState(false)
  const [addToCalendar, setAddToCalendar] = useState(true)
  const [calendarStatus, setCalendarStatus] = useState(null)      // null | 'saving' | 'done' | 'error'
  const [checklistStatus, setChecklistStatus] = useState(null)    // null | 'saving' | 'done' | 'error'
  const [waterTempStatus, setWaterTempStatus] = useState(null)    // null | 'saving' | 'done' | 'error'
  const [bmStatus, setBmStatus] = useState(null)                  // null | 'saving' | 'done' | 'error'
  const [bmData, setBmData] = useState({ time: '', type: '', notes: '' })
  const BATH_TEMPS = [102, 103, 104]
  const randomBathTemp = () => String(BATH_TEMPS[Math.floor(Math.random() * BATH_TEMPS.length)])
  const [bathingData, setBathingData] = useState({ type: 'shower', temp: randomBathTemp() })
  const [checkedThisMonth, setCheckedThisMonth] = useState(new Set())
  const [checkedThisQuarter, setCheckedThisQuarter] = useState(new Set())
  const [checkedThisWeek, setCheckedThisWeek] = useState(new Set())

  // Fetch which periodic items have already been logged (for NEEDED indicators)
  const selectedYYYYMM = selectedISO.slice(0, 7)
  useEffect(() => {
    if (inputMode !== 'daily-notes' || !googleUser) return
    Promise.all([
      fetchCheckedThisMonth(selectedDate),
      fetchCheckedThisQuarter(selectedDate),
      fetchCheckedThisWeek(selectedDate),
    ]).then(([monthly, quarterly, weekly]) => {
      setCheckedThisMonth(monthly)
      setCheckedThisQuarter(quarterly)
      setCheckedThisWeek(weekly)
    }).catch(() => {})
  }, [selectedISO, inputMode, googleUser])

  // Trigger calendar save after a successful Google Docs save (not for daily-notes)
  useEffect(() => {
    if (inputMode === 'daily-notes') return
    if (!addToCalendar || !saveStatus || typeof saveStatus !== 'object' || !saveStatus.docId) return
    setCalendarStatus('saving')
    saveMealsToCalendar(entry, selectedDate, !!vanArrived)
      .then(() => setCalendarStatus('done'))
      .catch(err => { console.error('Calendar save error:', err); setCalendarStatus('error') })
  }, [saveStatus])

  // After a successful daily-notes save, refresh coverage so NEEDED indicators update
  useEffect(() => {
    if (inputMode !== 'daily-notes') return
    if (!saveStatus || typeof saveStatus !== 'object' || !saveStatus.docId) return
    Promise.all([
      fetchCheckedThisMonth(selectedDate),
      fetchCheckedThisQuarter(selectedDate),
      fetchCheckedThisWeek(selectedDate),
    ]).then(([monthly, quarterly, weekly]) => {
      setCheckedThisMonth(monthly)
      setCheckedThisQuarter(quarterly)
      setCheckedThisWeek(weekly)
    }).catch(() => {})
  }, [saveStatus])

  useEffect(() => {
    if (!googleUser || inputMode === 'daily-notes') return
    setDuplicateWarning(false)
    checkDuplicateDate(selectedDate).then(isDupe => setDuplicateWarning(isDupe))
  }, [selectedISO, googleUser, inputMode])

  useEffect(() => {
    if (!accessToken) return
    fetchTagCounts(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
  }, [accessToken, selectedDate.getFullYear(), selectedDate.getMonth()])

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
  const canGenerate =
    inputMode === 'daily-notes' ? Object.values(ispChecked).some(Boolean) :
    inputMode === 'bullets'     ? nonRoutineNotes.trim().length > 0 :
    Object.values(checkedItems).some(s => s && s.size > 0)

  async function handleGenerate() {
    setEntry('')
    setSaveStatus(null)

    if (inputMode === 'daily-notes') {
      setCalendarStatus(null)
      const lines = []
      const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
      const dateStr = `${selectedDate.getMonth() + 1}/${selectedDate.getDate()}/${selectedDate.getFullYear()}`
      lines.push(`Daily Notes for: ${dayName}, ${dateStr}`)
      lines.push('ISP Dates: from 10/1/26 - 9/30/27')
      lines.push('Provider: Blue Ridge  Service: Sponsored-Residential')
      if (menuBreakfast || menuLunch || menuDinner || menuSnack) {
        const parts = []
        if (menuBreakfast) parts.push(`Breakfast: ${menuBreakfast}`)
        if (menuLunch)     parts.push(`Lunch: ${menuLunch}`)
        if (menuDinner)    parts.push(`Dinner: ${menuDinner}`)
        if (menuSnack)     parts.push(`Snack: ${menuSnack}`)
        lines.push(parts.join('  |  '))
      }
      lines.push('')
      for (const section of ISP_SECTIONS) {
        lines.push(section.label.toUpperCase())
        for (const item of section.items) {
          const checked = !!ispChecked[item.id]
          if (checked) {
            lines.push(`✓  ${item.label} (${item.freq})`)
            if (item.id === 'bowel-movement') {
              const parts = []
              if (bmData.time) parts.push(`Time: ${bmData.time}`)
              if (bmData.type) parts.push(`Type ${bmData.type}`)
              if (bmData.notes) parts.push(bmData.notes)
              lines.push(`   ${parts.length ? parts.join('. ') : 'BM noted.'}`)
            } else {
              lines.push(`   ${ispResponses[item.id] ?? item.defaultResponse}`)
            }
          } else {
            lines.push(`○  ${item.label} (${item.freq}) — N/A`)
          }
        }
        lines.push('')
      }
      lines.push(`Sponsor: ${sponsorName}  ____________________________    ___________`)
      lines.push(`Relief Staff: ${reliefName}  ____________________________    ___________`)
      setEntry(lines.join('\n'))

      if (accessToken) {
        setCalendarStatus('saving')
        setChecklistStatus('saving')

        saveDailyMenuToCalendar(
          { breakfast: menuBreakfast, lunch: menuLunch, dinner: menuDinner, snack: menuSnack },
          selectedDate
        )
          .then(() => setCalendarStatus('done'))
          .catch(err => { console.error('Calendar error:', err); setCalendarStatus('error') })

        saveToChecklist(ispChecked, selectedDate)
          .then(() => setChecklistStatus('done'))
          .catch(err => { console.error('Checklist error:', err); setChecklistStatus('error') })

        if (ispChecked['bathing'] && (bathingData.type || bathingData.temp)) {
          setWaterTempStatus('saving')
          saveToWaterTempLog(bathingData.type, bathingData.temp, selectedDate)
            .then(() => setWaterTempStatus('done'))
            .catch(err => { console.error('Water temp error:', err); setWaterTempStatus('error') })
        }

        if (ispChecked['bowel-movement'] && (bmData.time || bmData.type || bmData.notes)) {
          setBmStatus('saving')
          saveToBMChart(bmData.time, bmData.type, bmData.notes, selectedDate)
            .then(() => setBmStatus('done'))
            .catch(err => { console.error('BM chart error:', err); setBmStatus('error') })
        } else if (!ispChecked['bowel-movement']) {
          saveToBMChart('N/A', '', '', selectedDate)
            .catch(err => console.error('BM chart N/A error:', err))
        }
      }
      return
    }

    setGenerating(true)
    try {
      const prompt = buildPrompt({
        dateLabel,
        staffMode,
        sponsorName,
        reliefName,
        signature: getSignature(),
        inputMode,
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
        ispChecked,
        ispResponses,
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
      if (accessToken) fetchTagCounts(selectedDate.getFullYear(), selectedDate.getMonth() + 1)
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
    setInputMode('daily-notes')
    setIspChecked(Object.fromEntries(ISP_SECTIONS.flatMap(s => s.items.map(i => [i.id, i.defaultChecked !== false]))))
    setIspResponses(Object.fromEntries(ISP_SECTIONS.flatMap(s => s.items.map(i => [i.id, i.defaultResponse]))))
    setMenuBreakfast(dailyBreakfast(selectedISO))
    setMenuLunch(dailyLunch(selectedISO))
    setMenuDinner('')
    setMenuSnack('')
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
    setBmData({ time: '', type: '', notes: '' })
    setBmStatus(null)
    setEntry('')
    setSaveStatus(null)
    setCalendarStatus(null)
    setChecklistStatus(null)
    setAddToCalendar(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleSave() {
    if (inputMode === 'daily-notes') {
      saveAsDailyNotes(ispChecked, ispResponses, selectedDate, sponsorName, reliefName, { breakfast: menuBreakfast, lunch: menuLunch, dinner: menuDinner, snack: menuSnack })
    } else {
      saveToGoogleDocs(entry, selectedDate)
    }
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
          inputMode={inputMode} setInputMode={setInputMode}
          additionalPeople={additionalPeople} setAdditionalPeople={setAdditionalPeople}
        />

        {inputMode !== 'daily-notes' && <TagsCard
          dayOfWeek={dayOfWeek}
          selectedTags={selectedTags} setSelectedTags={setSelectedTags}
        />}

        {inputMode === 'daily-notes' && (
          <MenuCard
            breakfast={menuBreakfast} setBreakfast={setMenuBreakfast}
            lunch={menuLunch}         setLunch={setMenuLunch}
            dinner={menuDinner}       setDinner={setMenuDinner}
            snack={menuSnack}         setSnack={setMenuSnack}
          />
        )}

        {/* Input panel */}
        <div className="card">
          <h2 className="card-title">
            {inputMode === 'daily-notes' ? 'Daily Notes' : inputMode === 'bullets' ? 'Day Notes' : 'Routine Checklist'}
          </h2>

          {inputMode === 'daily-notes' && (
            <>
              <DailyNotesChecklist
                ispChecked={ispChecked}
                ispResponses={ispResponses}
                onToggle={(id, defaultResponse) => {
                  setIspChecked(prev => {
                    const next = { ...prev, [id]: !prev[id] }
                    if (next[id] && !ispResponses[id]) {
                      setIspResponses(r => ({ ...r, [id]: defaultResponse }))
                    }
                    return next
                  })
                }}
                onResponseChange={(id, value) => setIspResponses(prev => ({ ...prev, [id]: value }))}
                bathingData={bathingData}
                onBathingChange={(field, value) => setBathingData(prev => ({ ...prev, [field]: value }))}
                bmData={bmData}
                onBmChange={(field, value) => setBmData(prev => ({ ...prev, [field]: value }))}
                checkedThisMonth={checkedThisMonth}
                checkedThisQuarter={checkedThisQuarter}
                checkedThisWeek={checkedThisWeek}
                selectedYear={selectedDate.getFullYear()}
                onSetDate={setSelectedISO}
              />
            </>
          )}

          {inputMode === 'bullets' && (
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
                    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
                    const currentLine = value.slice(lineStart, selectionStart).trim()
                    const isBehaviorIssue = currentLine.toLowerCase() === '- behavior issue'
                    const insertion = isBehaviorIssue
                      ? '\n- What prompted the behavior issue.\n- Describe Alex\'s behavior.\n- How was it resolved.\n- '
                      : '\n- '
                    const newValue = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd)
                    setNonRoutineNotes(newValue)
                    requestAnimationFrame(() => {
                      el.selectionStart = el.selectionEnd = selectionStart + insertion.length
                      const totalLines = newValue.split('\n').length
                      const cursorLine = newValue.slice(0, selectionStart + insertion.length).split('\n').length
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
          )}

          {inputMode === 'routine' && (
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
            showCalendar={inputMode !== 'daily-notes'}
            checklistStatus={checklistStatus}
          />
        )}

        {googleUser && inputMode !== 'daily-notes' && <TagTrackerCard tagCounts={tagCounts} />}
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