'use client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function Landing() {
  const router = useRouter()
  return (
    <main className="min-h-screen bg-[#FFFBF0] flex flex-col items-center justify-center text-center px-6">
      {/* Decorative plant silhouette */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
          <rect x="30" y="70" width="20" height="22" rx="4" fill="#8B6340" />
          <rect x="26" y="82" width="28" height="10" rx="3" fill="#6B4F2A" />
          <line x1="40" y1="70" x2="40" y2="20" stroke="#7CB987" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="26" cy="48" rx="12" ry="8" fill="#7CB987" transform="rotate(-30 26 48)" />
          <ellipse cx="54" cy="40" rx="12" ry="8" fill="#5a9768" transform="rotate(30 54 40)" />
          <ellipse cx="40" cy="22" rx="10" ry="10" fill="#F4A261" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <ellipse
              key={i}
              cx={40 + 15 * Math.cos((angle * Math.PI) / 180)}
              cy={22 + 15 * Math.sin((angle * Math.PI) / 180)}
              rx="6"
              ry="4"
              fill="#F4A261"
              transform={`rotate(${angle} ${40 + 15 * Math.cos((angle * Math.PI) / 180)} ${22 + 15 * Math.sin((angle * Math.PI) / 180)})`}
            />
          ))}
          <circle cx="40" cy="22" r="7" fill="#E76F51" />
        </svg>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-7xl font-bold text-[#2D2D2D] mb-6 tracking-tight"
      >
        Sathi
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl italic text-[#6B7280] mb-4 max-w-lg"
      >
        "A friend is someone who walks beside you when the journey feels long."
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-[#6B7280] mb-12 max-w-md leading-relaxed"
      >
        Job searching doesn&apos;t have to be overwhelming. Let&apos;s make it feel a little lighter, together.
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push('/onboarding')}
        className="bg-[#7CB987] text-white px-14 py-4 rounded-full text-lg font-semibold hover:bg-[#5a9768] transition-all shadow-md"
      >
        Get Started
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-sm text-[#9CA3AF]"
      >
        Free · No account needed · Takes 2 minutes
      </motion.p>
    </main>
  )
}
