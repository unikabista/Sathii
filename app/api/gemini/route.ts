import { NextRequest, NextResponse } from 'next/server'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

function getApiKey() {
  return process.env.GEMINI_API_KEY
}

async function generateText({
  contents,
  systemInstruction,
  maxOutputTokens,
}: {
  contents: Array<{ role?: 'user' | 'model'; parts: Array<{ text: string }> }>
  systemInstruction?: string
  maxOutputTokens: number
}) {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY')
  }

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      ...(systemInstruction
        ? {
            system_instruction: {
              parts: [{ text: systemInstruction }],
            },
          }
        : {}),
      contents,
      generationConfig: {
        maxOutputTokens,
      },
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.promptFeedback?.blockReason ||
      'Gemini request failed'
    throw new Error(message)
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw new Error('Gemini returned an empty response')
  }

  return text
}

type GeminiContent = {
  role?: 'user' | 'model'
  parts: Array<{ text: string }>
}

function extractJsonObject(text: string) {
  const json = text.match(/\{[\s\S]*\}/)?.[0]
  if (!json) return null

  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function toGeminiMessages(messages: ChatMessage[]): GeminiContent[] {
  return messages.map((message) => ({
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: message.content }],
  }))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.type === 'extract') {
      const text = await generateText({
        maxOutputTokens: 1024,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Extract key information from this resume. Return ONLY valid JSON with this exact shape:
{"name":"string","skills":["skill1","skill2"],"experience":"brief summary","titles":["job title"]}

Resume:
${String(body.text ?? '').slice(0, 4000)}`,
              },
            ],
          },
        ],
      })

      return NextResponse.json(
        extractJsonObject(text) ?? { skills: [], experience: '', titles: [] }
      )
    }

    if (body.type === 'resume') {
      const resume = await generateText({
        maxOutputTokens: 2048,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are a professional resume writer. Tailor the following resume for the job described below.
Keep it concise and ATS-friendly. Emphasize relevant skills and experience.

JOB TITLE: ${String(body.jobTitle ?? '')}
JOB DESCRIPTION: ${String(body.jobDesc ?? 'Not provided').slice(0, 1000)}

ORIGINAL RESUME:
${String(body.resumeText ?? 'No resume provided').slice(0, 3000)}

Return the tailored resume in clean plain text format.`,
              },
            ],
          },
        ],
      })

      return NextResponse.json({ resume })
    }

    if (body.type === 'chat') {
      const message = await generateText({
        maxOutputTokens: 512,
        systemInstruction:
          'You are Sathi, a warm and encouraging job search companion. Keep responses brief, supportive, and practical. The user is job searching, so offer concrete next steps when useful.',
        contents: toGeminiMessages(Array.isArray(body.messages) ? body.messages : []),
      })

      return NextResponse.json({ message })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected Gemini route failure'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
