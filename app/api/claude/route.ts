import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
  }

  if (body.type === 'extract') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Extract key information from this resume. Return ONLY valid JSON with this exact shape:
{"name":"string","skills":["skill1","skill2"],"experience":"brief summary","titles":["job title"]}

Resume:
${body.text.slice(0, 4000)}`,
        }],
      }),
    })
    const data = await response.json()
    try {
      const text = data.content[0].text
      const json = text.match(/\{[\s\S]*\}/)?.[0]
      return NextResponse.json(json ? JSON.parse(json) : { skills: [], experience: '' })
    } catch {
      return NextResponse.json({ skills: [], experience: '' })
    }
  }

  if (body.type === 'resume') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `You are a professional resume writer. Tailor the following resume for the job described below.
Keep it concise and ATS-friendly. Emphasize relevant skills and experience.

JOB TITLE: ${body.jobTitle}
JOB DESCRIPTION: ${body.jobDesc?.slice(0, 1000) ?? 'Not provided'}

ORIGINAL RESUME:
${body.resumeText?.slice(0, 3000) ?? 'No resume provided'}

Return the tailored resume in clean plain text format.`,
        }],
      }),
    })
    const data = await response.json()
    return NextResponse.json({ resume: data.content?.[0]?.text ?? 'Could not generate resume.' })
  }

  if (body.type === 'chat') {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: 'You are Sathi, a warm and encouraging job search companion. Keep responses brief (2-3 sentences), supportive, and practical. The user is job searching.',
        messages: body.messages,
      }),
    })
    const data = await response.json()
    return NextResponse.json({ message: data.content?.[0]?.text ?? "I'm here for you!" })
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
