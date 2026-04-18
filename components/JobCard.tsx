'use client'
import { motion } from 'framer-motion'
import { Job } from '@/lib/jobs'

interface JobCardProps {
  job: Job
  onApply: () => void
  onResume: () => void
}

export function JobCard({ job, onApply, onResume }: JobCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-[#E8F5E9] p-6 mb-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-[#2D2D2D] truncate">{job.title}</h3>
          <p className="text-[#6B7280] mt-1">
            {job.company} · {job.location}
            {job.daysAgo === 0 ? ' · Today' : ` · ${job.daysAgo}d ago`}
          </p>
          {job.matchReason && (
            <p className="text-[#7CB987] text-sm mt-2 flex items-center gap-1">
              <span>✦</span>
              <span>{job.matchReason}</span>
            </p>
          )}
          {job.description && (
            <p className="text-[#9CA3AF] text-sm mt-2 line-clamp-2">{job.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 bg-[#E8F5E9] rounded-full w-16 h-16 flex flex-col items-center justify-center">
          <span className="font-bold text-[#5a9768] text-lg">{job.match}%</span>
          <span className="text-xs text-[#6B7280]">Match</span>
        </div>
      </div>

      <div className="flex gap-3 mt-5 flex-wrap">
        {job.applied ? (
          <span className="bg-[#7CB987] text-white px-5 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
            <span>✓</span> Applied
          </span>
        ) : (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onApply}
            className="bg-[#7CB987] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#5a9768] transition-colors"
          >
            Apply Now
          </a>
        )}
        <button
          onClick={onResume}
          className="border border-[#7CB987] text-[#7CB987] px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#E8F5E9] transition-colors"
        >
          <span>📄</span> Customize Resume
        </button>
      </div>
    </motion.div>
  )
}
