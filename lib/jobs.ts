// Canonical filter shape — single source of truth for dashboard, drawer, and API
export interface FilterState {
  roles: string[]       // job titles to search for
  level: string         // '' | 'Intern' | 'Entry Level' | 'Mid Level' | 'Senior' | 'Lead'
  jobType: string[]     // 'fulltime' | 'parttime' | 'internship' | 'contract'
  workModel: string[]   // 'remote' | 'hybrid' | 'onsite'  — empty = all
  daysOld: number       // 1 | 3 | 7 | 14
  country: string       // 'us' | 'gb' | 'ca' | 'au' | 'in'
  city: string
  excludedTitle: string
  salaryMin: number
  salaryMax: number
}

// Keep alias so existing FilterDrawer import doesn't break
export type JobFilters = FilterState

export const DEFAULT_FILTER_STATE: FilterState = {
  roles: [],
  level: '',
  jobType: [],
  workModel: [],
  daysOld: 14,
  country: 'us',
  city: '',
  excludedTitle: '',
  salaryMin: 0,
  salaryMax: 200000,
}

// Backward-compat alias used by older imports
export const DEFAULT_FILTERS = DEFAULT_FILTER_STATE

export interface Job {
  id: string
  title: string
  company: string
  location: string
  applyUrl: string
  salary: string | null
  postedAt: string
  workType: 'remote' | 'onsite' | 'hybrid'
  description: string
  employmentType: string
  match: number
  matchLabel: string
  applied: boolean
  source: 'adzuna' | 'himalayas' | 'mock'
}

export function getFilters(): FilterState {
  if (typeof window === 'undefined') return DEFAULT_FILTER_STATE
  try {
    const stored = localStorage.getItem('sathi_filters')
    return stored ? { ...DEFAULT_FILTER_STATE, ...JSON.parse(stored) } : DEFAULT_FILTER_STATE
  } catch {
    return DEFAULT_FILTER_STATE
  }
}

export function saveFilters(fs: FilterState) {
  if (typeof window === 'undefined') return
  localStorage.setItem('sathi_filters', JSON.stringify(fs))
}

export function countActiveFilters(fs: FilterState): number {
  let n = 0
  if (fs.roles.length > 0) n++
  if (fs.level) n++
  if (fs.jobType.length > 0) n++
  if (fs.workModel.length > 0) n++
  if (fs.city.trim()) n++
  if (fs.excludedTitle.trim()) n++
  if (fs.salaryMin > 0 || fs.salaryMax < 200000) n++
  if (fs.daysOld !== 14) n++
  return n
}

export async function fetchJobs(
  fs: FilterState,
  profileSkills: string[] = [],
  profileType: string = '',
): Promise<Job[]> {
  const res = await fetch('/api/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filterState: fs, skills: profileSkills, profileType }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  const data = await res.json()
  return data.jobs ?? []
}
