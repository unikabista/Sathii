'use client'
import { motion } from 'framer-motion'

interface PlantProps {
  stage: number  // 0-4
  size?: number
}

export function Plant({ stage, size = 120 }: PlantProps) {
  const s = Math.min(4, Math.max(0, stage))
  const scale = size / 120

  return (
    <motion.div
      key={s}
      initial={{ scale: 0.85, opacity: 0.5 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      style={{ width: size, height: size * 1.1 }}
      className="relative inline-flex items-end justify-center"
    >
      <svg
        width={size}
        height={size * 1.1}
        viewBox="0 0 120 132"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pot — always visible */}
        <rect x="42" y="100" width="36" height="26" rx="5" fill="#A0724A" />
        <rect x="38" y="97" width="44" height="10" rx="4" fill="#8B6340" />

        {/* Stage 1+: stem */}
        {s >= 1 && (
          <motion.line
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
            x1="60" y1="97" x2="60" y2={s >= 3 ? 30 : s >= 2 ? 52 : 72}
            stroke="#7CB987"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* Stage 2+: leaves */}
        {s >= 2 && (
          <>
            <motion.ellipse
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              cx="44" cy="72" rx="14" ry="8"
              fill="#7CB987"
              transform="rotate(-35 44 72)"
            />
            <motion.ellipse
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              cx="76" cy="65" rx="14" ry="8"
              fill="#5a9768"
              transform="rotate(35 76 65)"
            />
          </>
        )}

        {/* Stage 3: bud */}
        {s === 3 && (
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}>
            <circle cx="60" cy="30" r="10" fill="#FBBF24" />
            <ellipse cx="60" cy="20" rx="6" ry="4" fill="#F4A261" />
            <ellipse cx="70" cy="26" rx="6" ry="4" fill="#F4A261" transform="rotate(60 70 26)" />
            <ellipse cx="50" cy="26" rx="6" ry="4" fill="#F4A261" transform="rotate(-60 50 26)" />
          </motion.g>
        )}

        {/* Stage 4: full sunflower */}
        {s >= 4 && (
          <motion.g initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 180 }}>
            {/* Extra leaves */}
            <ellipse cx="40" cy="78" rx="14" ry="7" fill="#7CB987" transform="rotate(-40 40 78)" />
            <ellipse cx="80" cy="70" rx="14" ry="7" fill="#5a9768" transform="rotate(40 80 70)" />
            {/* Petals */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
              <ellipse
                key={angle}
                cx={60 + 18 * Math.cos((angle * Math.PI) / 180)}
                cy={30 + 18 * Math.sin((angle * Math.PI) / 180)}
                rx="7"
                ry="4"
                fill="#FBBF24"
                transform={`rotate(${angle} ${60 + 18 * Math.cos((angle * Math.PI) / 180)} ${30 + 18 * Math.sin((angle * Math.PI) / 180)})`}
              />
            ))}
            {/* Center */}
            <circle cx="60" cy="30" r="12" fill="#E76F51" />
            <circle cx="60" cy="30" r="8" fill="#C1440E" />
            {/* Seed dots */}
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <circle
                key={angle}
                cx={60 + 4 * Math.cos((angle * Math.PI) / 180)}
                cy={30 + 4 * Math.sin((angle * Math.PI) / 180)}
                r="1.2"
                fill="#7C2D12"
              />
            ))}
          </motion.g>
        )}
      </svg>
    </motion.div>
  )
}
