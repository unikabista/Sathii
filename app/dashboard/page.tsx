'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plant } from '@/components/Plant'
import { JobCard } from '@/components/JobCard'
import { ResumeModal } from '@/components/ResumeModal'
import { SathiChat } from '@/components/SathiChat'
import { fetchJobs, Job } from '@/lib/jobs'
import { getProfile, getToday, markApplied, SathiProfile, SathiToday } from '@/lib/store'

export default function Dashboard() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [profile, setProfile] = useState<SathiProfile>({})
  const [today, setToday] = useState<SathiToday>({ mood: 'good', goal: 3, applied: [], date: '' })
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  useEffect(() => {
    const p = getProfile()
    const t = getToday()
    setProfile(p)
    setToday(t)

    fetchJobs(p).then((fetched) => {
      const withApplied = fetched.map((j) => ({ ...j, applied: t.applied.includes(j.id) }))
      setJobs(withApplied)
      setLoading(false)
    })
  }, [])

  function handleApply(job: Job) {
    const updated = markApplied(job.id)
    setToday(updated)
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, applied: true } : j))

    if (updated.applied.length >= updated.goal) {
      setTimeout(() => router.push('/celebrate'), 800)
    }
  }

  const appliedCount = today.applied.length
  const plantStage = Math.min(4, Math.floor((appliedCount / Math.max(today.goal, 1)) * 4))

  const greetings: Record<string, string> = {
    drained: "Take it easy today. Even one application matters. 💙",
    okay: "You showed up. That's already a win. 🌿",
    good: "You're in a good groove. Let's make the most of it. ✨",
    motivated: "You're on fire today! Let's land something great. 🔥",
  }

  return (
    <main className="min-h-screen bg-[#FFFBF0] pb-24">
      {/* Plant widget — fixed top right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-4 right-4 bg-white rounded-2xl shadow-lg p-4 text-center z-30 border border-[#E8F5E9]"
      >
        <Plant stage={plantStage} size={80} />
        <p className="text-2xl font-bold text-[#2D2D2D] mt-1">{appliedCount}/{today.goal}</p>
        <p className="text-xs text-[#6B7280]">Applied</p>
        {appliedCount > 0 && appliedCount < today.goal && (
          <p className="text-xs text-[#7CB987] mt-1 font-medium">
            {today.goal - appliedCount} to go!
          </p>
        )}
      </motion.div>

      <div className="max-w-2xl mx-auto px-4 pt-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 pr-28">
          <p className="text-[#7CB987] font-medium mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-bold text-[#2D2D2D] mb-1">Your jobs for today</h1>
          {((profile.workTypes?.length ?? 0) > 0 || profile.city) && (
            <div className="flex flex-wrap gap-2 mt-2 mb-1">
              {profile.workTypes?.map((wt) => (
                <span key={wt} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#5a9768] text-sm font-medium">
                  {wt === 'remote' ? '🌍' : wt === 'hybrid' ? '🏙️' : '🏢'}
                  {' '}{wt.charAt(0).toUpperCase() + wt.slice(1)}
                </span>
              ))}
              {profile.city && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#5a9768] text-sm font-medium">
                  📍 {profile.city}
                </span>
              )}
            </div>
          )}
          <p className="text-[#6B7280]">
            {loading ? 'Finding your best matches...' : `${jobs.length} opportunities, handpicked for you`}
          </p>
          {today.mood && (
            <p className="text-sm text-[#9CA3AF] mt-2 italic">{greetings[today.mood]}</p>
          )}
        </motion.div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E8F5E9] p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-[#E8F5E9] rounded w-3/4" />
                    <div className="h-4 bg-[#E8F5E9] rounded w-1/2" />
                    <div className="h-3 bg-[#E8F5E9] rounded w-2/3" />
                  </div>
                  <div className="w-16 h-16 bg-[#E8F5E9] rounded-full" />
                </div>
                <div className="flex gap-3 mt-4">
                  <div className="h-9 bg-[#E8F5E9] rounded-full w-28" />
                  <div className="h-9 bg-[#E8F5E9] rounded-full w-36" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Job cards */}
        {!loading && jobs.map((job, i) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <JobCard
              job={job}
              onApply={() => handleApply(job)}
              onResume={() => setSelectedJob(job)}
            />
          </motion.div>
        ))}

        {/* Progress banner */}
        {!loading && appliedCount > 0 && appliedCount < today.goal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
      </div>

      {/* Resume modal */}
      {selectedJob && (
        <ResumeModal
          job={selectedJob}
          resumeText={profile.resumeText ?? ''}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* Sathi chat */}
      <SathiChat />
    </main>
  )
}
