import { Job } from './jobs'

export interface SathiProfile {
  name?: string
  skills?: string[]
  experience?: string
  titles?: string[]
  type?: string
  resumeText?: string
}

export interface SathiToday {
  mood: string
  goal: number
  applied: string[]
  date: string
}

export interface AppliedLogEntry {
  job: Job
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

// Saved jobs (hearted)
export function getSavedJobs(): Job[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('sathi_saved_jobs') ?? '[]') } catch { return [] }
}

export function saveJob(job: Job) {
  const saved = getSavedJobs()
  if (!saved.find(j => j.id === job.id)) {
    saved.push(job)
    localStorage.setItem('sathi_saved_jobs', JSON.stringify(saved))
  }
}

export function unsaveJob(jobId: string) {
  const saved = getSavedJobs().filter(j => j.id !== jobId)
  localStorage.setItem('sathi_saved_jobs', JSON.stringify(saved))
}

export function isJobSaved(jobId: string): boolean {
  return getSavedJobs().some(j => j.id === jobId)
}

// Applied log (persistent across days)
export function getAppliedLog(): AppliedLogEntry[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem('sathi_applied_log') ?? '[]') } catch { return [] }
}

export function logApplied(job: Job) {
  const log = getAppliedLog()
  if (!log.find(e => e.job.id === job.id)) {
    log.unshift({ job, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })
    localStorage.setItem('sathi_applied_log', JSON.stringify(log))
  }
}
