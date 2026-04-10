import { useState, useCallback } from 'react'

const FOLDER_ID = '1WouU-VuYWgM4Cl4ZeGkEV9vyhqVYPCOT'
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

  return { googleUser, accessToken, saveStatus, setSaveStatus, handleGoogleSuccess, signOut, saveToGoogleDocs }
}