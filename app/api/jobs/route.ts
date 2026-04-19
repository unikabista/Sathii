import { NextRequest, NextResponse } from 'next/server'
import { Job, FilterState } from '@/lib/jobs'

// ─── Level → query modifier ───────────────────────────────────────────────────
const LEVEL_MODIFIER: Record<string, string> = {
  'Intern':      'intern',
  'Entry Level': 'entry level junior',
  'Mid Level':   'mid level',
  'Senior':      'senior',
  'Lead':        'lead principal staff',
}

// ─── Build Adzuna `what` query ────────────────────────────────────────────────
function buildQuery(
  fs: FilterState,
  profileSkills: string[],
  profileType: string,
): string {
  const type = profileType.toLowerCase()

  // Career changers: search by skills, not titles
  if (type.includes('career')) {
    const base = profileSkills.slice(0, 3).join(' OR ') || 'software engineer'
    const mod = LEVEL_MODIFIER[fs.level] ?? ''
    return mod ? `${base} ${mod}` : base
  }

  // Build roles clause — strip academic degrees like "computer science"
  const cleanRoles = fs.roles
    .filter(r => !r.toLowerCase().includes('computer science'))
  const rolesClause = cleanRoles.length > 0
    ? cleanRoles.join(' OR ')
    : profileSkills.slice(0, 2).join(' OR ') || 'software engineer'

  const mod = LEVEL_MODIFIER[fs.level] ?? ''

  // Internship selected but no level set: add "intern" to query
  const internKeyword =
    fs.jobType.includes('internship') && !mod.includes('intern') ? ' intern' : ''

  return `${rolesClause}${mod ? ` ${mod}` : ''}${internKeyword}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const h = Math.floor(diff / 3_600_000)
    if (h < 1)  return 'Just now'
    if (h < 24) return `${h} hour${h !== 1 ? 's' : ''} ago`
    const d = Math.floor(h / 24)
    if (d < 7)  return `${d} day${d !== 1 ? 's' : ''} ago`
    const w = Math.floor(d / 7)
    return `${w} week${w !== 1 ? 's' : ''} ago`
  } catch { return 'Recently' }
}

function calcMatch(skills: string[], title: string, desc: string): { match: number; label: string } {
  if (!skills.length) {
    const score = 75 + Math.floor(Math.random() * 21)
    return { match: score, label: score >= 85 ? 'STRONG MATCH' : 'GOOD MATCH' }
  }
  const text = `${title} ${desc}`.toLowerCase()
  const matched = skills.filter(s => text.includes(s.toLowerCase())).length
  const score = Math.min(99, Math.max(50, Math.round((matched / skills.length) * 100)))
  const label = score >= 85 ? 'STRONG MATCH' : score >= 70 ? 'GOOD MATCH' : 'MATCH'
  return { match: score, label }
}

function formatSalary(min?: number, max?: number): string | null {
  if (!min && !max) return null
  const f = (n: number) => n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
  if (min && max) return `${f(min)} - ${f(max)}`
  if (min) return `${f(min)}+`
  return `Up to ${f(max!)}`
}

function detectWorkType(location: string, desc: string, title: string): 'remote' | 'onsite' | 'hybrid' {
  const t = `${location} ${title} ${desc.slice(0, 300)}`.toLowerCase()
  if (t.includes('remote')) return 'remote'
  if (t.includes('hybrid')) return 'hybrid'
  return 'onsite'
}

// ─── Adzuna ───────────────────────────────────────────────────────────────────
interface ApiResult { jobs: Job[]; error?: string }

async function callAdzuna(
  what: string,
  fs: FilterState,
  skills: string[],
  appId: string,
  appKey: string,
): Promise<ApiResult> {
  const params = new URLSearchParams({
    app_id:          appId,
    app_key:         appKey,
    what,
    sort_by:         'date',
    max_days_old:    String(fs.daysOld),
    results_per_page:'10',
    category:        'it-jobs',
  })

  if (fs.city)               params.set('where',       fs.city)
  if (fs.salaryMin > 0)      params.set('salary_min',  String(fs.salaryMin))
  if (fs.salaryMax < 200000) params.set('salary_max',  String(fs.salaryMax))
  if (fs.jobType.includes('fulltime'))  params.set('full_time',  '1')
  if (fs.jobType.includes('parttime'))  params.set('part_time',  '1')
  if (fs.jobType.includes('contract'))  params.set('contract_type', 'contract')

  const url = `https://api.adzuna.com/v1/api/jobs/${fs.country}/search/1?${params}`
  console.log(`Searching Adzuna: "${what}" in ${fs.country} category=it-jobs days=${fs.daysOld}`)

  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' })
    const text = await res.text()
    if (!res.ok) {
      console.error(`[Adzuna] ${res.status}:`, text.slice(0, 200))
      return { jobs: [], error: `Adzuna ${res.status}` }
    }
    const data = JSON.parse(text)
    const results: Record<string, unknown>[] = data.results ?? []
    console.log(`[Adzuna] ${results.length} results`)

    const jobs = results.map((j, i): Job => {
      const company  = (j.company  as Record<string,string>)?.display_name ?? 'Unknown'
      const location = (j.location as Record<string,string>)?.display_name ?? ''
      const title    = String(j.title ?? '')
      const desc     = String(j.description ?? '')
      const { match, label } = calcMatch(skills, title, desc)
      return {
        id:             `adzuna-${String(j.id ?? i)}`,
        title,
        company,
        location,
        applyUrl:       String(j.redirect_url ?? ''),
        salary:         formatSalary(
                          typeof j.salary_min === 'number' ? j.salary_min : undefined,
                          typeof j.salary_max === 'number' ? j.salary_max : undefined,
                        ),
        postedAt:       timeAgo(String(j.created ?? '')),
        workType:       detectWorkType(location, desc, title),
        description:    desc.slice(0, 400),
        employmentType: j.contract_time === 'part_time' ? 'Part-time' : 'Full-time',
        match,
        matchLabel:     label,
        applied:        false,
        source:         'adzuna',
      }
    })
    return { jobs }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Adzuna] error:', msg)
    return { jobs: [], error: msg }
  }
}

// ─── Himalayas ────────────────────────────────────────────────────────────────
async function callHimalayas(query: string, fs: FilterState, skills: string[]): Promise<ApiResult> {
  const url = `https://himalayas.app/jobs/api/search?q=${encodeURIComponent(query)}&limit=10`
  console.log(`Searching Himalayas: "${query}" (remote)`)
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible)' },
      cache: 'no-store',
    })
    const text = await res.text()
    if (!res.ok || text.trimStart().startsWith('<!')) {
      console.log('[Himalayas] Blocked/unavailable, skipping')
      return { jobs: [] }
    }
    const data = JSON.parse(text)
    const raw: Record<string, unknown>[] = data.jobs ?? []

    // Filter by date
    const cutoff = Date.now() - fs.daysOld * 86_400_000
    const roleLower = query.toLowerCase()

    const filtered = raw.filter(j => {
      // Title relevance check
      const t = String(j.title ?? '').toLowerCase()
      if (!roleLower.split(' ').some(w => w.length > 3 && t.includes(w))) return false
      // Date check
      const created = j.createdAt ?? j.publishedAt
      if (created) {
        try { if (new Date(String(created)).getTime() < cutoff) return false } catch { /* ok */ }
      }
      // Job type filter
      if (fs.jobType.length > 0) {
        const emp = String(j.type ?? j.jobType ?? '').toLowerCase()
        if (fs.jobType.includes('fulltime')    && !emp.includes('full')) return false
        if (fs.jobType.includes('parttime')    && !emp.includes('part')) return false
        if (fs.jobType.includes('internship')  && !emp.includes('intern')) return false
      }
      return true
    })

    const jobs = filtered.map((j, i): Job => {
      const company = (j.company as Record<string,string>)?.name ?? String(j.companyName ?? 'Unknown')
      const desc    = String(j.description ?? '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,400)
      const title   = String(j.title ?? '')
      const { match, label } = calcMatch(skills, title, desc)
      return {
        id:             `himalayas-${String(j.id ?? i)}`,
        title,
        company,
        location:       String(j.location ?? 'Remote'),
        applyUrl:       String(j.applicationLink ?? j.applicationUrl ?? j.url ?? ''),
        salary:         j.salary ? String(j.salary) : null,
        postedAt:       timeAgo(String(j.createdAt ?? j.publishedAt ?? '')),
        workType:       'remote',
        description:    desc,
        employmentType: String(j.type ?? j.jobType ?? 'Full-time'),
        match,
        matchLabel:     label,
        applied:        false,
        source:         'himalayas',
      }
    })
    return { jobs }
  } catch (err) {
    console.error('[Himalayas] error:', err instanceof Error ? err.message : err)
    return { jobs: [] }
  }
}

// ─── Post-processing ──────────────────────────────────────────────────────────
function deduplicate(jobs: Job[]): Job[] {
  const seen = new Set<string>()
  return jobs.filter(j => {
    const key = `${j.title.toLowerCase().slice(0,30)}-${j.company.toLowerCase().slice(0,20)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function clientFilter(jobs: Job[], fs: FilterState): Job[] {
  return jobs.filter(j => {
    // Excluded title
    if (fs.excludedTitle.trim()) {
      if (j.title.toLowerCase().includes(fs.excludedTitle.toLowerCase())) return false
    }
    // Work model
    if (fs.workModel.length > 0 && !fs.workModel.includes(j.workType)) return false
    // Job type (Internship / Contract need title check since Adzuna doesn't have those contract_time values)
    if (fs.jobType.length > 0) {
      const titleL = j.title.toLowerCase()
      const empL   = j.employmentType.toLowerCase()
      const matched = fs.jobType.some(t => {
        if (t === 'internship') return titleL.includes('intern')
        if (t === 'contract')   return titleL.includes('contract') || empL.includes('contract')
        if (t === 'fulltime')   return empL.includes('full')
        if (t === 'parttime')   return empL.includes('part')
        return false
      })
      if (!matched) return false
    }
    // Salary
    if (fs.salaryMin > 0 || fs.salaryMax < 200000) {
      if (j.salary) {
        const nums = j.salary.match(/\d+k?/gi) ?? []
        const vals = nums.map(n => n.toLowerCase().endsWith('k') ? parseInt(n)*1000 : parseInt(n))
        const min  = vals[0] ?? 0
        if (min > 0 && (min < fs.salaryMin || min > fs.salaryMax)) return false
      }
    }
    return true
  })
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body        = await req.json()
    const fs: FilterState  = body.filterState ?? {}
    const skills: string[] = body.skills ?? []
    const profileType      = String(body.profileType ?? '')

    const appId = process.env.ADZUNA_APP_ID
    const appKey = process.env.ADZUNA_APP_KEY
    if (!appId || !appKey) {
      return NextResponse.json({ jobs: [], error: 'Missing Adzuna credentials' }, { status: 500 })
    }

    const query = buildQuery(fs, skills, profileType)

    const wantRemote        = fs.workModel.length === 0 || fs.workModel.includes('remote')
    const wantOnsiteOrHybrid = fs.workModel.length === 0 || fs.workModel.includes('onsite') || fs.workModel.includes('hybrid')

    console.log(`[/api/jobs] query="${query}" level="${fs.level}" workModel=${JSON.stringify(fs.workModel)} country=${fs.country} days=${fs.daysOld}`)

    const tasks: Promise<ApiResult>[] = []

    if (wantRemote) {
      tasks.push(callHimalayas(query, fs, skills))
      tasks.push(callAdzuna(`${query} remote`, fs, skills, appId, appKey))
    }
    if (wantOnsiteOrHybrid) {
      tasks.push(callAdzuna(query, fs, skills, appId, appKey))
    }

    const results = await Promise.all(tasks)
    const errors  = results.map(r => r.error).filter(Boolean)
    let   jobs    = results.flatMap(r => r.jobs)

    console.log(`[/api/jobs] ${jobs.length} raw | errors: ${errors.join(', ') || 'none'}`)

    jobs = deduplicate(jobs)
    jobs = clientFilter(jobs, fs)
    jobs.sort((a, b) => {
      const tier = (j: Job) => j.matchLabel === 'STRONG MATCH' ? 3 : j.matchLabel === 'GOOD MATCH' ? 2 : 1
      return tier(b) - tier(a)
    })

    console.log(`[/api/jobs] returning ${jobs.length} jobs`)
    return NextResponse.json({ jobs, ...(errors.length ? { errors } : {}) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    console.error('[/api/jobs] crash:', msg)
    return NextResponse.json({ jobs: [], error: msg }, { status: 500 })
  }
}
