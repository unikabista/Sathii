export interface SathiProfile {
  name?: string
  email?: string
  password?: string
  skills?: string[]
  experience?: string
  titles?: string[]
  projects?: string[]
  certifications?: string[]
  extraSkills?: string[]
  extraProjects?: string[]
  extraExperience?: string
  preferredRoles?: string[]
  suggestedRoles?: { title: string; reason: string; match: number }[]
  parserDebug?: {
    parser: string
    extractedTextLength?: number
    cvParseStatus?: string
    cvParseError?: string
    usedFallback?: boolean
  }
  type?: string
  resumeText?: string
  resumeMimeType?: string
}

export interface SathiToday {
  mood: string
  goal: number
  applied: string[]
  date: string
}

export function getProfile(): SathiProfile {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem('sathi_profile') ?? '{}') } catch { return {} }
}

export function getToday(): SathiToday {
  if (typeof window === 'undefined') return { mood: 'good', goal: 3, applied: [], date: '' }
  try {
    const stored = JSON.parse(localStorage.getItem('sathi_today') ?? '{}')
    if (stored.date !== new Date().toDateString()) {
      const reset = { ...stored, applied: [], date: new Date().toDateString() }
      localStorage.setItem('sathi_today', JSON.stringify(reset))
      return reset
    }
    return stored
  } catch {
    return { mood: 'good', goal: 3, applied: [], date: new Date().toDateString() }
  }
}

export function markApplied(jobId: string) {
  const today = getToday()
  if (!today.applied.includes(jobId)) {
    today.applied.push(jobId)
    localStorage.setItem('sathi_today', JSON.stringify(today))
  }
  return today
}

export function getStreak(): number {
  if (typeof window === 'undefined') return 0
  try { return Number(localStorage.getItem('sathi_streak') ?? '0') } catch { return 0 }
}

export function incrementStreak() {
  const streak = getStreak() + 1
  localStorage.setItem('sathi_streak', String(streak))
  return streak
}
