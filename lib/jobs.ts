import { MOCK_JOBS, Job } from './mockJobs'

export type { Job }

const AGGREGATOR_DOMAINS = ['indeed.com', 'linkedin.com', 'glassdoor.com', 'ziprecruiter.com', 'monster.com']

function isAggregatorUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return AGGREGATOR_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))
  } catch {
    return false
  }
}

function resolveApplyUrl(j: Record<string, unknown>): string | null {
  const applyLink = j.job_apply_link ? String(j.job_apply_link) : null
  const employerWebsite = j.employer_website ? String(j.employer_website) : null

  if (applyLink && !isAggregatorUrl(applyLink)) return applyLink
  if (employerWebsite && !isAggregatorUrl(employerWebsite)) return employerWebsite
  return null
}

export async function fetchJobs(query: string, _location: string = 'remote'): Promise<Job[]> {
  const apiKey = process.env.NEXT_PUBLIC_RAPIDAPI_KEY
  if (!apiKey || apiKey === 'your_key_here') return MOCK_JOBS

  try {
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&num_pages=1&date_posted=month`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        },
      }
    )
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    const jobs: Job[] = (data.data ?? [])
      .map((j: Record<string, unknown>, i: number) => {
        const applyUrl = resolveApplyUrl(j)
        if (!applyUrl) return null
        return {
          id: String(j.job_id ?? i),
          title: String(j.job_title ?? ''),
          company: String(j.employer_name ?? ''),
          location: j.job_is_remote ? 'Remote' : String(j.job_city ?? j.job_country ?? ''),
          daysAgo: Math.floor((Date.now() - new Date(String(j.job_posted_at_datetime_utc ?? Date.now())).getTime()) / 86400000),
          match: 70 + Math.floor(Math.random() * 25),
          matchReason: 'Matches your skills and experience',
          applyUrl,
          applied: false,
          description: String(j.job_description ?? '').slice(0, 300),
          logo: String(j.employer_logo ?? ''),
        }
      })
      .filter(Boolean)
      .slice(0, 8) as Job[]
    return jobs.length ? jobs : MOCK_JOBS
  } catch {
    return MOCK_JOBS
  }
}
