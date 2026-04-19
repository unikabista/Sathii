'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProfile, SathiProfile } from '@/lib/store'

export default function SettingsPage() {
  const [profile, setProfile] = useState<SathiProfile>({})

  useEffect(() => {
    setProfile(getProfile())
  }, [])

  const infoRows = [
    { label: 'Email', value: profile.email || 'Not set yet' },
    { label: 'Certifications', value: profile.certifications?.join(', ') || 'None added' },
    { label: 'Extra skills', value: profile.extraSkills?.join(', ') || 'None added' },
    { label: 'Extra projects', value: profile.extraProjects?.join(', ') || 'None added' },
    { label: 'Extra experience', value: profile.extraExperience || 'None added' },
  ]

  return (
    <main className="min-h-screen bg-[#FBF8F1] px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#7CB987]">Settings</p>
            <h1 className="text-4xl font-semibold text-[#2D2D2D]">Your profile</h1>
          </div>
          <Link
            href="/setup"
            className="rounded-full border border-[#DAD3C6] bg-white px-5 py-2 text-sm font-medium text-[#2D2D2D] shadow-sm transition-colors hover:border-[#7CB987]"
          >
            Back
          </Link>
        </div>

        <div className="rounded-[2rem] border border-[#E8E2D7] bg-white p-8 shadow-sm">
          <div className="space-y-5">
            {infoRows.map((row) => (
              <div key={row.label} className="rounded-2xl bg-[#F8F4EC] px-5 py-4">
                <p className="text-sm font-medium uppercase tracking-[0.15em] text-[#8D9489]">
                  {row.label}
                </p>
                <p className="mt-2 text-base leading-relaxed text-[#2D2D2D]">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
