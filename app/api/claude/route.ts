import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 })
    }

    if (body.type === 'resume') {
      const { resumeText, jobTitle, jobDescription, company } = body

      const prompt = `You are an expert resume writer. The candidate is applying for ${jobTitle} at ${company}.

Job Description: ${String(jobDescription ?? '').slice(0, 1500)}

Their current resume: ${String(resumeText ?? 'No resume provided').slice(0, 3000)}

Rewrite their resume to maximize ATS match for this specific role.
- Keep only honest, existing experience
- Start each bullet with strong action verbs
- Quantify achievements where possible
- Highlight skills that match job requirements
- Keep same format but optimize content

Return the complete rewritten resume as plain text.`

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error?.message ?? 'Claude API error')
      }

      const resume = data.content?.[0]?.text ?? ''
      return NextResponse.json({ resume })
    }

    // Fall through to gemini for extract/chat
    const { POST: geminiPost } = await import('../gemini/route')
    return geminiPost(req)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Claude route error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
