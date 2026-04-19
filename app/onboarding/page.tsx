'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { SathiProfile } from '@/lib/store'

type Step = 'intro' | 'resume' | 'account' | 'certifications'

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
}

function splitList(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

export default function Onboarding() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>('intro')
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [resumeMimeType, setResumeMimeType] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [profile, setProfile] = useState<SathiProfile>({})
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [certificationsInput, setCertificationsInput] = useState('')
  const [extraSkillsInput, setExtraSkillsInput] = useState('')
  const [extraProjectsInput, setExtraProjectsInput] = useState('')
  const [extraExperienceInput, setExtraExperienceInput] = useState('')
  const [error, setError] = useState('')

  const steps: Step[] = ['intro', 'resume', 'account', 'certifications']
  const stepIndex = steps.indexOf(step)
  const progress = ((stepIndex + 1) / steps.length) * 100

  function next() {
    const index = steps.indexOf(step)
    if (index < steps.length - 1) setStep(steps[index + 1])
  }

  function persistProfile(overrides: Partial<SathiProfile> = {}) {
    const existing = JSON.parse(localStorage.getItem('sathi_profile') || '{}')
    const merged = {
      ...existing,
      ...profile,
      ...overrides,
      email: email.trim(),
      password,
      certifications: splitList(certificationsInput),
      extraSkills: splitList(extraSkillsInput),
      extraProjects: splitList(extraProjectsInput),
      extraExperience: extraExperienceInput.trim(),
      resumeText,
      resumeMimeType,
    }
    localStorage.setItem('sathi_profile', JSON.stringify(merged))
    setProfile(merged)
    return merged
  }

  async function handleFile(file: File) {
    setResumeFile(file)
    setResumeMimeType(file.type || 'application/octet-stream')
    setIsProcessing(true)
    setError('')

    const rawText = file.type === 'text/plain' ? await file.text() : ''
    const fileData = arrayBufferToBase64(await file.arrayBuffer())
    setResumeText(rawText)

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'extract-email',
          text: rawText,
          fileData,
          mimeType: file.type || 'application/octet-stream',
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not extract email')

      setEmail(data.email ?? '')
      setProfile({
        email: data.email ?? '',
        parserDebug: data.parserDebug,
      })
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : 'Could not extract email'
      setError(message)
      setProfile({
        parserDebug: {
          parser: 'email-extract-failed',
          cvParseError: message,
        },
      })
    }

    setIsProcessing(false)
    next()
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function continueToSetup() {
    persistProfile()
    router.push('/setup')
  }

  return (
    <main className="min-h-screen bg-[#FFFBF0] flex flex-col items-center justify-center px-6">
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
                Let&apos;s get you set up
              </h1>
              <p className="text-[#6B7280] text-lg mb-10 leading-relaxed">
                Start with your resume, confirm your email, create a password, and add any extra details not already listed in the resume.
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
              <p className="text-[#6B7280] mb-8">
                We&apos;ll try to pull your email from it and keep the resume on file for future applications.
              </p>

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
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
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
                onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])}
              />

              {!resumeFile && (
                <button
                  onClick={next}
                  className="mt-6 text-[#6B7280] underline text-sm hover:text-[#7CB987] transition-colors"
                >
                  Skip for now
                </button>
              )}
            </motion.div>
          )}

          {step === 'account' && (
            <motion.div
              key="account"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
            >
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">Create your account</h2>
              <p className="text-[#6B7280] text-center mb-8">
                We&apos;ve tried to pull your email from the resume. You can edit it before continuing.
              </p>
              <div className="mb-4 rounded-2xl border border-[#E8F5E9] bg-white px-4 py-3 text-left text-sm text-[#6B7280]">
                Email extraction works in two passes: first we ask Gemini to read the uploaded resume and return the primary email; if that fails and we already have plain text, we fall back to a regex match on the resume text.
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-[#F2D8BF] bg-[#FFF7EF] px-4 py-3 text-left text-sm text-[#8A4B14]">
                  Couldn&apos;t extract the email automatically. {error}
                </div>
              )}

              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 text-[#2D2D2D] outline-none focus:border-[#7CB987]"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Set a password"
                  className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 text-[#2D2D2D] outline-none focus:border-[#7CB987]"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  persistProfile()
                  next()
                }}
                disabled={!email.trim() || !password.trim()}
                className="mt-8 w-full bg-[#7CB987] text-white px-14 py-4 rounded-full text-lg font-semibold hover:bg-[#5a9768] transition-all disabled:opacity-50"
              >
                Continue
              </motion.button>
            </motion.div>
          )}

          {step === 'certifications' && (
            <motion.div
              key="certifications"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
            >
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">Anything missing from the resume?</h2>
              <p className="text-[#6B7280] text-center mb-8">
                Add extra certifications, projects, experience, or skills not already mentioned in the resume.
              </p>

              <div className="space-y-4">
                <textarea
                  value={certificationsInput}
                  onChange={(event) => setCertificationsInput(event.target.value)}
                  placeholder="Extra certifications"
                  className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 text-[#2D2D2D] outline-none focus:border-[#7CB987] min-h-[96px]"
                />
                <textarea
                  value={extraSkillsInput}
                  onChange={(event) => setExtraSkillsInput(event.target.value)}
                  placeholder="Extra skills not listed in the resume"
                  className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 text-[#2D2D2D] outline-none focus:border-[#7CB987] min-h-[96px]"
                />
                <textarea
                  value={extraProjectsInput}
                  onChange={(event) => setExtraProjectsInput(event.target.value)}
                  placeholder="Extra projects"
                  className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 text-[#2D2D2D] outline-none focus:border-[#7CB987] min-h-[96px]"
                />
                <textarea
                  value={extraExperienceInput}
                  onChange={(event) => setExtraExperienceInput(event.target.value)}
                  placeholder="Extra experience not mentioned in the resume"
                  className="w-full rounded-2xl border border-[#E5E7EB] bg-white px-5 py-4 text-[#2D2D2D] outline-none focus:border-[#7CB987] min-h-[120px]"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={continueToSetup}
                className="mt-8 w-full bg-[#7CB987] text-white px-14 py-4 rounded-full text-lg font-semibold hover:bg-[#5a9768] transition-all"
              >
                Done
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-8 flex gap-2">
        {steps.map((currentStep, index) => (
          <div
            key={currentStep}
            className={`rounded-full transition-all ${
              index === stepIndex
                ? 'w-6 h-2 bg-[#7CB987]'
                : index < stepIndex
                  ? 'w-2 h-2 bg-[#7CB987] opacity-60'
                  : 'w-2 h-2 bg-[#D1D5DB]'
            }`}
          />
        ))}
      </div>
    </main>
  )
}
