/**
 * Pure rotation calculator — no side effects.
 *
 * The cycle is: sponsorDays days of Sponsor, then reliefDays days of Relief, repeat.
 *
 * @param {string} anchorDate  - ISO date string "YYYY-MM-DD" (the day the rotation started)
 * @param {string} anchorRole  - "Sponsor" | "Relief"
 * @param {number} sponsorDays - default 4
 * @param {number} reliefDays  - default 3
 * @param {string} targetDate  - ISO date string to compute role for
 * @returns {"Sponsor"|"Relief"}
 */
export function getRoleForDate(anchorDate, anchorRole, sponsorDays = 4, reliefDays = 3, targetDate) {
  const anchor = new Date(anchorDate + 'T00:00:00')
  const target = new Date(targetDate + 'T00:00:00')
  const diffDays = Math.round((target - anchor) / 86400000)

  const cycleLen = sponsorDays + reliefDays

  // Normalize diffDays so negative offsets wrap correctly
  const posOffset = ((diffDays % cycleLen) + cycleLen) % cycleLen

  // Determine which phase the anchor role corresponds to in the cycle
  // The anchor role occupies positions 0..(its duration - 1) in the cycle
  const sponsorFirst = anchorRole === 'Sponsor'

  let roleAtOffset
  if (sponsorFirst) {
    roleAtOffset = posOffset < sponsorDays ? 'Sponsor' : 'Relief'
  } else {
    roleAtOffset = posOffset < reliefDays ? 'Relief' : 'Sponsor'
  }

  return roleAtOffset
}

/**
 * Returns today's ISO date string "YYYY-MM-DD"
 */
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}