import { MOCK_JOBS, Job } from './mockJobs'
import { SathiProfile } from './store'

export type { Job }

export function buildSearchQuery(profile: SathiProfile): string {
  if (profile.targetRoles) return profile.targetRoles.split(',')[0].trim()
  if (profile.skills?.length) return profile.skills.slice(0, 3).join(' ')
  return 'software engineer'
}

export async function fetchJobs(profile: SathiProfile): Promise<Job[]> {
  try {
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    if (!res.ok) throw new Error('API error')
    const jobs: Job[] = await res.json()
    return jobs.length ? jobs : MOCK_JOBS
  } catch {
    return MOCK_JOBS
  }
}
