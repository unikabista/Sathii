'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { getToday } from '@/lib/store'

type Mood = 'drained' | 'okay' | 'good' | 'motivated'
type Step = 'mood' | 'roles'

const MOOD_GOALS: Record<Mood, number> = {
  drained: 2,
  okay: 3,
  good: 4,
  motivated: 5,
}

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

function MoodFace({ mood }: { mood: Mood }) {
  const stroke = '#3A4144'
  const mouth = {
    drained: 'M46 62 Q56 54 66 62',
    okay: 'M47 60 L65 60',
    good: 'M45 57 Q56 66 67 57',
    motivated: 'M43 56 Q56 70 69 56',
  }[mood]
  const eyebrow = mood === 'drained'

  return (
    <svg viewBox="0 0 112 112" aria-hidden="true" className="h-24 w-24" fill="none">
      <circle cx="56" cy="56" r="42" stroke={stroke} strokeWidth="4" />
      {eyebrow && <path d="M42 42 L49 39" stroke={stroke} strokeWidth="4" strokeLinecap="round" />}
      {eyebrow && <path d="M63 39 L70 42" stroke={stroke} strokeWidth="4" strokeLinecap="round" />}
      <circle cx="47" cy="48" r="4.5" fill={stroke} />
      <circle cx="65" cy="48" r="4.5" fill={stroke} />
      <path d={mouth} stroke={stroke} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

function FlowerMark() {
  return (
    <svg width="82" height="102" viewBox="0 0 80 100" fill="none" aria-hidden="true">
      <rect x="30" y="70" width="20" height="22" rx="4" fill="#8B6340" />
      <rect x="26" y="82" width="28" height="10" rx="3" fill="#6B4F2A" />
      <line x1="40" y1="70" x2="40" y2="20" stroke="#7CB987" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="26" cy="48" rx="12" ry="8" fill="#7CB987" transform="rotate(-30 26 48)" />
      <ellipse cx="54" cy="40" rx="12" ry="8" fill="#5a9768" transform="rotate(30 54 40)" />
      <ellipse cx="40" cy="22" rx="10" ry="10" fill="#F4A261" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
        <ellipse
          key={index}
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
  )
}

function FloatingSathi({ message }: { message: string }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            className="fixed bottom-28 right-6 z-40 w-[28rem] max-w-[calc(100vw-3rem)] overflow-hidden rounded-[2rem] border border-[#E7E1D6] bg-white shadow-[0_22px_55px_rgba(45,45,45,0.08)]"
          >
            <div className="flex items-start justify-between bg-[#8FBC8C] px-5 py-5 text-white">
              <div>
                <p className="text-2xl font-semibold leading-none">Sathi</p>
                <p className="mt-2 text-base text-white/90">Your job search companion</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-white/90"
                aria-label="Close Sathi chat"
              >
                ×
              </button>
            </div>

            <div className="min-h-[20rem] px-5 py-6">
              <div className="max-w-[20rem] rounded-[1.5rem] bg-[#F2F4F7] px-5 py-4 text-left text-[1.05rem] leading-relaxed text-[#2D2D2D]">
                {message}
              </div>
            </div>

            <div className="border-t border-[#ECE7DD] px-4 py-4">
              <div className="flex items-center gap-3">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask Sathi anything..."
                  className="flex-1 rounded-full border border-[#E4E0D8] bg-white px-5 py-3 text-lg text-[#2D2D2D] outline-none focus:border-[#8FBC8C]"
                />
                <button
                  type="button"
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C5DDBF] text-2xl text-white"
                  aria-label="Send"
                >
                  →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 overflow-hidden rounded-full bg-white shadow-[0_18px_40px_rgba(45,45,45,0.18)]"
        aria-label="Open Sathi assistant"
      >
        <video autoPlay loop muted playsInline preload="auto" className="h-full w-full object-cover">
          <source src="/setup-sathi.mp4" type="video/mp4" />
        </video>
      </motion.button>
    </>
  )
}

function splitList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('mood')
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null)
  const [rolesInput, setRolesInput] = useState('')

  function chooseMood(mood: Mood) {
    const today = getToday()
    localStorage.setItem(
      'sathi_today',
      JSON.stringify({
        ...today,
        mood,
        goal: MOOD_GOALS[mood],
        applied: today.applied ?? [],
        date: new Date().toDateString(),
      })
    )
    setSelectedMood(mood)
    setTimeout(() => setStep('roles'), 180)
  }

  function finishSetup() {
    const existing = JSON.parse(localStorage.getItem('sathi_profile') || '{}')
    localStorage.setItem(
      'sathi_profile',
      JSON.stringify({
        ...existing,
        preferredRoles: splitList(rolesInput),
      })
    )
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#FBF8F1] px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end">
        <button
          onClick={() => router.push('/settings')}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE8D9] bg-white text-xl shadow-sm transition-colors hover:border-[#7CB987]"
          aria-label="Open settings"
        >
          🌱
        </button>
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 'mood' && (
            <motion.div
              key="mood"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mb-10"
              >
                <FlowerMark />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="mb-5 text-5xl font-semibold tracking-tight text-[#2D2D2D] sm:text-6xl"
              >
                How are you feeling today?
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18 }}
                className="max-w-2xl text-lg text-[#7A7F86]"
              >
                Pick the mood that fits right now. We&apos;ll shape today&apos;s pace inside the app around it.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="grid w-full max-w-5xl gap-4 md:grid-cols-2 xl:grid-cols-4 mt-10"
              >
                {([
                  { key: 'drained', label: 'Drained' },
                  { key: 'okay', label: 'Okay' },
                  { key: 'good', label: 'Good' },
                  { key: 'motivated', label: 'Motivated' },
                ] as { key: Mood; label: string }[]).map(({ key, label }) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => chooseMood(key)}
                    className="min-h-[220px] rounded-[2rem] border border-[#E8E2D7] bg-white px-6 py-8 shadow-[0_18px_45px_rgba(45,45,45,0.06)] transition-colors hover:border-[#7CB987]"
                  >
                    <div className="mb-5 flex justify-center">
                      <MoodFace mood={key} />
                    </div>
                    <p className="text-xl font-medium text-[#2D2D2D]">{label}</p>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {step === 'roles' && (
            <motion.div
              key="roles"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="w-full max-w-3xl mx-auto rounded-[2rem] border border-[#E8E2D7] bg-white p-8 shadow-[0_18px_45px_rgba(45,45,45,0.06)] md:p-10"
            >
              <div className="mb-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F4FBF5] text-2xl">
                    🌱
                  </div>
                </div>
                <h2 className="text-4xl font-semibold text-[#2D2D2D]">What role do you want to apply to?</h2>
                <p className="mt-3 text-lg text-[#7A7F86]">
                  {selectedMood
                    ? `Noted that you're feeling ${selectedMood}. Now tell Sathi what role you want to focus on.`
                    : 'Tell Sathi what role you want to focus on first.'}
                </p>
              </div>

              <div className="mb-6 rounded-[1.5rem] bg-[#FBF8F1] px-5 py-4 text-[#6F757B]">
                Add one role per line or separate them with commas.
              </div>

              <textarea
                value={rolesInput}
                onChange={(event) => setRolesInput(event.target.value)}
                placeholder="Frontend Developer&#10;Product Designer&#10;Data Analyst"
                className="w-full rounded-[1.75rem] border border-[#E5E7EB] bg-white px-5 py-5 text-[#2D2D2D] outline-none focus:border-[#7CB987] min-h-[170px]"
              />

              <div className="mt-8 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={finishSetup}
                  className="rounded-full bg-[#7CB987] px-12 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#5a9768]"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <FloatingSathi
        message={
          step === 'mood'
            ? "Hi, I'm Sathi 👋 How are you feeling about your job search today?"
            : "Hi, I'm Sathi 👋 What role do you want to apply to next?"
        }
      />
    </main>
  )
}
