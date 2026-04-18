'use client'
import { useEffect } from 'react'

export function ConfettiBlast() {
  useEffect(() => {
    let confetti: ((opts: Record<string, unknown>) => void) | undefined

    import('canvas-confetti').then((mod) => {
      confetti = mod.default as (opts: Record<string, unknown>) => void

      // First burst
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7CB987', '#5a9768', '#F4A261', '#FBBF24', '#E76F51', '#FFFBF0'],
      })

      // Side bursts
      setTimeout(() => {
        confetti?.({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#7CB987', '#FBBF24', '#F4A261'] })
        confetti?.({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#7CB987', '#FBBF24', '#F4A261'] })
      }, 250)

      setTimeout(() => {
        confetti?.({ particleCount: 80, spread: 100, origin: { y: 0.4 }, colors: ['#7CB987', '#E8F5E9', '#F4A261'] })
      }, 600)
    })
  }, [])

  return null
}
