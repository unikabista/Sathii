'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function SathiChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi, I'm Sathi 👋 How are you feeling about your job search today?" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim()) return
    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', messages: newMessages }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Chat request failed')
      setMessages([...newMessages, { role: 'assistant', content: data.message }])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "I'm here for you! (Couldn't connect right now)"
      setError(message)
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `I couldn't respond properly just now. ${message}` },
      ])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        aria-label="Open Sathi chat"
        className="fixed bottom-6 right-6 h-16 w-16 overflow-hidden rounded-full border-2 border-white bg-[#7CB987] shadow-lg z-40"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
        >
          <source src="/chatbot-icon.mp4" type="video/mp4" />
        </video>
        <span className="sr-only">Sathi chat</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-[#E8F5E9] overflow-hidden z-50 flex flex-col"
            style={{ height: 420 }}
          >
            <div className="bg-[#7CB987] px-4 py-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-white">Sathi</p>
                <p className="text-white/80 text-xs">Your job search companion</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {error && (
                <div className="rounded-2xl border border-[#F2C9A6] bg-[#FFF5EB] px-4 py-3 text-sm text-[#8A4B14]">
                  AI unavailable: {error}
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-[#7CB987] text-white rounded-br-sm'
                      : 'bg-[#F3F4F6] text-[#2D2D2D] rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#F3F4F6] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 0.2, 0.4].map((d) => (
                        <motion.div
                          key={d}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: d }}
                          className="w-2 h-2 bg-[#9CA3AF] rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-[#E8F5E9] flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask Sathi anything..."
                className="flex-1 bg-[#F9FAFB] rounded-full px-4 py-2 text-sm outline-none border border-[#E5E7EB] focus:border-[#7CB987]"
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="bg-[#7CB987] text-white w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-50"
              >
                →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
