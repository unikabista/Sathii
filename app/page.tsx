'use client'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type ActivePanel = 'features' | 'how-it-works' | null

const panelCopy = {
  features: {
    eyebrow: 'Features',
    title: 'What Sathi helps you do',
    accent: '#7CB987',
    cards: [
      {
        title: 'Mood-based goals',
        body: 'Sathi checks how you feel first, then sets a realistic application target so your progress still feels doable on low-energy days.',
      },
      {
        title: 'Resume support',
        body: 'You can upload your resume, pull out the key details, and generate a more tailored version for the jobs you actually want.',
      },
      {
        title: 'Companion chat',
        body: 'The chatbot gives quick encouragement, practical guidance, and a low-pressure place to think through job-search stress as it happens.',
      },
    ],
  },
  'how-it-works': {
    eyebrow: 'How It Works',
    title: 'How the experience works',
    accent: '#D46F4D',
    cards: [
      {
        title: 'Start with a check-in',
        body: 'You go through a short onboarding flow where Sathi learns about your background, your resume, and your current energy level.',
      },
      {
        title: 'Get a lighter plan',
        body: 'The app turns that into a manageable daily structure with a suggested goal, role context, and tools that keep the process moving.',
      },
      {
        title: 'Keep momentum',
        body: 'As you apply, Sathi stays alongside you with tailored resume help and supportive chat so job searching feels less isolating.',
      },
    ],
  },
} as const

export default function Landing() {
  const router = useRouter()
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActivePanel(null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const isPanelOpen = activePanel !== null
  const currentPanel = activePanel ? panelCopy[activePanel] : null

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FFFBF0] px-6">
      <motion.div
        animate={{ x: [0, 24, 0], y: [0, -18, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[-5rem] top-20 h-56 w-56 rounded-full bg-[#FDE7CC] blur-3xl"
      />
      <motion.div
        animate={{ x: [0, -18, 0], y: [0, 28, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-[-3rem] top-16 h-64 w-64 rounded-full bg-[#E4F4E7] blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -16, 0], rotate: [0, 4, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-4rem] left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-[#F8D7D0] blur-3xl"
      />

      <motion.div
        animate={{ filter: isPanelOpen ? 'blur(10px)' : 'blur(0px)', opacity: isPanelOpen ? 0.35 : 1 }}
        transition={{ duration: 0.25 }}
        className="relative z-10"
      >
        <header className="mx-auto grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center py-6">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-semibold tracking-tight text-[#D46F4D]"
          >
            Sathi
          </motion.div>

          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center justify-center gap-8 text-sm font-medium text-[#4B5563]"
          >
            <button
              onClick={() => setActivePanel('features')}
              className={`transition-colors hover:text-[#2D2D2D] ${
                activePanel === 'features' ? 'text-[#2D2D2D]' : ''
              }`}
            >
              Features
            </button>
            <button
              onClick={() => setActivePanel('how-it-works')}
              className={`transition-colors hover:text-[#2D2D2D] ${
                activePanel === 'how-it-works' ? 'text-[#2D2D2D]' : ''
              }`}
            >
              How It Works
            </button>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center justify-end gap-3"
          >
            <button
              onClick={() => router.push('/onboarding')}
              className="rounded-full border border-[#D9E3DD] bg-white/80 px-5 py-2 text-sm font-medium text-[#2D2D2D] backdrop-blur transition-colors hover:border-[#7CB987] hover:text-[#5a9768]"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/onboarding')}
              className="rounded-full bg-[#2D2D2D] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f2325]"
            >
              Sign up
            </button>
          </motion.div>
        </header>

        <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col items-center justify-center pb-16 pt-2 text-center md:-mt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
            transition={{
              opacity: { duration: 0.7 },
              scale: { duration: 0.7 },
              y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
            }}
            className="mb-8"
          >
            <svg width="126" height="158" viewBox="0 0 80 100" fill="none">
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
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-6 text-6xl font-bold tracking-tight text-[#D46F4D] sm:text-7xl md:text-8xl"
          >
            Sathi
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-10 max-w-2xl text-xl italic text-[#6B7280] sm:text-2xl"
          >
            "A friend is someone who walks beside you when the journey feels long."
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/onboarding')}
            className="rounded-full bg-[#7CB987] px-14 py-4 text-lg font-semibold text-white shadow-md transition-all hover:bg-[#5a9768]"
          >
            Get Started
          </motion.button>
        </section>
      </motion.div>

      <AnimatePresence>
        {currentPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePanel(null)}
              className="absolute inset-0 z-20 bg-[rgba(255,251,240,0.6)] backdrop-blur-sm"
            />

            <motion.section
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.28 }}
              className="absolute inset-x-6 top-[104px] z-30 mx-auto w-full max-w-5xl"
            >
              <div className="rounded-[2rem] border border-white/70 bg-white/88 p-8 shadow-[0_24px_90px_rgba(45,45,45,0.12)] backdrop-blur-xl sm:p-10">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <p
                      className="mb-3 text-sm font-semibold uppercase tracking-[0.25em]"
                      style={{ color: currentPanel.accent }}
                    >
                      {currentPanel.eyebrow}
                    </p>
                    <h2 className="text-3xl font-bold text-[#2D2D2D] sm:text-4xl">
                      {currentPanel.title}
                    </h2>
                  </div>

                  <button
                    onClick={() => setActivePanel(null)}
                    className="rounded-full border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#4B5563] transition-colors hover:border-[#D1D5DB] hover:text-[#111827]"
                  >
                    Close
                  </button>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  {currentPanel.cards.map((card, index) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.06 }}
                      className="rounded-[1.75rem] border border-[#ECECEC] bg-[#FFFCF7] p-6 text-left"
                    >
                      <h3 className="mb-3 text-xl font-semibold text-[#2D2D2D]">{card.title}</h3>
                      <p className="leading-relaxed text-[#6B7280]">{card.body}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
