import { TAG_CONFIG } from '../constants/tags.js'

/**
 * Assembles the user prompt string sent to Claude from all form state.
 */
function resolveItem(item, { outfitToday, kiearraArrived, kiearraActivities, kiearraReturned, middayCustom, afterLunchCustom, eveningCustom, cadOffered, cadChose }) {
  return item
    .replace('__OUTFIT__', outfitToday || 'her outfit today')
    .replace('__KIEARRA_ARRIVED__', kiearraArrived || '')
    .replace('__KIEARRA_ACTIVITIES__', kiearraActivities || '')
    .replace('__KIEARRA_RETURNED__', kiearraReturned || '')
    .replace('__MIDDAY_CUSTOM__', middayCustom || '')
    .replace('__AFTER_LUNCH_CUSTOM__', afterLunchCustom || '')
    .replace('__EVENING_CUSTOM__', eveningCustom || '')
    .replace(/__CAD_OFFERED__/g, cadOffered || '')
    .replace(/__CAD_CHOSE__/g, cadChose || '')
}

export function buildPrompt({
  dateLabel,
  staffMode,
  sponsorName,
  reliefName,
  signature,
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
  checkedItems,   // { sectionId: Set<itemText> }
  sectionNotes,   // { sectionId: string }
  additionalNotes,
}) {
  const lines = []

  // Header
  lines.push(`Date: ${dateLabel}`)

  if (staffMode === 'sponsor') {
    lines.push(`Staff present: Sponsor only (${sponsorName}).`)
  } else if (staffMode === 'relief') {
    lines.push(`Staff present: Relief only (${reliefName}).`)
  } else {
    lines.push(`Staff present: Both Sponsor (${sponsorName}) and Relief (${reliefName}) — shared duties. Alternate "Sponsor" and "Relief" naturally.`)
  }

  lines.push(`Signature: ${signature}`)

  // Tags
  const tagLabels = selectedTags
    .map(id => {
      const t = TAG_CONFIG.find(t => t.id === id)
      return `(${t ? t.label : id})`
    })

  if (tagLabels.length) lines.push(`Tags: ${tagLabels.join(' ')}`)

  lines.push('')

  // Day details
  lines.push('[DAY DETAILS]')
  if (wakeTime) lines.push(`Alex woke at: ${wakeTime}`)
  if (breakfastOffered) lines.push(`Breakfast choices offered: ${breakfastOffered}`)
  if (breakfastChose) lines.push(`Alex chose: ${breakfastChose}`)
  if (vanArrived) lines.push(`Diversity van arrived: ${vanArrived}`)
  if (vanReturned) lines.push(`Diversity van returned: ${vanReturned}`)
  if (kiearraArrived) lines.push(`Kiearra arrived: ${kiearraArrived}`)
  if (kiearraReturned) lines.push(`Kiearra returned: ${kiearraReturned}`)
  lines.push('')

  // Checklist sections
  for (const [sectionId, items] of Object.entries(checkedItems)) {
    if (!items || items.size === 0) continue
    lines.push(`[${sectionId.toUpperCase()}]`)
    for (const item of items) {
      lines.push(`- ${resolveItem(item, { outfitToday, kiearraArrived, kiearraActivities, kiearraReturned, middayCustom, afterLunchCustom, eveningCustom, cadOffered, cadChose })}`)
    }
    if (sectionNotes[sectionId]) {
      lines.push(`  NOTE: ${sectionNotes[sectionId]}`)
    }
    lines.push('')
  }

  if (additionalNotes) {
    lines.push('[ADDITIONAL NOTES]')
    lines.push(additionalNotes)
  }

  return lines.join('\n')
}

