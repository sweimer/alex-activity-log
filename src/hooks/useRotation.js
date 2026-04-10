import { useState } from 'react'
import { getRoleForDate, todayISO } from '../utils/rotation.js'

const STORAGE_KEY = 'alexLogRotation'

export function useRotation() {
  const [rotation, setRotation] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [override, setOverride] = useState(null) // "Sponsor" | "Relief" | null

  function initRotation(startRole) {
    const data = {
      startDate: todayISO(),
      startRole,
      sponsorDays: 4,
      reliefDays: 3,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setRotation(data)
    setOverride(null)
  }

  function toggleOverride() {
    const base = getBaseRole()
    setOverride(prev => {
      if (prev !== null) return null // clear override
      return base === 'Sponsor' ? 'Relief' : 'Sponsor'
    })
  }

  function getBaseRole(date = todayISO()) {
    if (!rotation) return null
    return getRoleForDate(
      rotation.startDate,
      rotation.startRole,
      rotation.sponsorDays,
      rotation.reliefDays,
      date
    )
  }

  const todayRole = override ?? getBaseRole()
  const isOverridden = override !== null

  return { rotation, todayRole, isOverridden, initRotation, toggleOverride }
}