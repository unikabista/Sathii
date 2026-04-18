'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plant } from '@/components/Plant'
import { ConfettiBlast } from '@/components/ConfettiBlast'
import { getToday, getStreak, incrementStreak } from '@/lib/store'

export default function Celebrate() {
  const router = useRouter()
  const [applied, setApplied] = useState(0)
  const [goal, setGoal] = useState(3)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    const today = getToday()
    setApplied(today.applied.length)
    setGoal(today.goal)
    const newStreak = incrementStreak()
    setStreak(newStreak)
  }, [])

  return (
    <main className="min-h-screen bg-[#FFFBF0] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
      <ConfettiBlast />

      {/* Full bloom plant */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.2 }}
        className="mb-6"
      >
        <Plant stage={4} size={160} />
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-5xl font-bold text-[#2D2D2D] mb-4"
      >
        You did it.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-lg text-[#6B7280] mb-10 max-w-md leading-relaxed"
      >
        You did what you said you&apos;d do today. That&apos;s not nothing — that&apos;s everything.
      </motion.p>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex gap-4 mb-10"
      >
        {[
          { label: 'Applied', value: applied, color: '#7CB987' },
          { label: 'Goal set', value: goal, color: '#5a9768' },
          { label: 'Day streak', value: streak, color: '#F4A261' },
        ].map(({ label, value, color }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl px-6 py-5 shadow-sm border border-[#E8F5E9] text-center min-w-[90px]"
          >
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            <p className="text-sm text-[#6B7280] mt-1">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="text-[#9CA3AF] italic text-sm max-w-sm mb-10"
      >
        &ldquo;That&apos;s enough for today. Close this tab, do something kind for yourself, and come back tomorrow. Sathi will be here.&rdquo;
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/dashboard')}
          className="bg-[#7CB987] text-white px-10 py-4 rounded-full font-semibold hover:bg-[#5a9768] transition-colors"
        >
          Back to Dashboard
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/')}
          className="border border-[#7CB987] text-[#7CB987] px-10 py-4 rounded-full font-semibold hover:bg-[#E8F5E9] transition-colors"
        >
          Start Fresh
        </motion.button>
      </motion.div>
    </main>
  )
}
