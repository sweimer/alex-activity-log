import { useState, useCallback } from 'react'
import { TAG_CONFIG } from '../constants/tags.js'
import { ISP_SECTIONS } from '../constants/ispItems.js'

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
      `Printed Name:  Scott Weimer                    Initials: _______  Date: _______\n` +
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
        ? 'ISP Dates: from 10/1/26 - 9/30/27\nProvider: Blue Ridge  Service: Sponsored-Residential\n'
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

      // Footer — label only under relief staff, left-aligned under the name
      const reliefNameIndent = ' '.repeat('Relief Staff: '.length)
      const footerText = `\nSponsor: ${sponsorName}  ____________________________    ___________\nRelief Staff: ${reliefName}  ____________________________    ___________\n${reliefNameIndent}(sign and date by writer of note)\n`

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

      const batchRes2 = await gFetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      })
      if (!batchRes2.ok) throw new Error(await batchRes2.text())

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

  return { googleUser, accessToken, saveStatus, setSaveStatus, handleGoogleSuccess, signOut, saveToGoogleDocs, saveAsDailyNotes, saveToChecklist, fetchCheckedThisMonth, fetchCheckedThisQuarter, fetchCheckedThisWeek, checkDuplicateDate, tagCounts, fetchTagCounts }
}