const CALENDAR_ID = 'gt9bu2g57vjtjfprk0r9hcc2pk@group.calendar.google.com'
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone

function pad(n) { return String(n).padStart(2, '0') }

function dateTimeStr(dateObj, hour, min) {
  const y = dateObj.getFullYear()
  const m = pad(dateObj.getMonth() + 1)
  const d = pad(dateObj.getDate())
  return `${y}-${m}-${d}T${pad(hour)}:${pad(min)}:00`
}

async function extractMeals(entryText) {
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
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Extract meal details from this daily activity log. Return ONLY a valid JSON object with these exact keys: breakfast, lunch, afternoonSnack, dinner, nightSnack, diversityLunch. For meal keys, each value should be the food item(s) as a short string, or null if not mentioned. afternoonSnack is a snack eaten between lunch and dinner. nightSnack is a snack eaten after dinner. For diversityLunch, return true if the log mentions Alex went to Diversity (e.g. a van took her there), otherwise false. Example: {"breakfast":"oatmeal","lunch":"grilled chicken","afternoonSnack":null,"dinner":"pasta","nightSnack":"cookies","diversityLunch":false}\n\nLog:\n${entryText}`,
      }],
    }),
  })
  const data = await res.json()
  const raw = data.content?.[0]?.text ?? '{}'
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
  return JSON.parse(text)
}

export function useGoogleCalendar(accessToken) {
  function gFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers ?? {}),
      },
    })
  }

  async function gFetchOrThrow(url, options = {}) {
    const res = await gFetch(url, options)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(`Calendar API ${res.status}: ${body?.error?.message ?? res.statusText}`)
    }
    return res
  }

  async function findExistingEvent(dateObj, startHour, startMin, endHour, endMin) {
    const timeMin = encodeURIComponent(dateTimeStr(dateObj, startHour, startMin) + 'Z')
    const timeMax = encodeURIComponent(dateTimeStr(dateObj, endHour, endMin) + 'Z')
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&timeZone=${encodeURIComponent(TZ)}`
    const res = await gFetchOrThrow(url)
    const data = await res.json()
    return data.items?.[0] ?? null
  }

  async function upsertEvent(dateObj, startHour, startMin, endHour, endMin, title) {
    const event = {
      summary: title,
      start: { dateTime: dateTimeStr(dateObj, startHour, startMin), timeZone: TZ },
      end:   { dateTime: dateTimeStr(dateObj, endHour, endMin),   timeZone: TZ },
    }

    const existing = await findExistingEvent(dateObj, startHour, startMin, endHour, endMin)

    if (existing) {
      await gFetchOrThrow(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${existing.id}`,
        { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) }
      )
    } else {
      await gFetchOrThrow(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event) }
      )
    }
  }

  async function saveMealsToCalendar(entryText, dateObj, diversityDay) {
    const meals = await extractMeals(entryText)
    const dayOfWeek = dateObj.getDay()
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5

    // 1. Always: declined meal placeholder (12:00am – 12:15am)
    await upsertEvent(dateObj, 0, 0, 0, 15, 'Individual declined meal. Alternative provided.')

    // 2. Breakfast (7:00am – 7:30am)
    if (meals.breakfast) {
      await upsertEvent(dateObj, 7, 0, 7, 30, `Breakfast: ${meals.breakfast}`)
    }

    // 3. Lunch (12:00pm – 12:30pm)
    if ((diversityDay || meals.diversityLunch) && isWeekday) {
      await upsertEvent(dateObj, 12, 0, 12, 30, 'Lunch at Diversity')
    } else if (meals.lunch) {
      await upsertEvent(dateObj, 12, 0, 12, 30, `Lunch: ${meals.lunch}`)
    }

    // 4. Afternoon snack (2:00pm – 2:30pm) — only if mentioned
    if (meals.afternoonSnack) {
      await upsertEvent(dateObj, 14, 0, 14, 30, `Snack: ${meals.afternoonSnack}`)
    }

    // 5. Dinner (5:00pm – 5:30pm)
    if (meals.dinner) {
      await upsertEvent(dateObj, 17, 0, 17, 30, `Dinner: ${meals.dinner}`)
    }

    // 6. Night snack (8:00pm – 8:30pm) — only if mentioned
    if (meals.nightSnack) {
      await upsertEvent(dateObj, 20, 0, 20, 30, `Night Snack: ${meals.nightSnack}`)
    }
  }

  return { saveMealsToCalendar }
}
