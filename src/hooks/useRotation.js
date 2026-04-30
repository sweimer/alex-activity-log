import { useState } from 'react'

// Sun(0)–Wed(3) → Sponsor, Thu(4)–Sat(6) → Relief
function roleForISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay()
  return dow <= 3 ? 'Sponsor' : 'Relief'
}

export function useRotation(selectedISO) {
  const [override, setOverride] = useState(null) // "Sponsor" | "Relief" | null

  const baseRole = roleForISO(selectedISO)
  const todayRole = override ?? baseRole
  const isOverridden = override !== null

  function toggleOverride() {
    setOverride(prev => (prev !== null ? null : baseRole === 'Sponsor' ? 'Relief' : 'Sponsor'))
  }

  return { todayRole, isOverridden, toggleOverride }
}
