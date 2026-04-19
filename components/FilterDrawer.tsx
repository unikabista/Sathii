'use client'
import { useState, useRef, KeyboardEvent, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FilterState, DEFAULT_FILTER_STATE } from '@/lib/jobs'

interface FilterDrawerProps {
  open: boolean
  filters: FilterState
  onClose: () => void
  onChange: (fs: FilterState) => void  // triggers refetch in parent
}

const JOB_TYPE_OPTIONS = [
  { label: 'Full-time',  value: 'fulltime' },
  { label: 'Part-time',  value: 'parttime' },
  { label: 'Contract',   value: 'contract' },
  { label: 'Internship', value: 'internship' },
]
const WORK_MODEL_OPTIONS = [
  { label: 'Remote',  value: 'remote' },
  { label: 'Hybrid',  value: 'hybrid' },
  { label: 'Onsite',  value: 'onsite' },
]
const COUNTRY_OPTIONS = [
  { code: 'us', name: 'US' },
  { code: 'gb', name: 'UK' },
  { code: 'ca', name: 'Canada' },
  { code: 'au', name: 'Australia' },
  { code: 'in', name: 'India' },
]
const EXPERIENCE_LEVELS = ['Intern', 'Entry Level', 'Mid Level', 'Senior', 'Lead']
const TIME_OPTIONS = [
  { label: 'Past 24h',    value: 1 },
  { label: 'Past 3 days', value: 3 },
  { label: 'Past week',   value: 7 },
  { label: 'Past 14 days',value: 14 },
]

export function FilterDrawer({ open, filters, onClose, onChange }: FilterDrawerProps) {
  const [local, setLocal] = useState<FilterState>(filters)
  const [tagInput, setTagInput] = useState('')
  const tagRef = useRef<HTMLInputElement>(null)

  // Sync when parent filters change (e.g. reset from outside)
  useEffect(() => { setLocal(filters) }, [filters])

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setLocal(prev => ({ ...prev, [key]: value }))
  }

  function toggleArray<K extends 'jobType' | 'workModel'>(key: K, value: string) {
    setLocal(prev => {
      const arr = prev[key] as string[]
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  function addRole(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim()
      if (!local.roles.includes(tag)) set('roles', [...local.roles, tag])
      setTagInput('')
    }
  }

  function removeRole(tag: string) {
    set('roles', local.roles.filter(t => t !== tag))
  }

  function applyFilters() {
    onChange(local)
    onClose()
  }

  function resetFilters() {
    const reset = { ...DEFAULT_FILTER_STATE }
    setLocal(reset)
    onChange(reset)
    onClose()
  }

  const salaryLabel = `$${Math.round(local.salaryMin / 1000)}k – $${Math.round(local.salaryMax / 1000)}k`

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#FFFBF0] z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E8F5E9]">
              <h2 className="text-xl font-bold text-[#2D2D2D]">All Filters</h2>
              <button onClick={onClose} className="text-[#6B7280] hover:text-[#2D2D2D] text-2xl leading-none">×</button>
            </div>

            {/* Scrollable sections */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">

              {/* Roles */}
              <section>
                <h3 className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wide mb-3">Job Roles</h3>
                <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
                  {local.roles.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-[#7CB987] text-white text-sm px-3 py-1 rounded-full">
                      {tag}
                      <button onClick={() => removeRole(tag)} className="hover:opacity-70 ml-1 leading-none">×</button>
                    </span>
                  ))}
                </div>
                <input
                  ref={tagRef}
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addRole}
                  placeholder="Type a role, press Enter to add"
                  className="w-full border border-[#E8F5E9] rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-[#7CB987] text-[#2D2D2D] placeholder-[#9CA3AF]"
                />
              </section>

              {/* Excluded Title */}
              <section>
                <h3 className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wide mb-3">Exclude Title Keyword</h3>
                <input
                  value={local.excludedTitle}
                  onChange={e => set('excludedTitle', e.target.value)}
                  placeholder="e.g. Senior, Manager"
                  className="w-full border border-[#E8F5E9] rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-[#7CB987] text-[#2D2D2D] placeholder-[#9CA3AF]"
                />
              </section>

              {/* Job Type */}
              <section>
                <h3 className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wide mb-3">Job Type</h3>
                <div className="space-y-2">
                  {JOB_TYPE_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={local.jobType.includes(opt.value)}
                        onChange={() => toggleArray('jobType', opt.value)}
                        className="w-4 h-4 accent-[#7CB987] cursor-pointer"
                      />
                      <span className="text-sm text-[#2D2D2D]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Work Model */}
              <section>
                <h3 className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wide mb-3">Work Model</h3>
                <div className="space-y-2">
                  {WORK_MODEL_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={local.workModel.includes(opt.value)}
                        onChange={() => toggleArray('workModel', opt.value)}
                        className="w-4 h-4 accent-[#7CB987] cursor-pointer"
                      />
                      <span className="text-sm text-[#2D2D2D]">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Location */}
              <section>
                <h3 className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wide mb-3">Location</h3>
                <select
                  value={local.country}
                  onChange={e => set('country', e.target.value)}
                  className="w-full border border-[#E8F5E9] rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-[#7CB987] text-[#2D2D2D] mb-2"
                >
                  {COUNTRY_OPTIONS.map(c => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <input
                  value={local.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="City (optional)"
                  className="w-full border border-[#E8F5E9] rounded-xl px-4 py-2 text-sm bg-white focus:outline-none focus:border-[#7CB987] text-[#2D2D2D] placeholder-[#9CA3AF]"
                />
              </section>

              {/* Salary Range */}
              <section>
                <h3 className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wide mb-1">Salary Range</h3>
                <p className="text-[#7CB987] font-semibold text-sm mb-3">{salaryLabel}</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#6B7280] mb-1 block">Minimum</label>
                    <input
                      type="range" min={0} max={200000} step={5000}
                      value={local.salaryMin}
                      onChange={e => {
                        const v = Number(e.target.value)
                        if (v <= local.salaryMax) set('salaryMin', v)
                      }}
                      className="w-full accent-[#7CB987]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#6B7280] mb-1 block">Maximum</label>
                    <input
                      type="range" min={0} max={200000} step={5000}
                      value={local.salaryMax}
                      onChange={e => {
                        const v = Number(e.target.value)
                        if (v >= local.salaryMin) set('salaryMax', v)
                      }}
                      className="w-full accent-[#7CB987]"
                    />
                  </div>
                </div>
              </section>

              {/* Experience Level */}
              <section>
                <h3 className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wide mb-3">Experience Level</h3>
                <div className="space-y-2">
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <label key={lvl} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio" name="exp"
                        checked={local.level === lvl}
                        onChange={() => set('level', lvl)}
                        className="w-4 h-4 accent-[#7CB987] cursor-pointer"
                      />
                      <span className="text-sm text-[#2D2D2D]">{lvl}</span>
                    </label>
                  ))}
                  {local.level && (
                    <button onClick={() => set('level', '')} className="text-xs text-[#6B7280] hover:text-[#7CB987]">
                      Clear selection
                    </button>
                  )}
                </div>
              </section>

              {/* Time Posted */}
              <section>
                <h3 className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wide mb-3">Time Posted</h3>
                <div className="flex flex-wrap gap-2">
                  {TIME_OPTIONS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => set('daysOld', t.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        local.daysOld === t.value
                          ? 'bg-[#7CB987] text-white border-[#7CB987]'
                          : 'bg-white text-[#2D2D2D] border-[#7CB987] hover:bg-[#E8F5E9]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-[#E8F5E9] flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 border border-[#7CB987] text-[#7CB987] py-3 rounded-full font-medium hover:bg-[#E8F5E9] transition-colors text-sm"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 bg-[#7CB987] text-white py-3 rounded-full font-semibold hover:bg-[#5a9768] transition-colors text-sm"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
