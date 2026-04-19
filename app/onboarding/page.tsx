'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

type Step = 'intro' | 'resume' | 'who' | 'vibe' | 'goal'
type UserType = 'Student' | 'Recent Grad' | 'Career Changer' | 'Experienced Pro' | ''
type Mood = 'drained' | 'okay' | 'good' | 'motivated' | ''

const MOOD_GOALS: Record<string, number> = {
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

function MoodFace({ mood }: { mood: Exclude<Mood, ''> }) {
  const stroke = '#3A4144'
  const mouth = {
    drained: 'M46 62 Q56 54 66 62',
    okay: 'M47 60 L65 60',
    good: 'M45 57 Q56 66 67 57',
    motivated: 'M43 56 Q56 70 69 56',
  }[mood]

  const eyebrow = mood === 'drained'

  return (
    <svg
      viewBox="0 0 112 112"
      aria-hidden="true"
      className="h-24 w-24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="56" cy="56" r="42" stroke={stroke} strokeWidth="4" />
      {eyebrow && <path d="M42 42 L49 39" stroke={stroke} strokeWidth="4" strokeLinecap="round" />}
      {eyebrow && <path d="M63 39 L70 42" stroke={stroke} strokeWidth="4" strokeLinecap="round" />}
      <circle cx="47" cy="48" r="4.5" fill={stroke} />
      <circle cx="65" cy="48" r="4.5" fill={stroke} />
      <path d={mouth} stroke={stroke} strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('intro')
  const [userType, setUserType] = useState<UserType>('')
  const [mood, setMood] = useState<Mood>('')
  const [goal, setGoal] = useState(3)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const steps: Step[] = ['intro', 'resume', 'who', 'vibe', 'goal']
  const stepIndex = steps.indexOf(step)
  const progress = ((stepIndex + 1) / steps.length) * 100

  function next() {
    const idx = steps.indexOf(step)
    if (idx < steps.length - 1) setStep(steps[idx + 1])
  }

  async function handleFile(file: File) {
    setResumeFile(file)
    setIsProcessing(true)
    const text = await file.text()
    setResumeText(text)

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'extract', text }),
      })
      const profile = await res.json()
      if (!res.ok) throw new Error(profile.error || 'Resume extraction failed')
      const existing = JSON.parse(localStorage.getItem('sathi_profile') || '{}')
      localStorage.setItem('sathi_profile', JSON.stringify({ ...existing, ...profile, resumeText: text }))
    } catch {
      localStorage.setItem('sathi_profile', JSON.stringify({ resumeText: text, skills: [], experience: '' }))
    }
    setIsProcessing(false)
    next()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleGoalFinish() {
    const existing = JSON.parse(localStorage.getItem('sathi_profile') || '{}')
    localStorage.setItem('sathi_profile', JSON.stringify({ ...existing, type: userType }))
    localStorage.setItem('sathi_today', JSON.stringify({
      mood,
      goal,
      applied: [],
      date: new Date().toDateString(),
    }))
    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen bg-[#FFFBF0] flex flex-col items-center justify-center px-6">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-[#E8F5E9]">
        <motion.div
          className="h-full bg-[#7CB987] rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div
              key="intro"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <div className="text-6xl mb-6">🌱</div>
              <h1 className="text-4xl font-bold text-[#2D2D2D] mb-4">
                Let&apos;s get to know each other
              </h1>
              <p className="text-[#6B7280] text-lg mb-10 leading-relaxed">
                We&apos;ll ask you a few quick questions so Sathi can find jobs that actually fit — and keep you sane while applying.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={next}
                className="bg-[#7CB987] text-white px-14 py-4 rounded-full text-lg font-semibold hover:bg-[#5a9768] transition-all"
              >
                Continue
              </motion.button>
            </motion.div>
          )}

          {step === 'resume' && (
            <motion.div
              key="resume"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2">Upload your resume</h2>
              <p className="text-[#6B7280] mb-8">We&apos;ll use it to find jobs that match your skills.</p>

              {isProcessing ? (
                <div className="border-2 border-dashed border-[#7CB987] rounded-2xl p-16 bg-[#E8F5E9] flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-10 h-10 border-3 border-[#7CB987] border-t-transparent rounded-full"
                    style={{ borderWidth: 3 }}
                  />
                  <p className="text-[#7CB987] font-medium">Reading your resume...</p>
                </div>
              ) : resumeFile ? (
                <div className="border-2 border-[#7CB987] rounded-2xl p-8 bg-[#E8F5E9] flex flex-col items-center gap-3">
                  <div className="text-4xl">✅</div>
                  <p className="font-semibold text-[#2D2D2D]">{resumeFile.name}</p>
                  <p className="text-sm text-[#6B7280]">Resume uploaded successfully</p>
                </div>
              ) : (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-16 cursor-pointer transition-all flex flex-col items-center gap-4 ${
                    isDragging
                      ? 'border-[#7CB987] bg-[#E8F5E9] scale-[1.02]'
                      : 'border-[#B6D9BC] bg-white hover:border-[#7CB987] hover:bg-[#F0FAF1]'
                  }`}
                >
                  <div className="text-5xl">📄</div>
                  <div>
                    <p className="font-semibold text-[#2D2D2D] text-lg">Drop your resume here</p>
                    <p className="text-[#6B7280] text-sm mt-1">or click to browse · PDF, DOCX, TXT</p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />

              <button
                onClick={next}
                className="mt-6 text-[#6B7280] underline text-sm hover:text-[#7CB987] transition-colors"
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {step === 'who' && (
            <motion.div
              key="who"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
            >
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">Who are you?</h2>
              <p className="text-[#6B7280] text-center mb-8">This helps us tailor your job matches.</p>
              <div className="grid grid-cols-2 gap-4">
                {(['Student', 'Recent Grad', 'Career Changer', 'Experienced Pro'] as UserType[]).map((type) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setUserType(type)
                      setTimeout(next, 200)
                    }}
                    className={`p-6 rounded-2xl border-2 text-left transition-all ${
                      userType === type
                        ? 'border-[#7CB987] bg-[#E8F5E9] text-[#2D2D2D]'
                        : 'border-[#E5E7EB] bg-white text-[#2D2D2D] hover:border-[#7CB987]'
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {type === 'Student' ? '🎓' : type === 'Recent Grad' ? '🌟' : type === 'Career Changer' ? '🔄' : '💼'}
                    </div>
                    <p className="font-semibold text-lg">{type}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'vibe' && (
            <motion.div
              key="vibe"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2">How are you feeling today?</h2>
              <p className="text-[#6B7280] mb-10">No judgment — we&apos;ll set a goal that fits your energy.</p>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { key: 'drained', label: 'Drained' },
                  { key: 'okay', label: 'Okay' },
                  { key: 'good', label: 'Good' },
                  { key: 'motivated', label: 'Motivated' },
                ] as { key: Exclude<Mood, ''>; label: string }[]).map(({ key, label }) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setMood(key)
                      setGoal(MOOD_GOALS[key])
                      setTimeout(next, 200)
                    }}
                    className={`min-h-[190px] rounded-[2rem] border-[3px] flex flex-col items-center justify-center gap-4 transition-all ${
                      mood === key
                        ? 'border-[#7CB987] bg-[#F4FBF5]'
                        : 'border-[#E5E7EB] bg-white hover:border-[#7CB987]'
                    }`}
                  >
                    <MoodFace mood={key} />
                    <span className="text-xl font-medium text-[#2D2D2D]">{label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'goal' && (
            <motion.div
              key="goal"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <div className="text-5xl mb-4">🎯</div>
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2">
                How many jobs can you apply to today?
              </h2>
              <p className="text-[#6B7280] mb-2">
                Based on your energy, we suggest{' '}
                <span className="text-[#7CB987] font-semibold">{MOOD_GOALS[mood] ?? 3}</span> — but you choose.
              </p>
              <div className="bg-white rounded-2xl p-8 my-8 shadow-sm border border-[#E8F5E9]">
                <div className="text-6xl font-bold text-[#7CB987] mb-6">{goal}</div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={goal}
                  onChange={(e) => setGoal(Number(e.target.value))}
                  className="w-full h-2 bg-[#E8F5E9] rounded-full appearance-none cursor-pointer accent-[#7CB987]"
                />
                <div className="flex justify-between text-sm text-[#9CA3AF] mt-2">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>
              <p className="text-sm text-[#6B7280] mb-8 italic">
                {goal <= 2 ? "That's totally enough. Every application counts." :
                 goal <= 4 ? "Solid goal. You've got this." :
                 goal <= 7 ? "Ambitious! We'll find the best matches." :
                 "You're on fire! We'll have plenty of options."}
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGoalFinish}
                className="bg-[#7CB987] text-white px-14 py-4 rounded-full text-lg font-semibold hover:bg-[#5a9768] transition-all"
              >
                Find my jobs →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step dots */}
      <div className="fixed bottom-8 flex gap-2">
        {steps.map((s, i) => (
          <div
            key={s}
            className={`rounded-full transition-all ${
              i === stepIndex ? 'w-6 h-2 bg-[#7CB987]' : i < stepIndex ? 'w-2 h-2 bg-[#7CB987] opacity-60' : 'w-2 h-2 bg-[#D1D5DB]'
            }`}
          />
        ))}
      </div>
    </main>
  )
}
