'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plant } from '@/components/Plant'
import { JobCard } from '@/components/JobCard'
import { ResumeModal } from '@/components/ResumeModal'
import { FilterDrawer } from '@/components/FilterDrawer'
import { SathiChat } from '@/components/SathiChat'
import {
  fetchJobs, Job, FilterState,
  getFilters, saveFilters, countActiveFilters, DEFAULT_FILTER_STATE,
} from '@/lib/jobs'
import {
  getProfile, getToday, markApplied, SathiProfile, SathiToday,
  getSavedJobs, saveJob, unsaveJob, getAppliedLog, logApplied,
  AppliedLogEntry,
} from '@/lib/store'

type Tab = 'recommended' | 'saved' | 'applied'

// ─── Constants ────────────────────────────────────────────────────────────────
const COUNTRY_OPTIONS = [
  { code: 'us', name: 'US' },
  { code: 'gb', name: 'UK' },
  { code: 'ca', name: 'Canada' },
  { code: 'au', name: 'Australia' },
  { code: 'in', name: 'India' },
]

const LEVEL_CYCLE = ['', 'Intern', 'Entry Level', 'Mid Level', 'Senior', 'Lead'] as const

const TIME_OPTIONS = [
  { label: '24h',    days: 1  },
  { label: '3 days', days: 3  },
  { label: '1 week', days: 7  },
  { label: '14 days',days: 14 },
]

const JOB_TYPE_OPTIONS = [
  { label: 'Full-time',  value: 'fulltime'  },
  { label: 'Part-time',  value: 'parttime'  },
  { label: 'Contract',   value: 'contract'  },
  { label: 'Internship', value: 'internship'},
]

const WORK_MODEL_CYCLE = [
  { label: 'All',    value: []         },
  { label: 'Remote', value: ['remote'] },
  { label: 'Hybrid', value: ['hybrid'] },
  { label: 'Onsite', value: ['onsite'] },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter()

  // ── core data ────────────────────────────────────────────────────────────────
  const [jobs, setJobs]               = useState<Job[]>([])
  const [profile, setProfile]         = useState<SathiProfile>({})
  const [today, setToday]             = useState<SathiToday>({ mood: 'good', goal: 3, applied: [], date: '' })
  const [savedIds, setSavedIds]       = useState<Set<string>>(new Set())
  const [savedJobs, setSavedJobs]     = useState<Job[]>([])
  const [appliedLog, setAppliedLog]   = useState<AppliedLogEntry[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // ── filter state ─────────────────────────────────────────────────────────────
  const [filters, setFilters]         = useState<FilterState>(DEFAULT_FILTER_STATE)

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [loading, setLoading]         = useState(true)
  const [fetchError, setFetchError]   = useState<string | null>(null)
  const [activeTab, setActiveTab]     = useState<Tab>('recommended')
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [typeDropOpen, setTypeDropOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  // ref for Type dropdown click-outside
  const typeDropRef = useRef<HTMLDivElement>(null)

  // stable ref to profile so runFetch doesn't need profile in deps
  const profileRef = useRef<SathiProfile>({})
  useEffect(() => { profileRef.current = profile }, [profile])

  // ─── Fetch jobs ───────────────────────────────────────────────────────────────
  const runFetch = useCallback(async (fs: FilterState) => {
    setLoading(true)
    setFetchError(null)
    const p = profileRef.current
    console.log('[Dashboard] fetch — roles:', fs.roles, 'level:', fs.level, 'workModel:', fs.workModel, 'country:', fs.country, 'days:', fs.daysOld)
    try {
      const fetched = await fetchJobs(fs, p.skills ?? [], p.type ?? '')
      console.log('[Dashboard] received', fetched.length, 'jobs')
      const t = getToday()
      setJobs(fetched.map(j => ({ ...j, applied: t.applied.includes(j.id) })))
      if (fetched.length === 0) setFetchError('no_results')
    } catch (err) {
      console.error('[Dashboard] fetch error:', err)
      setFetchError('api_error')
    }
    setLoading(false)
  }, [])

  // ─── Single filter updater — updates state + saves + refetches ────────────────
  function applyFilter(patch: Partial<FilterState>) {
    setFilters(prev => {
      const next = { ...prev, ...patch }
      saveFilters(next)
      runFetch(next)
      return next
    })
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const p     = getProfile()
    const t     = getToday()
    const saved = getSavedJobs()
    const log   = getAppliedLog()
    const storedFs = getFilters()

    profileRef.current = p
    setProfile(p)
    setToday(t)
    setSavedIds(new Set(saved.map(j => j.id)))
    setSavedJobs(saved)
    setAppliedLog(log)

    // Pre-fill roles from profile titles if none stored
    const initFs: FilterState =
      storedFs.roles.length === 0 && p.titles?.length
        ? { ...storedFs, roles: p.titles.slice(0, 3) }
        : storedFs

    setFilters(initFs)
    runFetch(initFs)
  }, [runFetch])

  // ─── Click-outside for Type dropdown ─────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (typeDropRef.current && !typeDropRef.current.contains(e.target as Node)) {
        setTypeDropOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ─── Pill actions ─────────────────────────────────────────────────────────────
  function cycleLevel() {
    const idx  = LEVEL_CYCLE.indexOf(filters.level as typeof LEVEL_CYCLE[number])
    const next = LEVEL_CYCLE[(idx + 1) % LEVEL_CYCLE.length]
    applyFilter({ level: next })
  }

  function cycleWorkModel() {
    const cur  = JSON.stringify([...filters.workModel].sort())
    const idx  = WORK_MODEL_CYCLE.findIndex(m => JSON.stringify([...m.value].sort()) === cur)
    const next = WORK_MODEL_CYCLE[(idx + 1) % WORK_MODEL_CYCLE.length]
    applyFilter({ workModel: next.value })
  }

  function toggleJobType(value: string) {
    const arr = filters.jobType.includes(value)
      ? filters.jobType.filter(v => v !== value)
      : [...filters.jobType, value]
    applyFilter({ jobType: arr })
  }

  // ─── Job actions ──────────────────────────────────────────────────────────────
  function handleApply(job: Job) {
    const updated = markApplied(job.id)
    logApplied({ ...job, applied: true })
    setToday(updated)
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applied: true } : j))
    setAppliedLog(getAppliedLog())
    if (updated.applied.length >= updated.goal) setTimeout(() => router.push('/celebrate'), 800)
  }

  function handleSave(job: Job) {
    if (savedIds.has(job.id)) {
      unsaveJob(job.id)
      setSavedIds(prev => { const n = new Set(prev); n.delete(job.id); return n })
      setSavedJobs(prev => prev.filter(j => j.id !== job.id))
    } else {
      saveJob(job)
      setSavedIds(prev => new Set([...prev, job.id]))
      setSavedJobs(prev => [...prev, job])
    }
  }

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const appliedCount   = today.applied.length
  const plantStage     = Math.min(4, Math.floor((appliedCount / Math.max(today.goal, 1)) * 4))
  const activeCount    = countActiveFilters(filters)
  const visibleJobs    = jobs.filter(j => !dismissedIds.has(j.id))

  const workModelLabel = (() => {
    const m = WORK_MODEL_CYCLE.find(x => JSON.stringify([...x.value].sort()) === JSON.stringify([...filters.workModel].sort()))
    return m ? m.label : filters.workModel[0] ?? 'All'
  })()

  const jobTypeLabel = filters.jobType.length === 0
    ? 'Any Type'
    : JOB_TYPE_OPTIONS.filter(o => filters.jobType.includes(o.value)).map(o => o.label).join(', ')

  const greetings: Record<string, string> = {
    drained:   'Take it easy today. Even one application matters.',
    okay:      "You showed up. That's already a win.",
    good:      "You're in a good groove. Let's make the most of it.",
    motivated: "You're on fire today! Let's land something great.",
  }

  // ─── Pill style helper ────────────────────────────────────────────────────────
  function pill(active: boolean, extra = '') {
    return `flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${extra} ${
      active
        ? 'bg-[#7CB987] text-white border-[#7CB987]'
        : 'bg-white text-[#2D2D2D] border-[#7CB987] hover:bg-[#E8F5E9]'
    }`
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#FFFBF0] pb-24">

      {/* Plant widget */}
      <motion.div
        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
        className="fixed top-4 right-4 bg-white rounded-2xl shadow-lg p-4 text-center z-30 border border-[#E8F5E9]"
      >
        <Plant stage={plantStage} size={80} />
        <p className="text-2xl font-bold text-[#2D2D2D] mt-1">{appliedCount}/{today.goal}</p>
        <p className="text-xs text-[#6B7280]">Applied</p>
        {appliedCount > 0 && appliedCount < today.goal && (
          <p className="text-xs text-[#7CB987] mt-1 font-medium">{today.goal - appliedCount} to go!</p>
        )}
      </motion.div>

      <div className="max-w-3xl mx-auto px-4 pt-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 pr-28">
          <p className="text-[#7CB987] font-medium mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-bold text-[#2D2D2D] mb-1">Your jobs for today</h1>
          <p className="text-[#6B7280]">
            {loading
              ? 'Searching job boards for tech roles...'
              : `${visibleJobs.length} opportunities, handpicked for you`}
          </p>
          {today.mood && (
            <p className="text-sm text-[#9CA3AF] mt-1 italic">{greetings[today.mood]}</p>
          )}
        </motion.div>

        {/* ── Top filter bar ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>

            {/* Country */}
            <select
              value={filters.country}
              onChange={e => applyFilter({ country: e.target.value })}
              className={`${pill(filters.country !== 'us')} cursor-pointer appearance-none pr-1`}
            >
              {COUNTRY_OPTIONS.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>

            {/* Role pills (up to 2, then +N) */}
            {filters.roles.length === 0 ? (
              <button onClick={() => setDrawerOpen(true)} className={pill(false)}>Any Role</button>
            ) : (
              <>
                {filters.roles.slice(0, 2).map(r => (
                  <button key={r} onClick={() => setDrawerOpen(true)} className={pill(true)}>
                    {r}
                  </button>
                ))}
                {filters.roles.length > 2 && (
                  <button onClick={() => setDrawerOpen(true)} className={pill(true)}>
                    +{filters.roles.length - 2} more
                  </button>
                )}
              </>
            )}

            {/* Level — cycles on click */}
            <button onClick={cycleLevel} className={pill(!!filters.level)} title="Click to cycle experience level">
              {filters.level || 'Any Level'}
            </button>

            {/* Job Type — mini dropdown */}
            <div className="relative flex-shrink-0" ref={typeDropRef}>
              <button
                onClick={() => setTypeDropOpen(v => !v)}
                className={pill(filters.jobType.length > 0)}
              >
                {filters.jobType.length === 0 ? 'Any Type' : `${JOB_TYPE_OPTIONS.find(o => o.value === filters.jobType[0])?.label ?? filters.jobType[0]}${filters.jobType.length > 1 ? ` +${filters.jobType.length - 1}` : ''}`}
              </button>
              {typeDropOpen && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-[#E8F5E9] p-3 z-20 w-44">
                  {JOB_TYPE_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-[#F9FAFB] rounded-lg px-1">
                      <input
                        type="checkbox"
                        checked={filters.jobType.includes(opt.value)}
                        onChange={() => { toggleJobType(opt.value); }}
                        className="w-3.5 h-3.5 accent-[#7CB987]"
                      />
                      <span className="text-sm text-[#2D2D2D]">{opt.label}</span>
                    </label>
                  ))}
                  {filters.jobType.length > 0 && (
                    <button
                      onClick={() => { applyFilter({ jobType: [] }); setTypeDropOpen(false) }}
                      className="text-xs text-[#6B7280] hover:text-[#7CB987] mt-1 w-full text-left px-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Work Model — cycles on click */}
            <button
              onClick={cycleWorkModel}
              className={pill(filters.workModel.length > 0)}
              title="Click to cycle: All → Remote → Hybrid → Onsite"
            >
              {workModelLabel}
            </button>

            {/* Time pills */}
            {TIME_OPTIONS.map(t => (
              <button
                key={t.days}
                onClick={() => applyFilter({ daysOld: t.days })}
                className={pill(filters.daysOld === t.days)}
              >
                {t.label}
              </button>
            ))}

            {/* All Filters */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border border-[#7CB987] bg-white text-[#7CB987] hover:bg-[#E8F5E9] transition-colors whitespace-nowrap"
            >
              All Filters
              {activeCount > 0 && (
                <span className="bg-[#7CB987] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 mb-5 border-b border-[#E8F5E9]">
          {(['recommended', 'saved', 'applied'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#7CB987] text-[#7CB987]'
                  : 'border-transparent text-[#6B7280] hover:text-[#2D2D2D]'
              }`}
            >
              {tab}
              {tab === 'saved' && savedJobs.length > 0 && (
                <span className="ml-1.5 bg-[#E8F5E9] text-[#5a9768] text-xs px-1.5 py-0.5 rounded-full">
                  {savedJobs.length}
                </span>
              )}
              {tab === 'applied' && appliedLog.length > 0 && (
                <span className="ml-1.5 bg-[#E8F5E9] text-[#5a9768] text-xs px-1.5 py-0.5 rounded-full">
                  {appliedLog.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Recommended tab ────────────────────────────────────────────────── */}
        {activeTab === 'recommended' && (
          <>
            {/* Skeleton */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-[#E8F5E9] p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-11 h-11 bg-[#E8F5E9] rounded-xl flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-[#E8F5E9] rounded w-3/4" />
                        <div className="h-3 bg-[#E8F5E9] rounded w-1/2" />
                        <div className="h-3 bg-[#E8F5E9] rounded w-2/3" />
                      </div>
                      <div className="w-16 h-16 bg-[#E8F5E9] rounded-full flex-shrink-0" />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <div className="h-9 bg-[#E8F5E9] rounded-full w-28" />
                      <div className="h-9 bg-[#E8F5E9] rounded-full w-36" />
                    </div>
                  </div>
                ))}
                <p className="text-center text-sm text-[#9CA3AF] py-2">Searching job boards for tech roles...</p>
              </div>
            )}

            {/* Job cards */}
            <AnimatePresence>
              {!loading && visibleJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <JobCard
                    job={job}
                    saved={savedIds.has(job.id)}
                    onApply={() => handleApply(job)}
                    onResume={() => setSelectedJob(job)}
                    onSave={() => handleSave(job)}
                    onDismiss={() => setDismissedIds(prev => new Set([...prev, job.id]))}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty state */}
            {!loading && visibleJobs.length === 0 && (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">{fetchError === 'api_error' ? '⚠️' : '🔍'}</div>
                {fetchError === 'api_error' ? (
                  <>
                    <p className="font-medium text-[#6B7280]">Could not reach job APIs.</p>
                    <p className="text-sm text-[#9CA3AF] mt-1">Check your network and try again.</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-[#6B7280]">
                      No jobs found for <span className="text-[#7CB987]">{filters.roles[0] ?? 'your search'}</span>
                      {filters.city ? ` in ${filters.city}` : filters.country !== 'us' ? ` in ${filters.country.toUpperCase()}` : ''}.
                    </p>
                    <p className="text-sm text-[#9CA3AF] mt-1">Try broader filters or different role titles.</p>
                  </>
                )}
                <div className="flex gap-3 justify-center mt-5">
                  <button
                    onClick={() => runFetch(filters)}
                    className="px-5 py-2 bg-[#7CB987] text-white rounded-full text-sm hover:bg-[#5a9768]"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => applyFilter(DEFAULT_FILTER_STATE)}
                    className="px-5 py-2 border border-[#7CB987] text-[#7CB987] rounded-full text-sm hover:bg-[#E8F5E9]"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Progress banner */}
            {!loading && appliedCount > 0 && appliedCount < today.goal && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-2 bg-[#E8F5E9] rounded-2xl p-4 text-center"
              >
                <div className="w-full bg-white rounded-full h-2 mb-2">
                  <motion.div
                    className="bg-[#7CB987] h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(appliedCount / today.goal) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-[#5a9768] font-medium">
                  {appliedCount}/{today.goal} done · {today.goal - appliedCount} more and your plant blooms! 🌱
                </p>
              </motion.div>
            )}
          </>
        )}

        {/* ── Saved tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'saved' && (
          savedJobs.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <div className="text-4xl mb-3">♡</div>
              <p className="font-medium text-[#6B7280]">No saved jobs yet.</p>
              <p className="text-sm mt-1">Heart a job to save it here.</p>
            </div>
          ) : (
            <AnimatePresence>
              {savedJobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <JobCard
                    job={{ ...job, applied: today.applied.includes(job.id) }}
                    saved
                    onApply={() => handleApply(job)}
                    onResume={() => setSelectedJob(job)}
                    onSave={() => handleSave(job)}
                    onDismiss={() => handleSave(job)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          )
        )}

        {/* ── Applied tab ────────────────────────────────────────────────────── */}
        {activeTab === 'applied' && (
          appliedLog.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-medium text-[#6B7280]">No applications tracked yet.</p>
              <p className="text-sm mt-1">Click "Apply Now" to log your applications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appliedLog.map((entry, i) => (
                <motion.div
                  key={`${entry.job.id}-${i}`}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-[#E8F5E9] p-5 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 bg-[#7CB987]">
                    {entry.job.company[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#2D2D2D] truncate">{entry.job.title}</p>
                    <p className="text-sm text-[#6B7280]">{entry.job.company} · {entry.job.location}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs bg-[#E8F5E9] text-[#5a9768] px-3 py-1 rounded-full font-medium">Applied</span>
                    <p className="text-xs text-[#9CA3AF] mt-1">{entry.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        open={drawerOpen}
        filters={filters}
        onClose={() => setDrawerOpen(false)}
        onChange={fs => { setFilters(fs); saveFilters(fs); runFetch(fs) }}
      />

      {/* Resume modal */}
      {selectedJob && (
        <ResumeModal
          job={selectedJob}
          resumeText={profile.resumeText ?? ''}
          onClose={() => setSelectedJob(null)}
        />
      )}

      <SathiChat />
    </main>
  )
}
