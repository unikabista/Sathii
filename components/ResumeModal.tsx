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
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'resume',
          resumeText: resumeText || 'No resume provided — generate a general tailored resume template.',
          jobTitle: job.title,
          jobDescription: job.description,
          company: job.company,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Resume generation failed')
      setResult(data.resume ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate resume.')
    }
    setLoading(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resume-${job.title.replace(/\s+/g, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl flex flex-col"
          style={{ width: result ? '90vw' : undefined, maxWidth: result ? '1100px' : '520px', maxHeight: '88vh' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-7 py-5 border-b border-[#E8F5E9]">
            <div>
              <h2 className="text-xl font-bold text-[#2D2D2D]">Customize Resume</h2>
              <p className="text-sm text-[#6B7280] mt-0.5">
                Tailoring for <span className="text-[#7CB987] font-medium">{job.title}</span> at {job.company}
              </p>
            </div>
            <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#2D2D2D] text-2xl leading-none">×</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Idle state */}
            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                <div className="text-5xl mb-4">✨</div>
                <p className="text-[#6B7280] mb-6 max-w-sm text-sm">
                  Claude will rewrite your resume to maximize ATS match for this specific role — keeping only honest experience, with stronger action verbs and quantified achievements.
                </p>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={generate}
                  className="bg-[#7CB987] text-white px-10 py-3 rounded-full font-semibold hover:bg-[#5a9768] transition-colors"
                >
                  Generate with Claude
                </motion.button>
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="w-12 h-12 rounded-full"
                  style={{ border: '3px solid #E8F5E9', borderTopColor: '#7CB987' }}
                />
                <p className="text-[#6B7280]">Claude is tailoring your resume...</p>
              </div>
            )}

            {/* Two-column result */}
            {result && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-hidden grid grid-cols-2 gap-0">
                  {/* Original */}
                  <div className="flex flex-col border-r border-[#E8F5E9]">
                    <div className="px-6 py-3 bg-[#F9FAFB] border-b border-[#E8F5E9]">
                      <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Original</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-[#6B7280] whitespace-pre-wrap leading-relaxed">
                      {resumeText || '(No resume on file)'}
                    </div>
                  </div>
                  {/* Customized */}
                  <div className="flex flex-col">
                    <div className="px-6 py-3 bg-[#E8F5E9] border-b border-[#E8F5E9]">
                      <p className="text-xs font-semibold text-[#5a9768] uppercase tracking-wide">✨ Customized by Claude</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 font-mono text-xs text-[#2D2D2D] whitespace-pre-wrap leading-relaxed">
                      {result}
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="px-7 py-4 border-t border-[#E8F5E9] flex gap-3">
                  <button
                    onClick={copy}
                    className="flex-1 bg-[#7CB987] text-white py-2.5 rounded-full font-medium hover:bg-[#5a9768] transition-colors text-sm"
                  >
                    {copied ? '✓ Copied!' : 'Copy Customized'}
                  </button>
                  <button
                    onClick={download}
                    className="flex-1 border border-[#7CB987] text-[#7CB987] py-2.5 rounded-full font-medium hover:bg-[#E8F5E9] transition-colors text-sm"
                  >
                    Download .txt
                  </button>
                  <button
                    onClick={generate}
                    className="border border-[#E8F5E9] text-[#6B7280] py-2.5 px-5 rounded-full font-medium hover:bg-[#F9FAFB] transition-colors text-sm"
                  >
                    Regenerate
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
