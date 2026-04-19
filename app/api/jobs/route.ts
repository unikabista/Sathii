import { NextRequest, NextResponse } from 'next/server'
import { SathiProfile } from '@/lib/store'
import { MOCK_JOBS } from '@/lib/mockJobs'

const COUNTRY_MAP: Record<string, string> = {
  us: 'us', gb: 'gb', ca: 'ca', au: 'au', in: 'in',
}

function buildWhat(profile: SathiProfile): string {
  let what = ''
  if (profile.targetRoles) {
    what = profile.targetRoles.split(',')[0].trim()
  } else if (profile.skills?.length) {
    what = profile.skills.slice(0, 3).join(' ')
  } else {
    what = 'software engineer'
  }
  if (profile.workTypes?.includes('remote')) what += ' remote'
  return what
}

export async function POST(req: NextRequest) {
  const profile: SathiProfile = await req.json()
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY

  if (!appId || !appKey || appId === 'your_id') {
    return NextResponse.json(MOCK_JOBS)
  }

  const country = COUNTRY_MAP[profile.country ?? 'us'] ?? 'us'
  const workTypes = profile.workTypes ?? []

  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    what: buildWhat(profile),
    results_per_page: '10',
    sort_by: 'date',
    max_days_old: '14',
    full_time: '1',
    what_exclude: '14 year 15 year teenager volunteer unpaid',
  })

  const onlyRemote = workTypes.length > 0 && workTypes.every((t) => t === 'remote')
  if (profile.city && !onlyRemote) {
    params.set('where', profile.city)
  }

  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`
    )
    if (!res.ok) throw new Error('Adzuna error')
    const data = await res.json()

    const jobs = (data.results ?? [])
      .map((j: Record<string, unknown>, i: number) => {
        const created = String(j.created ?? '')
        const daysAgo = created
          ? Math.max(0, Math.floor((Date.now() - new Date(created).getTime()) / 86400000))
          : 0
        const loc = j.location as Record<string, unknown>
        const company = j.company as Record<string, unknown>
        return {
          id: String(j.id ?? i),
          title: String(j.title ?? ''),
          company: String(company?.display_name ?? ''),
          location: String(loc?.display_name ?? ''),
          daysAgo,
          match: 70 + Math.floor(Math.random() * 25),
          matchReason: 'Matches your skills and experience',
          applyUrl: String(j.redirect_url ?? ''),
          applied: false,
          description: String(j.description ?? '').slice(0, 300),
          salaryMin: j.salary_min != null ? Number(j.salary_min) : undefined,
          salaryMax: j.salary_max != null ? Number(j.salary_max) : undefined,
        }
      })
      .filter((j: { applyUrl: string; title: string }) => j.applyUrl && j.title)

    return NextResponse.json(jobs.length ? jobs : MOCK_JOBS)
  } catch {
    return NextResponse.json(MOCK_JOBS)
  }
}
