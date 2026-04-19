'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Job } from '@/lib/jobs'

interface JobCardProps {
  job: Job
  saved: boolean
  onApply: () => void
  onResume: () => void
  onSave: () => void
  onDismiss: () => void
}

const LOGO_COLORS = [
  '#7CB987', '#5a9768', '#4A90B8', '#E07B54', '#9B6BB5',
  '#D4A017', '#3A8C8C', '#C45B7E', '#7B8EC8', '#5C8C5C',
]

function getLogoColor(company: string) {
  let hash = 0
  for (let i = 0; i < company.length; i++) hash = company.charCodeAt(i) + ((hash << 5) - hash)
  return LOGO_COLORS[Math.abs(hash) % LOGO_COLORS.length]
}

function MatchBadge({ match, label }: { match: number; label: string }) {
  const bg =
    label === 'STRONG MATCH' ? '#7CB987' :
    label === 'GOOD MATCH' ? '#FFD166' : '#9CA3AF'
  const text = label === 'GOOD MATCH' ? '#2D2D2D' : 'white'
  return (
    <div className="flex flex-col items-center flex-shrink-0">
      <div
        className="w-16 h-16 rounded-full flex flex-col items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <span className="font-bold text-lg leading-none" style={{ color: text }}>{match}%</span>
      </div>
      <span className="text-xs font-semibold mt-1 text-center leading-tight max-w-[68px]"
        style={{ color: bg === '#FFD166' ? '#D4A017' : bg }}>
        {label}
      </span>
    </div>
  )
}

export function JobCard({ job, saved, onApply, onResume, onSave, onDismiss }: JobCardProps) {
  const [dismissed, setDismissed] = useState(false)
  const initial = job.company.trim()[0]?.toUpperCase() ?? '?'
  const logoColor = getLogoColor(job.company)

  if (dismissed) return null

  const workTypeIcon = job.workType === 'remote' ? '🌐' : job.workType === 'hybrid' ? '🏠' : '🏢'
  const workTypeLabel = job.workType.charAt(0).toUpperCase() + job.workType.slice(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="bg-white rounded-2xl border border-[#E8F5E9] p-5 mb-4 shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Top row: logo + meta + match badge */}
      <div className="flex gap-4 items-start">
        {/* Logo */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: logoColor }}
        >
          {initial}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#9CA3AF] mb-0.5">{job.postedAt}</p>
              <h3 className="text-lg font-bold text-[#2D2D2D] leading-tight">{job.title}</h3>
              <p className="text-sm text-[#6B7280] mt-0.5">{job.company}</p>
            </div>
            <MatchBadge match={job.match} label={job.matchLabel} />
          </div>

          {/* Detail pills */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-[#6B7280]">
            <span className="flex items-center gap-1">
              <span>📍</span>{job.location}
            </span>
            <span className="flex items-center gap-1">
              <span>💼</span>{job.employmentType}
            </span>
            {job.salary && (
              <span className="flex items-center gap-1">
                <span>💰</span>{job.salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <span>{workTypeIcon}</span>{workTypeLabel}
            </span>
          </div>

          {/* Description snippet */}
          {job.description && (
            <p className="text-[#9CA3AF] text-sm mt-3 line-clamp-2">{job.description}</p>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {job.applied ? (
          <span className="bg-[#7CB987] text-white px-5 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
            ✓ Applied
          </span>
        ) : (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onApply}
            className="bg-[#7CB987] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#5a9768] transition-colors"
          >
            Apply Now
          </a>
        )}
        <button
          onClick={onResume}
          className="border border-[#7CB987] text-[#7CB987] px-5 py-2 rounded-full text-sm font-medium hover:bg-[#E8F5E9] transition-colors"
        >
          Customize Resume
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onSave}
            title={saved ? 'Unsave' : 'Save'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors border ${
              saved
                ? 'bg-[#E8F5E9] border-[#7CB987] text-[#7CB987]'
                : 'bg-white border-[#E8F5E9] text-[#9CA3AF] hover:border-[#7CB987] hover:text-[#7CB987]'
            }`}
          >
            {saved ? '♥' : '♡'}
          </button>
          <button
            onClick={() => { setDismissed(true); onDismiss() }}
            title="Dismiss"
            className="w-9 h-9 rounded-full flex items-center justify-center border border-[#E8F5E9] text-[#9CA3AF] hover:border-red-200 hover:text-red-400 transition-colors bg-white"
          >
            ✕
          </button>
        </div>
      </div>
    </motion.div>
  )
}
