'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Job } from '@/lib/jobs'

interface ResumeModalProps {
  job: Job
  resumeText: string
  onClose: () => void
}

export function ResumeModal({ job, resumeText, onClose }: ResumeModalProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'resume',
          resumeText: resumeText || 'No resume provided — generate a general tailored resume template.',
          jobTitle: job.title,
          jobDesc: job.description,
        }),
      })
      const data = await res.json()
      setResult(data.resume ?? 'Could not generate resume. Please try again.')
    } catch {
      setResult('Failed to connect to AI. Please check your API key.')
    }
    setLoading(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2D2D]">Customize Resume</h2>
              <p className="text-[#6B7280] mt-1">
                Tailoring for <span className="text-[#7CB987] font-medium">{job.title}</span> at {job.company}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#6B7280] text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="text-5xl mb-4">✨</div>
              <p className="text-[#6B7280] mb-6 max-w-sm">
                Claude will tailor your resume to highlight the skills and experience most relevant to this role.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={generate}
                className="bg-[#7CB987] text-white px-10 py-3 rounded-full font-semibold hover:bg-[#5a9768] transition-colors"
              >
                Generate Tailored Resume
              </motion.button>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                className="w-12 h-12 rounded-full"
                style={{ border: '3px solid #E8F5E9', borderTopColor: '#7CB987' }}
              />
              <p className="text-[#6B7280]">Claude is tailoring your resume...</p>
            </div>
          )}

          {result && (
            <>
              <div className="flex-1 overflow-y-auto bg-[#F9FAFB] rounded-xl p-5 font-mono text-sm text-[#2D2D2D] whitespace-pre-wrap border border-[#E5E7EB]">
                {result}
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={copy}
                  className="flex-1 bg-[#7CB987] text-white py-3 rounded-full font-medium hover:bg-[#5a9768] transition-colors"
                >
                  {copied ? '✓ Copied!' : 'Copy Resume'}
                </button>
                <button
                  onClick={generate}
                  className="flex-1 border border-[#7CB987] text-[#7CB987] py-3 rounded-full font-medium hover:bg-[#E8F5E9] transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
