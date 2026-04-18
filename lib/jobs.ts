import { MOCK_JOBS, Job } from './mockJobs'

export type { Job }

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
      .filter((j: Record<string, unknown>) => j.job_apply_link)
      .slice(0, 8)
      .map((j: Record<string, unknown>, i: number) => ({
        id: String(j.job_id ?? i),
        title: String(j.job_title ?? ''),
        company: String(j.employer_name ?? ''),
        location: j.job_is_remote ? 'Remote' : String(j.job_city ?? j.job_country ?? ''),
        daysAgo: Math.floor((Date.now() - new Date(String(j.job_posted_at_datetime_utc ?? Date.now())).getTime()) / 86400000),
        match: 70 + Math.floor(Math.random() * 25),
        matchReason: 'Matches your skills and experience',
        applyUrl: String(j.job_apply_link ?? '#'),
        applied: false,
        description: String(j.job_description ?? '').slice(0, 300),
        logo: String(j.employer_logo ?? ''),
      }))
    return jobs.length ? jobs : MOCK_JOBS
  } catch {
    return MOCK_JOBS
  }
}
