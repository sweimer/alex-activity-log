import { useState, useCallback } from 'react'
import { TAG_CONFIG } from '../constants/tags.js'
import { ISP_SECTIONS } from '../constants/ispItems.js'
import sigSW from '../assets/signatures/SignatureSW.png'
import sigHW from '../assets/signatures/signatureHW.png'
import bmImg1 from '../assets/bm/BMType01.png'
import bmImg2 from '../assets/bm/BMType02.png'
import bmImg3 from '../assets/bm/BMType03.png'
import bmImg4 from '../assets/bm/BMType04.png'
import bmImg5 from '../assets/bm/BMType05.png'
import bmImg6 from '../assets/bm/BMType06.png'
import bmImg7 from '../assets/bm/BMType07.png'

const BM_IMAGE_URLS = [bmImg1, bmImg2, bmImg3, bmImg4, bmImg5, bmImg6, bmImg7]

// Item map: item ID → { sectionIdx (which table), rowIdx (row within that table, 1-based) }
// Row 0 of each table is the "Support Activities | 1 | … | 31" column header
const CHECKLIST_ITEM_MAP = (() => {
  const map = {}
  ISP_SECTIONS.forEach((section, sectionIdx) => {
    section.items.forEach((item, itemIdx) => {
      map[item.id] = { sectionIdx, rowIdx: 1 + itemIdx }
    })
  })
  return map
})()

const FOLDER_ID = '1WouU-VuYWgM4Cl4ZeGkEV9vyhqVYPCOT'

const TRACKED_IDS = ['CHORE', 'CAD', 'MEAL_PLAN', 'SHOWER', 'NEW_SKILL', 'FIRE_DRILL', 'BEHAVIOR_ISSUE', 'OUTING', 'INTERACTION']

function daysOfWeekInMonth(year, month, dows) {
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    if (dows.includes(new Date(year, month - 1, d).getDay())) count++
  }
  return count
}
const DOC_HEADER = 'This Support Log belongs to: Alexandra Stevenson ID #33562 ISP Start: 05/01/25 Ends: 05/31/25 Blue Ridge Sponsored Residential/Daily Support Log'

// Matches "M/D/YYYY - DAYNAME" at the start of a paragraph, e.g. "4/3/2026 - FRIDAY"
const DATE_LINE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*-\s*[A-Z]+/

function formatDateLine(dateObj) {
  const m = dateObj.getMonth() + 1
  const d = dateObj.getDate()
  const y = dateObj.getFullYear()
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  return `${m}/${d}/${y} - ${dayName}`
}

/**
 * Walk body.content and return all paragraphs whose text matches the date line
 * format, with their parsed date and startIndex.
 */
function parseEntryDates(content) {
  const entries = []
  for (const el of content) {
    if (!el.paragraph) continue
    const text = (el.paragraph.elements ?? [])
      .map(e => e.textRun?.content ?? '')
      .join('')
      .trim()
    const m = text.match(DATE_LINE_RE)
    if (m) {
      entries.push({
        date: new Date(parseInt(m[3]), parseInt(m[1]) - 1, parseInt(m[2])),
        startIndex: el.startIndex,
        dateStr: `${m[1]}/${m[2]}/${m[3]}`,
      })
    }
  }
  return entries
}

export function useGoogleDocs() {
  const [googleUser, setGoogleUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [saveStatus, setSaveStatus] = useState(null)
  // saveStatus: null | 'saving' | { docId, docName, insertedInMiddle } | 'error'
  const [tagCounts, setTagCounts] = useState(null)
  // tagCounts: null | 'loading' | 'error' | { counts: {}, expected: {}, monthLabel: string }

  const handleGoogleSuccess = useCallback((tokenResponse) => {
    setAccessToken(tokenResponse.access_token)
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
    })
      .then(r => r.json())
      .then(info => setGoogleUser(info))
      .catch(() => setGoogleUser({ name: 'Signed In' }))
  }, [])

  const signOut = useCallback(() => {
    setGoogleUser(null)
    setAccessToken(null)
    setSaveStatus(null)
  }, [])

  async function saveToGoogleDocs(entryText, dateObj) {
    if (!accessToken) return
    setSaveStatus('saving')

    try {
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const year = dateObj.getFullYear()
      const docName = `${month}/${year} LOGS`

      let docId = await findDoc(docName)
      if (!docId) {
        docId = await createDoc(docName)
        await insertDocHeader(docId)
      }

      // Read full document to determine insertion point
      const docRes = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
      const doc = await docRes.json()
      const content = doc.body?.content ?? []

      const newDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
      const dateLine = formatDateLine(dateObj)
      const existingEntries = parseEntryDates(content)

      // Check for duplicate date
      const duplicate = existingEntries.find(e => e.date.getTime() === newDate.getTime())
      if (duplicate) {
        const proceed = window.confirm(
          `An entry for ${duplicate.dateStr} already exists. Save anyway?`
        )
        if (!proceed) {
          setSaveStatus(null)
          return
        }
      }

      // Find the first existing entry whose date is strictly later than the new entry
      const laterEntries = existingEntries
        .filter(e => e.date > newDate)
        .sort((a, b) => a.startIndex - b.startIndex)

      const lastEl = content[content.length - 1]
      const docEndIndex = lastEl?.endIndex ?? 1

      let insertIndex
      let insertedInMiddle

      if (laterEntries.length === 0) {
        // Append at end of document
        insertIndex = docEndIndex - 1
        insertedInMiddle = false
      } else {
        // Insert before the earliest later entry
        insertIndex = laterEntries[0].startIndex
        insertedInMiddle = true
      }

      // Build the full text block: blank line + date line + entry + trailing newline
      const textToInsert = '\n' + dateLine + '\n' + entryText + '\n\n'

      await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: insertIndex },
                text: textToInsert,
              },
            },
          ],
        }),
      })

      setSaveStatus({ docId, docName, insertedInMiddle })
    } catch (err) {
      console.error('Google Docs save error:', err)
      setSaveStatus('error')
    }
  }

  async function findDoc(name) {
    const q = encodeURIComponent(
      `'${FOLDER_ID}' in parents and name='${name}' and mimeType='application/vnd.google-apps.document' and trashed=false`
    )
    const res = await gFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`)
    const data = await res.json()
    return data.files?.[0]?.id ?? null
  }

  async function createDoc(name) {
    const res = await gFetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.document',
        parents: [FOLDER_ID],
      }),
    })
    const data = await res.json()
    return data.id
  }

  async function insertDocHeader(docId) {
    await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: DOC_HEADER + '\n\n',
            },
          },
        ],
      }),
    })
  }

  function gFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers ?? {}),
      },
    })
  }

  async function fetchTagCounts(year, month) {
    if (!accessToken) return
    setTagCounts('loading')
    try {
      const docName = `${String(month).padStart(2, '0')}/${year} LOGS`
      const docId = await findDoc(docName)
      const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      const counts = Object.fromEntries(TRACKED_IDS.map(id => [id, 0]))

      if (docId) {
        const docRes = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
        const doc = await docRes.json()
        const paragraphs = (doc.body?.content ?? [])
          .filter(el => el.paragraph)
          .map(el => (el.paragraph.elements ?? []).map(e => e.textRun?.content ?? '').join(''))

        const noteLines = paragraphs.filter(p => p.includes('NOTE TO HEATHER:'))

        for (const id of TRACKED_IDS) {
          const tag = TAG_CONFIG.find(t => t.id === id)
          if (!tag) continue
          counts[id] = noteLines.filter(l => l.includes(`(${tag.label})`)).length
        }
      }

      const expected = {}
      for (const id of TRACKED_IDS) {
        const tag = TAG_CONFIG.find(t => t.id === id)
        if (tag?.expectedDays.length) {
          expected[id] = daysOfWeekInMonth(year, month, tag.expectedDays)
        }
      }

      setTagCounts({ counts, expected, monthLabel })
    } catch (err) {
      console.error('Tag counts error:', err)
      setTagCounts('error')
    }
  }

  async function checkDuplicateDate(dateObj) {
    if (!accessToken) return false
    try {
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const year = dateObj.getFullYear()
      const docName = `${month}/${year} LOGS`
      const docId = await findDoc(docName)
      if (!docId) return false
      const docRes = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
      const doc = await docRes.json()
      const content = doc.body?.content ?? []
      const newDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate())
      const existing = parseEntryDates(content)
      return existing.some(e => e.date.getTime() === newDate.getTime())
    } catch {
      return false
    }
  }

  async function createChecklistDoc(docId, monthName, year) {
    const SECTION_LABELS_CL = {
      'outcome2':         'Outcome2 #   Alex enjoys choosing and participating in activities in order to enjoy life.',
      'essential-risks':  'Essential Identified Risk:',
      'routine-supports': 'Routine Supports:',
    }
    const NUM_COLS     = 32
    const LABEL_COL_PT = 100
    const DAY_COL_PT   = 14

    // ── Batch 1: page margins ───────────────────────────────────────────────
    const b1 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          updateDocumentStyle: {
            documentStyle: {
              marginTop:    { magnitude: 36, unit: 'PT' },
              marginBottom: { magnitude: 36, unit: 'PT' },
              marginLeft:   { magnitude: 36, unit: 'PT' },
              marginRight:  { magnitude: 36, unit: 'PT' },
            },
            fields: 'marginTop,marginBottom,marginLeft,marginRight',
          },
        }],
      }),
    })
    if (!b1.ok) throw new Error(await b1.text())

    // ── Batches 2a-2c: insert section title paragraph + table (REVERSE order) ──
    for (const section of [...ISP_SECTIONS].reverse()) {
      const label = SECTION_LABELS_CL[section.id] ?? section.label
      const titleText = `${section.id !== 'outcome2' ? '\n' : ''}${label}\n`
      const numRows = 1 + section.items.length   // row 0 = col header, rows 1+ = items
      const b = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            { insertText: { location: { index: 1 }, text: titleText } },
            { insertTable: { rows: numRows, columns: NUM_COLS, location: { index: 1 + titleText.length } } },
            {
              updateTextStyle: {
                range: { startIndex: 1, endIndex: 1 + titleText.length },
                textStyle: { bold: true },
                fields: 'bold',
              },
            },
          ],
        }),
      })
      if (!b.ok) throw new Error(await b.text())
    }

    // ── Insert doc-level header block at top (index 1) ─────────────────────
    const docHdr =
      `SP Initial Checklist for:   Alexandra Stevenson   SP Dates: from   10/1/26 - 9/30/27\n\n` +
      `Month: ${monthName}   Year: ${year}   Provider: Blue Ridge  Service: Sponsored-Residential\n\n`
    const bHdr = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ insertText: { location: { index: 1 }, text: docHdr } }] }),
    })
    if (!bHdr.ok) throw new Error(await bHdr.text())

    // ── Read doc to get all table + cell positions ──────────────────────────
    const docRes = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    const doc = await docRes.json()
    const bodyContent = doc.body?.content ?? []
    const tables = bodyContent.filter(el => el.table)
    const lastEl = bodyContent[bodyContent.length - 1]
    const endIdx = Math.max(1, (lastEl?.endIndex ?? 2) - 1)

    // ── Footer text inserted at end of doc ─────────────────────────────────
    const docFtr =
      `\nKey (The use of any code requires a log entry):  Initials = support provided,  Circled initials = support provided/notation in log,  C = chose not to participate,  A = individual not present,\n` +
      `Printed Name:  Heather Weimer                  Initials: _______  Date: _______\n` +
      `Printed Name:  Scott Weimer                       Initials: _______  Date: _______\n` +
      `These checklists belong to: _____  ID# ___    ISP Start: 10/01/2026  End:  9/30/2027    Revision: ______\n` +
      `VA ISP Checklist    rev. 4.1.15`

    // ── Final batch: footer + column widths + fill all cells HIGH→LOW + bold ──
    const requests = []

    requests.push({ insertText: { location: { index: endIdx }, text: docFtr } })

    const allInsertions = []

    for (let t = ISP_SECTIONS.length - 1; t >= 0; t--) {
      const section = ISP_SECTIONS[t]
      const tableEl = tables[t]
      if (!tableEl) continue
      const tableStartIdx = tableEl.startIndex
      const tableRows = tableEl.table.tableRows

      requests.push({
        updateTableColumnProperties: {
          tableStartLocation: { index: tableStartIdx },
          columnIndices: [0],
          tableColumnProperties: { widthType: 'FIXED_WIDTH', width: { magnitude: LABEL_COL_PT, unit: 'PT' } },
          fields: 'widthType,width',
        },
      })
      requests.push({
        updateTableColumnProperties: {
          tableStartLocation: { index: tableStartIdx },
          columnIndices: Array.from({ length: 31 }, (_, i) => i + 1),
          tableColumnProperties: { widthType: 'FIXED_WIDTH', width: { magnitude: DAY_COL_PT, unit: 'PT' } },
          fields: 'widthType,width',
        },
      })

      const hdrCells = ['Support Activities', ...Array.from({ length: 31 }, (_, i) => String(i + 1))]

      for (let r = tableRows.length - 1; r >= 0; r--) {
        const row = tableRows[r]
        for (let c = NUM_COLS - 1; c >= 0; c--) {
          let text
          if (r === 0) {
            text = hdrCells[c]
          } else if (c === 0) {
            const item = section.items[r - 1]
            text = `${item.label}\n(${item.freq})`
          }
          if (!text) continue
          const cellIdx = row.tableCells[c]?.content?.[0]?.startIndex
          if (cellIdx == null) continue
          allInsertions.push({ cellIdx, textLen: text.length, isHeader: r === 0 })
          requests.push({ insertText: { location: { index: cellIdx }, text } })
        }
      }
    }

    // Bold the "Support Activities" header row cells
    const sortedAsc = [...allInsertions].sort((a, b) => a.cellIdx - b.cellIdx)
    let cumLen = 0
    const shiftMap = new Map()
    for (const { cellIdx, textLen } of sortedAsc) {
      shiftMap.set(cellIdx, cumLen)
      cumLen += textLen
    }
    for (const { cellIdx, textLen, isHeader } of allInsertions) {
      if (!isHeader) continue
      const finalStart = cellIdx + (shiftMap.get(cellIdx) ?? 0)
      requests.push({
        updateTextStyle: {
          range: { startIndex: finalStart, endIndex: finalStart + textLen },
          textStyle: { bold: true },
          fields: 'bold',
        },
      })
    }

    // ── Header: CENTER alignment + text styles ──────────────────────────────
    const _hl1 = `SP Initial Checklist for:   Alexandra Stevenson   SP Dates: from   10/1/26 - 9/30/27\n`
    const _hl2 = `Month: ${monthName}   Year: ${year}   Provider: Blue Ridge  Service: Sponsored-Residential\n`
    const _p1End = 1 + _hl1.length    // 86
    const _p2End = _p1End + 1         // 87 (blank para)
    const _p3End = _p2End + _hl2.length

    requests.push({ updateParagraphStyle: { range: { startIndex: 1, endIndex: _p2End }, paragraphStyle: { alignment: 'CENTER' }, fields: 'alignment' } })
    requests.push({ updateParagraphStyle: { range: { startIndex: _p2End, endIndex: _p3End }, paragraphStyle: { alignment: 'CENTER' }, fields: 'alignment' } })
    // "Alexandra Stevenson": bold + underline (offset 28 from start = idx 29, length 19)
    requests.push({ updateTextStyle: { range: { startIndex: 29, endIndex: 48 }, textStyle: { bold: true, underline: true }, fields: 'bold,underline' } })
    // "10/1/26 - 9/30/27\n": bold + italic (offset 67 = idx 68, through end of para 1)
    requests.push({ updateTextStyle: { range: { startIndex: 68, endIndex: _p1End }, textStyle: { bold: true, italic: true }, fields: 'bold,italic' } })

    // ── Footer: underline names + bold last two lines ────────────────────────
    const ftrStart = endIdx + cumLen
    // Heather Weimer: ftrStart+208, length 14
    requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 208, endIndex: ftrStart + 222 }, textStyle: { underline: true }, fields: 'underline' } })
    // Scott Weimer + 4 spaces: ftrStart+288, length 16
    requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 288, endIndex: ftrStart + 304 }, textStyle: { underline: true }, fields: 'underline' } })
    // "These checklists belong to...": ftrStart+356, length 105
    requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 356, endIndex: ftrStart + 461 }, textStyle: { bold: true }, fields: 'bold' } })
    // "VA ISP Checklist    rev. 4.1.15\n": ftrStart+461, length 32
    requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 461, endIndex: ftrStart + 493 }, textStyle: { bold: true }, fields: 'bold' } })

    const bFinal = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    })
    if (!bFinal.ok) throw new Error(await bFinal.text())
  }

  async function saveToChecklist(ispChecked, dateObj) {
    if (!accessToken) return

    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const year = dateObj.getFullYear()
    const day = dateObj.getDate()  // 1-31 → column index
    const docName = `${month}/${year}-DailyChecklist`
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' })

    let docId = await findDoc(docName)
    if (!docId) {
      docId = await createDoc(docName)
      await createChecklistDoc(docId, monthName, year)
    }

    const docRes = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    const doc = await docRes.json()
    const tables = (doc.body?.content ?? []).filter(el => el.table)
    if (tables.length < ISP_SECTIONS.length) throw new Error('Checklist tables not found')

    const requests = []

    for (const [itemId, { sectionIdx, rowIdx }] of Object.entries(CHECKLIST_ITEM_MAP)) {
      if (!ispChecked[itemId]) continue
      const cell = tables[sectionIdx]?.table?.tableRows?.[rowIdx]?.tableCells?.[day]
      if (!cell) continue
      const existing = (cell.content ?? [])
        .flatMap(p => (p.paragraph?.elements ?? []).map(e => e.textRun?.content ?? ''))
        .join('').replace(/\n/g, '').trim()
      if (existing) continue
      requests.push({ insertText: { location: { index: cell.content[0].startIndex }, text: '•' } })
    }

    if (requests.length === 0) return { docId, docName }

    requests.sort((a, b) => b.insertText.location.index - a.insertText.location.index)

    const r = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    })
    if (!r.ok) throw new Error(await r.text())

    return { docId, docName }
  }

  async function saveAsDailyNotes(ispChecked, ispResponses, dateObj, sponsorName, reliefName, menu = {}) {
    if (!accessToken) return
    setSaveStatus('saving')

    try {
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const year = dateObj.getFullYear()
      const docName = `${month}/${year}-DailyNotes`

      let docId = await findDoc(docName)
      if (!docId) docId = await createDoc(docName)

      // Read doc to find insertion point
      const docRes = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
      const doc = await docRes.json()
      const bodyContent = doc.body?.content ?? []
      const lastEl = bodyContent[bodyContent.length - 1]
      const insertAt = Math.max(1, (lastEl?.endIndex ?? 2) - 1)
      const isFirstEntry = insertAt <= 1

      // Header text
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
      const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}/${dateObj.getFullYear()}`
      const docOnceHeader = isFirstEntry
        ? 'ISP Dates: from 10/1/26 - 9/30/27                     \nProvider: Blue Ridge  Service: Sponsored-Residential\x0b\n'
        : ''
      const firstLine = `Daily Notes for: ${dayName}, ${dateStr}\n`
      const headerText = docOnceHeader + firstLine

      // Section labels as they appear in the Daily Notes doc
      const SECTION_LABELS = {
        'outcome2':        'Outcome 2 # Alex enjoys choosing and participating in activities in order to enjoy life.',
        'essential-risks': 'Essential Identified / Potential Risks',
        'routine-supports': 'Routine Supports',
      }

      // Build ordered row list: header row, then for each section: divider + items
      const tableContents = [{ texts: ['Support Activity', 'Notes'] }]
      for (const section of ISP_SECTIONS) {
        tableContents.push({ texts: [SECTION_LABELS[section.id] ?? section.label, ''] })
        for (const item of section.items) {
          const checked = !!ispChecked[item.id]
          const response = checked ? (ispResponses[item.id] ?? item.defaultResponse) : 'N/A'
          tableContents.push({ texts: [`${item.label} (${item.freq})`, response] })
        }
      }

      const numRows = tableContents.length  // 38: 1 header + 3 section dividers + 34 items
      const numCols = 2

      // BatchUpdate 1: insert header text + empty table (+ set margins on first entry)
      const batch1Requests = [
        { insertText: { location: { index: insertAt }, text: headerText } },
        { insertTable: { rows: numRows, columns: numCols, location: { index: insertAt + headerText.length } } },
      ]
      if (isFirstEntry) {
        batch1Requests.unshift({
          updateDocumentStyle: {
            documentStyle: {
              marginTop: { magnitude: 36, unit: 'PT' },
              marginBottom: { magnitude: 36, unit: 'PT' },
            },
            fields: 'marginTop,marginBottom',
          },
        })
      }
      const batchRes1 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: batch1Requests }),
      })
      if (!batchRes1.ok) throw new Error(await batchRes1.text())

      // Read doc again to get actual cell positions
      const doc2Res = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
      const doc2 = await doc2Res.json()
      const bodyContent2 = doc2.body?.content ?? []

      // Find the table just inserted (last table at or after insertAt)
      const tableEl = [...bodyContent2].reverse().find(el => el.table && el.startIndex >= insertAt)
      if (!tableEl) throw new Error('Table not found after insertion')

      const tableRows = tableEl.table.tableRows
      const tableEndIndex = tableEl.endIndex

      // Thu(4)/Fri(5)/Sat(6) → Scott (Relief) signs; Sun(0)/Mon(1)/Tue(2)/Wed(3) → Heather (Sponsor) signs
      const dow = dateObj.getDay()
      const sigDate = `${month}/${String(dateObj.getDate()).padStart(2, '0')}/${dateObj.getFullYear()}`
      const scottSigns = dow >= 4
      const sponsorDateStr = scottSigns ? ' '.repeat(10) : sigDate
      const reliefDateStr  = scottSigns ? sigDate        : ' '.repeat(10)
      const sigSpaces = ' '.repeat(28)
      const footerText = `\nSponsor: ${sponsorName}  ${sigSpaces}    ${sponsorDateStr}\n\nRelief Staff: ${reliefName}  ${sigSpaces}    ${reliefDateStr}\n\n(sign and date by writer of note)\n`

      // BatchUpdate 2: footer (highest index first), then cells HIGH→LOW, then optional page break
      const requests = []

      requests.push({
        insertText: { location: { index: tableEndIndex }, text: footerText },
      })

      // Track insertions for computing final positions (needed for bold styling)
      const allInsertions = []  // { cellIdx, textLen } in HIGH→LOW order

      for (let r = numRows - 1; r >= 0; r--) {
        const row = tableRows[r]
        const { texts } = tableContents[r]

        for (let c = numCols - 1; c >= 0; c--) {
          const text = texts[c]
          if (!text) continue
          const cellIdx = row.tableCells[c].content[0].startIndex
          allInsertions.push({ cellIdx, textLen: text.length })
          requests.push({ insertText: { location: { index: cellIdx }, text } })
        }
      }

      // finalPos(P) = P + sum(textLen for all cells originally below P)
      // (insertions at lower positions run after and shift P upward)
      const sortedAsc = [...allInsertions].sort((a, b) => a.cellIdx - b.cellIdx)
      let cumLen = 0
      const shiftMap = new Map()
      for (const { cellIdx, textLen } of sortedAsc) {
        shiftMap.set(cellIdx, cumLen)
        cumLen += textLen
      }

      // Bold row indices: column header (row 0) + each section divider row
      const boldRowSet = new Set([0])
      let bri = 1
      for (const section of ISP_SECTIONS) {
        boldRowSet.add(bri)
        bri += 1 + section.items.length
      }

      for (const r of boldRowSet) {
        const row = tableRows[r]
        const { texts } = tableContents[r]
        for (let c = 0; c < numCols; c++) {
          const text = texts[c]
          if (!text) continue
          const cellIdx = row.tableCells[c].content[0].startIndex
          const finalStart = cellIdx + (shiftMap.get(cellIdx) ?? 0)
          requests.push({
            updateTextStyle: {
              range: { startIndex: finalStart, endIndex: finalStart + text.length },
              textStyle: { bold: true },
              fields: 'bold',
            },
          })
        }
      }

      if (!isFirstEntry) {
        requests.push({
          updateParagraphStyle: {
            range: { startIndex: insertAt, endIndex: insertAt + firstLine.length },
            paragraphStyle: { pageBreakBefore: true },
            fields: 'pageBreakBefore',
          },
        })
      }

      // ── First-entry header: CENTER + bold+underline on date ─────────────────
      if (isFirstEntry) {
        const _ispLine = 'ISP Dates: from 10/1/26 - 9/30/27                     \n'
        const _provLine = 'Provider: Blue Ridge  Service: Sponsored-Residential\x0b\n'
        const _ispEnd = insertAt + _ispLine.length   // 56
        const _provEnd = _ispEnd + _provLine.length  // 110
        requests.push({ updateParagraphStyle: { range: { startIndex: insertAt, endIndex: _ispEnd }, paragraphStyle: { alignment: 'CENTER' }, fields: 'alignment' } })
        requests.push({ updateParagraphStyle: { range: { startIndex: _ispEnd, endIndex: _provEnd }, paragraphStyle: { alignment: 'CENTER' }, fields: 'alignment' } })
        // "10/1/26 - 9/30/27                     \n": bold + underline
        requests.push({ updateTextStyle: { range: { startIndex: insertAt + 16, endIndex: _ispEnd }, textStyle: { bold: true, underline: true }, fields: 'bold,underline' } })
      }

      // ── Footer styling ────────────────────────────────────────────────────────
      // Layout (both signing cases identical — blank lines + fixed 10-char dates):
      //   ftrStart+0:          \n (leading blank)
      //   ftrStart+1:          Sponsor line (54+sLen chars)  → ends at ftrStart+54+sLen
      //   ftrStart+55+sLen:    \n (blank between Sponsor and Relief)
      //   ftrStart+56+sLen:    Relief line (59+rLen chars)   → ends at ftrStart+114+sLen+rLen
      //   ftrStart+115+sLen+rLen: \n (blank before sign-date)
      //   ftrStart+116+sLen+rLen: (sign and date by writer of note)\n  (34 chars)
      const ftrStart = tableEndIndex + cumLen
      const sLen = sponsorName.length
      const rLen = reliefName.length
      // Bold: "Sponsor: " + name + " "
      requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 1, endIndex: ftrStart + 11 + sLen }, textStyle: { bold: true }, fields: 'bold' } })
      // Bold: "Relief Staff: " + name + " "
      requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 56 + sLen, endIndex: ftrStart + 71 + sLen + rLen }, textStyle: { bold: true }, fields: 'bold' } })
      // Bold: "(sign and date by writer of note)\n"
      requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 116 + sLen + rLen, endIndex: ftrStart + 150 + sLen + rLen }, textStyle: { bold: true }, fields: 'bold' } })
      // Underline: Sponsor signature area (28 spaces at ftrStart+12+sLen)
      requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 12 + sLen, endIndex: ftrStart + 40 + sLen }, textStyle: { underline: true }, fields: 'underline' } })
      // Underline: Sponsor date area (10 chars at ftrStart+44+sLen)
      requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 44 + sLen, endIndex: ftrStart + 54 + sLen }, textStyle: { underline: true }, fields: 'underline' } })
      // Underline: Relief signature area (28 spaces at ftrStart+72+sLen+rLen)
      requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 72 + sLen + rLen, endIndex: ftrStart + 100 + sLen + rLen }, textStyle: { underline: true }, fields: 'underline' } })
      // Underline: Relief date area (10 chars at ftrStart+104+sLen+rLen)
      requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 104 + sLen + rLen, endIndex: ftrStart + 114 + sLen + rLen }, textStyle: { underline: true }, fields: 'underline' } })

      const batchRes2 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      })
      if (!batchRes2.ok) throw new Error(await batchRes2.text())

      // Scott (Relief) signs Thu/Fri/Sat → underscore start in Relief line; Heather (Sponsor) signs Sun–Wed → Sponsor line
      const sigIndex = scottSigns
        ? ftrStart + 72 + sLen + rLen
        : ftrStart + 12 + sLen
      insertDailyNotesSignature(docId, sigIndex, scottSigns)
        .catch(err => console.error('Signature insert failed:', err))

      setSaveStatus({ docId, docName })
    } catch (err) {
      console.error('Daily notes save error:', err)
      setSaveStatus('error')
    }
  }

  // dayFilter: array of day numbers to check (1-31), or null to check all days
  async function fetchOneMonthChecklist(year, month, dayFilter = null) {
    const mm = String(month).padStart(2, '0')
    const docId = await findDoc(`${mm}/${year}-DailyChecklist`)
    if (!docId) return new Set()
    const res = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    if (!res.ok) return new Set()
    const doc = await res.json()
    const tables = (doc.body?.content ?? []).filter(el => el.table)
    if (!tables.length) return new Set()
    const cols = dayFilter ?? Array.from({ length: 31 }, (_, i) => i + 1)
    const checked = new Set()
    for (const [itemId, { sectionIdx, rowIdx }] of Object.entries(CHECKLIST_ITEM_MAP)) {
      const row = tables[sectionIdx]?.table?.tableRows?.[rowIdx]
      if (!row) continue
      for (const c of cols) {
        const text = row.tableCells[c]?.content?.[0]?.paragraph?.elements?.[0]?.textRun?.content ?? ''
        if (text.includes('•')) { checked.add(itemId); break }
      }
    }
    return checked
  }

  async function fetchCheckedThisMonth(dateObj) {
    if (!accessToken) return new Set()
    return fetchOneMonthChecklist(dateObj.getFullYear(), dateObj.getMonth() + 1)
  }

  async function fetchCheckedThisQuarter(dateObj) {
    if (!accessToken) return new Set()
    const months = [0, 1, 2].map(i => {
      const d = new Date(dateObj.getFullYear(), dateObj.getMonth() - i, 1)
      return fetchOneMonthChecklist(d.getFullYear(), d.getMonth() + 1)
    })
    const sets = await Promise.all(months)
    const combined = new Set()
    for (const s of sets) for (const id of s) combined.add(id)
    return combined
  }

  async function fetchCheckedThisWeek(dateObj) {
    if (!accessToken) return new Set()
    // Build Sun–Sat week, grouped by month (week can span two months)
    const dow = dateObj.getDay()
    const monthDays = new Map()  // 'YYYY-M' → { year, month, days[] }
    for (let i = 0; i < 7; i++) {
      const d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() - dow + i)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (!monthDays.has(key)) monthDays.set(key, { year: d.getFullYear(), month: d.getMonth() + 1, days: [] })
      monthDays.get(key).days.push(d.getDate())
    }
    const sets = await Promise.all(
      Array.from(monthDays.values()).map(({ year, month, days }) => fetchOneMonthChecklist(year, month, days))
    )
    const combined = new Set()
    for (const s of sets) for (const id of s) combined.add(id)
    return combined
  }

  async function createWaterTempDoc(docId, month, year) {
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
    const NUM_COLS = 4
    const COL_WIDTHS = [40, 200, 160, 140]  // 540pt total = 612pt letter - 72pt margins
    const BLUE = { red: 0, green: 0, blue: 128 / 255 }  // #000080

    const b1 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{
          updateDocumentStyle: {
            documentStyle: {
              marginTop:    { magnitude: 36, unit: 'PT' },
              marginBottom: { magnitude: 36, unit: 'PT' },
              marginLeft:   { magnitude: 36, unit: 'PT' },
              marginRight:  { magnitude: 36, unit: 'PT' },
            },
            fields: 'marginTop,marginBottom,marginLeft,marginRight',
          },
        }],
      }),
    })
    if (!b1.ok) throw new Error(await b1.text())

    const bTable = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ insertTable: { rows: 32, columns: NUM_COLS, location: { index: 1 } } }] }),
    })
    if (!bTable.ok) throw new Error(await bTable.text())

    // Line 1 has 3 segments with different font sizes (matching original doc)
    const hdrL1p1 = `Water Temperature Log                 `  // 14pt
    const hdrL1p2 = `Individual Service Record`               // 10pt
    const hdrL1p3 = `                             Blue Ridge Residential Services\n`  // 8pt
    const hdrLine1 = hdrL1p1 + hdrL1p2 + hdrL1p3
    const hdrLine2 = `Bath/Shower water temperature shall not exceed 110 °F and not less than 100 °F.\n`
    const hdrLine3 = `Location: Weimer Home     Individual Name: Alexandra Stevenson\n`
    const hdrLine4 = `Month: ${monthName}   Year: ${year}\n`
    const hdrText = hdrLine1 + hdrLine2 + '\n' + hdrLine3 + '\n' + hdrLine4

    // Start positions of each line (body index 1 after insertion)
    const hdrL2Start = 1 + hdrLine1.length
    const hdrL3Start = hdrL2Start + hdrLine2.length + 1
    const hdrL4Start = hdrL3Start + hdrLine3.length + 1

    const bHdr = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ insertText: { location: { index: 1 }, text: hdrText } }] }),
    })
    if (!bHdr.ok) throw new Error(await bHdr.text())

    const docRes = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    const doc = await docRes.json()
    const bodyContent = doc.body?.content ?? []
    const tableEl = bodyContent.find(el => el.table)
    if (!tableEl) throw new Error('Water temp table not found')
    const lastEl = bodyContent[bodyContent.length - 1]
    const endIdx = Math.max(1, (lastEl?.endIndex ?? 2) - 1)

    const ftrText =
      `\nStaff initials _______    = Printed Name: Heather Weimer\n` +
      `Staff initials _______    = Printed Name: Scott Weimer`

    const requests = []
    requests.push({ insertText: { location: { index: endIdx }, text: ftrText } })

    const tableStartIdx = tableEl.startIndex
    COL_WIDTHS.forEach((w, i) => {
      requests.push({
        updateTableColumnProperties: {
          tableStartLocation: { index: tableStartIdx },
          columnIndices: [i],
          tableColumnProperties: { widthType: 'FIXED_WIDTH', width: { magnitude: w, unit: 'PT' } },
          fields: 'widthType,width',
        },
      })
    })

    const tableRows = tableEl.table.tableRows
    const hdrCells = ['Day', 'Type of Bathing', 'Water Temperature', 'Staff\nInitials']
    const allInsertions = []

    for (let r = tableRows.length - 1; r >= 0; r--) {
      const row = tableRows[r]
      for (let c = NUM_COLS - 1; c >= 0; c--) {
        const text = r === 0 ? hdrCells[c] : c === 0 ? String(r) : null
        if (!text) continue
        const cellIdx = row.tableCells[c]?.content?.[0]?.startIndex
        if (cellIdx == null) continue
        allInsertions.push({ cellIdx, textLen: text.length, isHeader: r === 0, isDayCol: r > 0 && c === 0 })
        requests.push({ insertText: { location: { index: cellIdx }, text } })
      }
    }

    const sortedAsc = [...allInsertions].sort((a, b) => a.cellIdx - b.cellIdx)
    let cumLen = 0
    const shiftMap = new Map()
    for (const { cellIdx, textLen } of sortedAsc) { shiftMap.set(cellIdx, cumLen); cumLen += textLen }
    const totalCellChars = cumLen

    // Helper: cumulative shift for any index not in shiftMap (e.g. empty cells)
    const shiftBelow = (targetIdx) => {
      let s = 0
      for (const { cellIdx, textLen } of sortedAsc) { if (cellIdx < targetIdx) s += textLen; else break }
      return s
    }

    const TNR = { fontFamily: 'Times New Roman' }

    for (const { cellIdx, textLen, isHeader, isDayCol } of allInsertions) {
      const finalStart = cellIdx + (shiftMap.get(cellIdx) ?? 0)
      if (isHeader) {
        requests.push({
          updateTextStyle: {
            range: { startIndex: finalStart, endIndex: finalStart + textLen },
            textStyle: { bold: true, weightedFontFamily: TNR },
            fields: 'bold,weightedFontFamily',
          },
        })
      }
      if (isDayCol) {
        requests.push({
          updateTextStyle: {
            range: { startIndex: finalStart, endIndex: finalStart + textLen },
            textStyle: { weightedFontFamily: TNR },
            fields: 'weightedFontFamily',
          },
        })
      }
      if (isHeader || isDayCol) {
        requests.push({
          updateParagraphStyle: {
            range: { startIndex: finalStart, endIndex: finalStart + textLen },
            paragraphStyle: { alignment: 'CENTER' },
            fields: 'alignment',
          },
        })
      }
    }

    // Center water temperature column (c=2, r>0) — empty cells, indices shift from lower insertions
    for (let r = 1; r < tableRows.length; r++) {
      const origIdx = tableRows[r].tableCells[2]?.content?.[0]?.startIndex
      if (origIdx == null) continue
      const finalIdx = origIdx + shiftBelow(origIdx)
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: finalIdx, endIndex: finalIdx + 1 },
          paragraphStyle: { alignment: 'CENTER' },
          fields: 'alignment',
        },
      })
    }

    // Center lines 2–4 of the doc header
    for (const [start, len] of [
      [hdrL2Start, hdrLine2.length],
      [hdrL3Start, hdrLine3.length],
      [hdrL4Start, hdrLine4.length],
    ]) {
      requests.push({
        updateParagraphStyle: {
          range: { startIndex: start, endIndex: start + len },
          paragraphStyle: { alignment: 'CENTER' },
          fields: 'alignment',
        },
      })
    }

    // Line 1: 3-segment styling (14pt / 10pt / 8pt, all #000080 bold underline)
    for (const [start, len, size] of [
      [1,                                        hdrL1p1.length, 14],
      [1 + hdrL1p1.length,                       hdrL1p2.length, 10],
      [1 + hdrL1p1.length + hdrL1p2.length,      hdrL1p3.length,  8],
    ]) {
      requests.push({
        updateTextStyle: {
          range: { startIndex: start, endIndex: start + len },
          textStyle: { bold: true, underline: true, fontSize: { magnitude: size, unit: 'PT' }, foregroundColor: { color: { rgbColor: BLUE } } },
          fields: 'bold,underline,fontSize,foregroundColor',
        },
      })
    }

    // Line 2: italic 12pt
    requests.push({
      updateTextStyle: {
        range: { startIndex: hdrL2Start, endIndex: hdrL2Start + hdrLine2.length },
        textStyle: { italic: false, fontSize: { magnitude: 12, unit: 'PT' }, backgroundColor: { color: { rgbColor: { red: 1, green: 1, blue: 0 } } } },
        fields: 'italic,fontSize,backgroundColor',
      },
    })

    // Line 3: "Location: " bold / "Weimer Home" bold+underline / "     Individual Name: " bold / "Alexandra Stevenson\n" bold+underline — all Times New Roman
    const l3 = hdrL3Start
    for (const [off, len, style] of [
      [0,  10, { bold: true, weightedFontFamily: TNR }],
      [10, 11, { bold: true, underline: true, weightedFontFamily: TNR }],
      [21, 22, { bold: true, weightedFontFamily: TNR }],
      [43, hdrLine3.length - 43, { bold: true, underline: true, weightedFontFamily: TNR }],
    ]) {
      const fields = Object.keys(style).join(',')
      requests.push({ updateTextStyle: { range: { startIndex: l3 + off, endIndex: l3 + off + len }, textStyle: style, fields } })
    }

    // Line 4: "Month: " bold / monthName bold+underline / "   Year: " bold / year bold+underline — all Times New Roman
    const l4 = hdrL4Start
    const mnLen = monthName.length
    const yrLen = String(year).length
    for (const [off, len, style] of [
      [0,             7,     { bold: true, weightedFontFamily: TNR }],
      [7,             mnLen, { bold: true, underline: true, weightedFontFamily: TNR }],
      [7 + mnLen,     9,     { bold: true, weightedFontFamily: TNR }],
      [7 + mnLen + 9, yrLen, { bold: true, underline: true, weightedFontFamily: TNR }],
    ]) {
      const fields = Object.keys(style).join(',')
      requests.push({ updateTextStyle: { range: { startIndex: l4 + off, endIndex: l4 + off + len }, textStyle: style, fields } })
    }

    // Footer: underline the two names (positions relative to footer start after all cell insertions)
    const ftrStart = endIdx + totalCellChars
    // "\n" + "Staff... Printed Name: "(42) + "Heather Weimer\n"(15) + "Staff..."(42) + "Scott Weimer"(12)
    requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 43, endIndex: ftrStart + 58 }, textStyle: { underline: true }, fields: 'underline' } })
    requests.push({ updateTextStyle: { range: { startIndex: ftrStart + 101, endIndex: ftrStart + 113 }, textStyle: { underline: true }, fields: 'underline' } })

    const bFinal = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    })
    if (!bFinal.ok) throw new Error(await bFinal.text())
  }

  async function createBMChartDoc(docId, month, year) {
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long' })
    const TITLE_BLUE = { red: 11 / 255, green: 83 / 255, blue: 148 / 255 }
    const TNR = { fontFamily: 'Times New Roman' }
    const ARIAL = { fontFamily: 'Arial' }
    const MAIN_COLS = 5
    const MAIN_COL_WIDTHS = [50.4, 49.5, 67.5, 270, 72]
    const MAIN_HEADERS = ['Date', 'Time', 'BM Type*', 'Notes', 'Staff\nInitials']
    const KEY_COLS = 3
    const KEY_COL_WIDTHS = [50.4, 364.5, 94.5]
    const KEY_HEADERS = ['Type', 'Description', 'Image']
    const BRISTOL = [
      ['1', 'Separate hard lumps, like nuts'],
      ['2', 'Sausage-shaped but lumpy'],
      ['3', 'Like a sausage or snake but with cracks on its surface'],
      ['4', 'Like a sausage or snake, smooth and soft'],
      ['5', 'Soft blobs with clear-cut edges'],
      ['6', 'Fluffy pieces with ragged edges, a mushy stool'],
      ['7', 'Watery, no solid pieces'],
    ]

    const b1 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [{ updateDocumentStyle: {
          documentStyle: {
            marginTop:    { magnitude: 36, unit: 'PT' },
            marginBottom: { magnitude: 36, unit: 'PT' },
            marginLeft:   { magnitude: 36, unit: 'PT' },
            marginRight:  { magnitude: 36, unit: 'PT' },
          },
          fields: 'marginTop,marginBottom,marginLeft,marginRight',
        } }],
      }),
    })
    if (!b1.ok) throw new Error(await b1.text())

    const b2 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ insertTable: { rows: 32, columns: MAIN_COLS, location: { index: 1 } } }] }),
    })
    if (!b2.ok) throw new Error(await b2.text())

    const titleLine = `Bowel Movement Chart${' '.repeat(71)}Blue Ridge Residential Services\n\n`
    const hdrText = titleLine + `Individual Name:   Alexandra Stevenson   Month: ${monthName}   Year: ${year}\n`
    const b3 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ insertText: { location: { index: 1 }, text: hdrText } }] }),
    })
    if (!b3.ok) throw new Error(await b3.text())

    const docRes1 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    const doc1 = await docRes1.json()
    const lastEl1 = (doc1.body?.content ?? [])[doc1.body.content.length - 1]
    const endIdx1 = Math.max(1, (lastEl1?.endIndex ?? 2) - 1)

    const postText = `\nInitials ______ = Printed Name: Heather Weimer\nInitials ______ = Printed Name: Scott Weimer\n\n*BM Type Key:\n`
    const b4 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ insertText: { location: { index: endIdx1 }, text: postText } }] }),
    })
    if (!b4.ok) throw new Error(await b4.text())

    const docRes2 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    const doc2 = await docRes2.json()
    const lastEl2 = (doc2.body?.content ?? [])[doc2.body.content.length - 1]
    const endIdx2 = Math.max(1, (lastEl2?.endIndex ?? 2) - 1)

    const b5 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ insertTable: { rows: 8, columns: KEY_COLS, location: { index: endIdx2 } } }] }),
    })
    if (!b5.ok) throw new Error(await b5.text())

    const docRes3 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    const doc3 = await docRes3.json()
    const bodyContent3 = doc3.body?.content ?? []
    const tables3 = bodyContent3.filter(el => el.table)
    const mainTable = tables3[0]
    const keyTable = tables3[1]
    if (!mainTable || !keyTable) throw new Error('BM tables not found after creation')
    const findPara = (prefix) => bodyContent3.find(el => {
      if (!el.paragraph) return false
      return (el.paragraph.elements ?? []).map(e => e.textRun?.content ?? '').join('').startsWith(prefix)
    })
    const initialsParas = bodyContent3.filter(el => {
      if (!el.paragraph) return false
      return (el.paragraph.elements ?? []).map(e => e.textRun?.content ?? '').join('').startsWith('Initials ______')
    })
    const bmKeyPara = findPara('*BM Type Key:')

    const insertReqs = []
    const allInsertions = []

    const mainRows = mainTable.table.tableRows
    for (let r = mainRows.length - 1; r >= 0; r--) {
      for (let c = MAIN_COLS - 1; c >= 0; c--) {
        let text = null
        if (r === 0) text = MAIN_HEADERS[c]
        if (!text) continue
        const cellIdx = mainRows[r].tableCells[c]?.content?.[0]?.startIndex
        if (cellIdx == null) continue
        allInsertions.push({ cellIdx, text, table: 'main', r, c })
      }
    }

    const keyRows = keyTable.table.tableRows
    for (let r = keyRows.length - 1; r >= 0; r--) {
      for (let c = KEY_COLS - 1; c >= 0; c--) {
        let text = null
        if (r === 0) text = KEY_HEADERS[c]
        else if (c === 0) text = BRISTOL[r - 1][0]
        else if (c === 1) text = BRISTOL[r - 1][1]
        if (!text) continue
        const cellIdx = keyRows[r].tableCells[c]?.content?.[0]?.startIndex
        if (cellIdx == null) continue
        allInsertions.push({ cellIdx, text, table: 'key', r, c })
      }
    }

    // Sort ALL insertions globally HIGH→LOW so requests don't invalidate each other's indices
    for (const { cellIdx, text } of [...allInsertions].sort((a, b) => b.cellIdx - a.cellIdx)) {
      insertReqs.push({ insertText: { location: { index: cellIdx }, text } })
    }

    const sortedAsc = [...allInsertions].sort((a, b) => a.cellIdx - b.cellIdx)
    let cumLen = 0
    const shiftMap = new Map()
    for (const { cellIdx, text } of sortedAsc) { shiftMap.set(cellIdx, cumLen); cumLen += text.length }

    const shiftBelow = (targetIdx) => {
      let s = 0
      for (const { cellIdx, text } of sortedAsc) { if (cellIdx < targetIdx) s += text.length; else break }
      return s
    }

    // Column widths must be set BEFORE bInsert — after bInsert the key table
    // startIndex shifts by the sum of chars inserted into the main table, making
    // the doc3 index stale. Setting widths here while doc3 is current avoids that.
    const colWidthReqs = []
    MAIN_COL_WIDTHS.forEach((w, i) => colWidthReqs.push({
      updateTableColumnProperties: {
        tableStartLocation: { index: mainTable.startIndex },
        columnIndices: [i],
        tableColumnProperties: { widthType: 'FIXED_WIDTH', width: { magnitude: w, unit: 'PT' } },
        fields: 'widthType,width',
      },
    }))
    KEY_COL_WIDTHS.forEach((w, i) => colWidthReqs.push({
      updateTableColumnProperties: {
        tableStartLocation: { index: keyTable.startIndex },
        columnIndices: [i],
        tableColumnProperties: { widthType: 'FIXED_WIDTH', width: { magnitude: w, unit: 'PT' } },
        fields: 'widthType,width',
      },
    }))
    const bCols = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: colWidthReqs }),
    })
    if (!bCols.ok) {
      const errText = await bCols.text()
      console.error('BM chart bCols failed:', errText)
      throw new Error(errText)
    }

    const styleReqs = []

    for (const { cellIdx, text, table, r, c } of allInsertions) {
      const finalStart = cellIdx + (shiftMap.get(cellIdx) ?? 0)
      const finalEnd = finalStart + text.length
      const isMainHeader = table === 'main' && r === 0
      const isMainDay = table === 'main' && r > 0 && c === 0
      const isKeyHeader = table === 'key' && r === 0
      const isKeyType = table === 'key' && r > 0 && c === 0
      const isKeyDesc = table === 'key' && r > 0 && c === 1

      if (isMainHeader) {
        styleReqs.push({
          updateTextStyle: {
            range: { startIndex: finalStart, endIndex: finalEnd },
            textStyle: { weightedFontFamily: TNR },
            fields: 'weightedFontFamily',
          },
        })
        styleReqs.push({
          updateParagraphStyle: {
            range: { startIndex: finalStart, endIndex: finalEnd },
            paragraphStyle: { alignment: 'CENTER' },
            fields: 'alignment',
          },
        })
      }
      if (isKeyHeader) {
        styleReqs.push({
          updateTextStyle: {
            range: { startIndex: finalStart, endIndex: finalEnd },
            textStyle: { bold: true, weightedFontFamily: TNR },
            fields: 'bold,weightedFontFamily',
          },
        })
        styleReqs.push({
          updateParagraphStyle: {
            range: { startIndex: finalStart, endIndex: finalEnd },
            paragraphStyle: { alignment: 'CENTER' },
            fields: 'alignment',
          },
        })
      }
      if (isMainDay) {
        styleReqs.push({
          updateParagraphStyle: {
            range: { startIndex: finalStart, endIndex: finalEnd },
            paragraphStyle: { alignment: 'CENTER' },
            fields: 'alignment',
          },
        })
      }
      if (isKeyType) {
        styleReqs.push({
          updateTextStyle: {
            range: { startIndex: finalStart, endIndex: finalEnd },
            textStyle: { bold: true },
            fields: 'bold',
          },
        })
        styleReqs.push({
          updateParagraphStyle: {
            range: { startIndex: finalStart, endIndex: finalEnd },
            paragraphStyle: { alignment: 'CENTER' },
            fields: 'alignment',
          },
        })
      }
    }

    // Title: single line, full-width underline
    // [1, 92]  = "Bowel Movement Chart" + 71 spaces — bold, underline, 14pt, TITLE_BLUE
    // [92, 123] = "Blue Ridge Residential Services" — underline, 8pt, TITLE_BLUE, no bold
    styleReqs.push({
      updateParagraphStyle: {
        range: { startIndex: 1, endIndex: 1 + titleLine.length },
        paragraphStyle: { spaceBelow: { magnitude: 0, unit: 'PT' } },
        fields: 'spaceBelow',
      },
    })
    styleReqs.push({
      updateTextStyle: {
        range: { startIndex: 1, endIndex: 92 },
        textStyle: { bold: true, underline: true, fontSize: { magnitude: 14, unit: 'PT' }, weightedFontFamily: TNR, foregroundColor: { color: { rgbColor: TITLE_BLUE } } },
        fields: 'bold,underline,fontSize,weightedFontFamily,foregroundColor',
      },
    })
    styleReqs.push({
      updateTextStyle: {
        range: { startIndex: 92, endIndex: 123 },
        textStyle: { bold: false, underline: true, fontSize: { magnitude: 8, unit: 'PT' }, weightedFontFamily: TNR, foregroundColor: { color: { rgbColor: TITLE_BLUE } } },
        fields: 'bold,underline,fontSize,weightedFontFamily,foregroundColor',
      },
    })

    // Individual name line: labels bold TNR, values underline-only TNR
    // hdrText = "Individual Name:   Alexandra Stevenson   Month: ${monthName}   Year: ${year}\n"
    // label offsets (0-based from individual line start): "Individual Name:" @0, "Month:" @41, "Year:" @(48+mLen+3)
    const _tlLen = titleLine.length
    const _nameStart = 1 + _tlLen + 19   // "Individual Name:   " = 19
    const _nameEnd = _nameStart + 19
    const _mnStart = _nameEnd + 10       // "   Month: " = 10
    const _mnEnd = _mnStart + monthName.length
    const _yrStart = _mnEnd + 9          // "   Year: " = 9
    const _yrEnd = _yrStart + String(year).length
    // Labels: "Individual Name:", "Month:", "Year:" — bold TNR
    for (const [s, e] of [
      [1 + _tlLen, 1 + _tlLen + 16],   // "Individual Name:"
      [_mnStart - 7, _mnStart - 1],    // "Month:" (within "   Month: ")
      [_yrStart - 6, _yrStart - 1],    // "Year:" (within "   Year: ")
    ]) {
      styleReqs.push({
        updateTextStyle: {
          range: { startIndex: s, endIndex: e },
          textStyle: { bold: true, weightedFontFamily: TNR },
          fields: 'bold,weightedFontFamily',
        },
      })
    }
    // Values: name, monthName, year — underline-only TNR
    for (const [s, e] of [[_nameStart, _nameEnd], [_mnStart, _mnEnd], [_yrStart, _yrEnd]]) {
      styleReqs.push({
        updateTextStyle: {
          range: { startIndex: s, endIndex: e },
          textStyle: { underline: true, weightedFontFamily: TNR },
          fields: 'underline,weightedFontFamily',
        },
      })
    }

    // Initials lines: "Initials" bold, "Printed Name:" bold, name underline
    // Line structure: "Initials" (8) + " ______ = " (10) + "Printed Name:" (13) + " " (1) + name
    for (const para of initialsParas) {
      const initShift = shiftBelow(para.startIndex)
      const initStart = para.startIndex + initShift
      const initLen = para.endIndex - para.startIndex - 1
      if (initLen < 32) continue
      styleReqs.push({ updateTextStyle: { range: { startIndex: initStart, endIndex: initStart + 8 }, textStyle: { bold: true }, fields: 'bold' } })
      styleReqs.push({ updateTextStyle: { range: { startIndex: initStart + 18, endIndex: initStart + 31 }, textStyle: { bold: true }, fields: 'bold' } })
      styleReqs.push({ updateTextStyle: { range: { startIndex: initStart + 32, endIndex: initStart + initLen }, textStyle: { underline: true }, fields: 'underline' } })
    }

    // *BM Type Key: bold TNR
    if (bmKeyPara) {
      const keyShift = shiftBelow(bmKeyPara.startIndex)
      const keyStart = bmKeyPara.startIndex + keyShift
      const keyLen = bmKeyPara.endIndex - bmKeyPara.startIndex - 1
      styleReqs.push({
        updateTextStyle: {
          range: { startIndex: keyStart, endIndex: keyStart + keyLen },
          textStyle: { bold: true, weightedFontFamily: TNR },
          fields: 'bold,weightedFontFamily',
        },
      })
    }

    const bInsert = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: insertReqs }),
    })
    if (!bInsert.ok) {
      const errText = await bInsert.text()
      console.error('BM chart bInsert failed:', errText)
      throw new Error(errText)
    }

    const bStyle = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: styleReqs }),
    })
    if (!bStyle.ok) {
      const errText = await bStyle.text()
      console.error('BM chart bStyle failed:', errText)
      throw new Error(errText)
    }

    // Insert images into key table — best-effort, does not block data write
    insertBMImages(docId).catch(err => console.error('BM image insert failed:', err))
  }

  async function insertBMImages(docId) {
    // Use the app's own publicly served Vite assets as image URIs — no Drive upload needed.
    // Skipped in local dev since localhost isn't publicly reachable by the Docs API.
    const origin = window.location.origin
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.')) {
      console.log('BM images skipped in local dev — assets not publicly accessible')
      return
    }

    const docRes4 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    const doc4 = await docRes4.json()
    const keyTable4 = (doc4.body?.content ?? []).filter(el => el.table)[1]
    if (!keyTable4) throw new Error('Key table not found for image insertion')

    const imageReqs = []
    for (let r = 1; r <= 7; r++) {
      const cell = keyTable4.table.tableRows[r]?.tableCells[2]
      const cellIdx = cell?.content?.[0]?.startIndex
      if (cellIdx == null) continue
      imageReqs.push({
        insertInlineImage: {
          location: { index: cellIdx },
          uri: `${origin}${BM_IMAGE_URLS[r - 1]}`,
          objectSize: {
            height: { magnitude: 28, unit: 'PT' },
            width:  { magnitude: 75, unit: 'PT' },
          },
        },
      })
    }
    imageReqs.sort((a, b) => b.insertInlineImage.location.index - a.insertInlineImage.location.index)

    if (imageReqs.length) {
      const b6 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: imageReqs }),
      })
      if (!b6.ok) throw new Error(await b6.text())
    }
  }

  async function saveToBMChart(time, type, notes, dateObj, createIfMissing = true) {
    if (!accessToken) return
    if (!time && !type && !notes) return

    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const year = dateObj.getFullYear()
    const day = dateObj.getDate()
    const docName = `${month}/${year}-DailyBMChart`

    let docId = await findDoc(docName)
    if (!docId) {
      if (!createIfMissing) return
      docId = await createDoc(docName)
      await createBMChartDoc(docId, Number(month), year)
    }

    const docRes = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    const doc = await docRes.json()
    const tableEl = (doc.body?.content ?? []).find(el => el.table)
    if (!tableEl) throw new Error('BM chart table not found')

    const row = tableEl.table.tableRows[day]
    if (!row) throw new Error(`Row for day ${day} not found`)

    const cells = [
      { col: 3, text: notes },
      { col: 2, text: type },
      { col: 1, text: time },
      { col: 0, text: String(day) },
    ].filter(c => c.text)

    const requests = cells
      .map(({ col, text }) => {
        const cellIdx = row.tableCells[col]?.content?.[0]?.startIndex
        if (cellIdx == null) return null
        return { insertText: { location: { index: cellIdx }, text } }
      })
      .filter(Boolean)
      .sort((a, b) => b.insertText.location.index - a.insertText.location.index)

    if (!requests.length) return { docId, docName }

    console.log('BM data write — day:', day, 'cells:', cells.map(c => `col${c.col}=${c.text}`))
    const r = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    })
    if (!r.ok) {
      const errText = await r.text()
      console.error('BM data write failed:', errText)
      throw new Error(errText)
    }

    return { docId, docName }
  }

  async function saveToWaterTempLog(bathingType, waterTemp, dateObj) {
    if (!accessToken) return
    if (!bathingType && !waterTemp) return

    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const year = dateObj.getFullYear()
    const day = dateObj.getDate()
    const docName = `${month}/${year}-DailyWaterTempLog`

    let docId = await findDoc(docName)
    if (!docId) {
      docId = await createDoc(docName)
      await createWaterTempDoc(docId, Number(month), year)
    }

    const docRes = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}`)
    const doc = await docRes.json()
    const tableEl = (doc.body?.content ?? []).find(el => el.table)
    if (!tableEl) throw new Error('Water temp table not found')

    const row = tableEl.table.tableRows[day]
    if (!row) throw new Error(`Row for day ${day} not found`)

    const cells = [
      { col: 2, text: waterTemp ? `${waterTemp}°F` : '' },
      { col: 1, text: bathingType === 'N/A' ? 'N/A' : bathingType === 'shower' ? '☐ Bath   ☑ Shower' : '☑ Bath   ☐ Shower' },
    ].filter(c => c.text)

    const requests = cells
      .map(({ col, text }) => {
        const cellIdx = row.tableCells[col]?.content?.[0]?.startIndex
        if (cellIdx == null) return null
        return { insertText: { location: { index: cellIdx }, text } }
      })
      .filter(Boolean)
      .sort((a, b) => b.insertText.location.index - a.insertText.location.index)

    if (!requests.length) return { docId, docName }

    const r = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests }),
    })
    if (!r.ok) throw new Error(await r.text())

    return { docId, docName }
  }

  async function insertDailyNotesSignature(docId, sigIndex, scottSigns) {
    const origin = window.location.origin
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.')) {
      console.log('Signature insert skipped in local dev')
      return
    }
    const sigUrl = `${origin}${scottSigns ? sigSW : sigHW}`
    const r = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{
        insertInlineImage: {
          location: { index: sigIndex },
          uri: sigUrl,
          objectSize: {
            height: { magnitude: 38.88, unit: 'PT' },
            width:  { magnitude: 95.76, unit: 'PT' },
          },
        },
      }] }),
    })
    if (!r.ok) throw new Error(await r.text())
  }

  return { googleUser, accessToken, saveStatus, setSaveStatus, handleGoogleSuccess, signOut, saveToGoogleDocs, saveAsDailyNotes, saveToChecklist, saveToWaterTempLog, saveToBMChart, fetchCheckedThisMonth, fetchCheckedThisQuarter, fetchCheckedThisWeek, checkDuplicateDate, tagCounts, fetchTagCounts }
}