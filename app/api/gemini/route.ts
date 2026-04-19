import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const CVPARSE_API_BASE_URL = 'https://api.cvparse.io/api/v1'

function getApiKey() {
  return process.env.GEMINI_API_KEY
}

function getCvParseApiKey() {
  return process.env.CVPARSE_API_KEY
}

async function generateText({
  contents,
  systemInstruction,
  maxOutputTokens,
}: {
  contents: GeminiContent[]
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
  parts: Array<
    | { text: string }
    | {
        inline_data: {
          mime_type: string
          data: string
        }
      }
  >
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

function getErrorMessage(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value

  if (Array.isArray(value)) {
    const parts: string[] = value
      .map((item): string => getErrorMessage(item, ''))
      .filter(Boolean)
    if (parts.length) return parts.join(' | ')
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    const preferred: string =
      getErrorMessage(record.detail, '') ||
      getErrorMessage(record.message, '') ||
      getErrorMessage(record.error, '') ||
      getErrorMessage(record.msg, '')

    if (preferred) return preferred

    try {
      return JSON.stringify(value)
    } catch {
      return fallback
    }
  }

  return fallback
}

function extractEmailFromText(text: string): string {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0] ?? ''
}

async function extractResumeText(body: Record<string, unknown>) {
  const plainText = String(body.text ?? '').trim()
  const mimeType = String(body.mimeType ?? '')
  const fileData = typeof body.fileData === 'string' ? body.fileData : ''

  if (!fileData) return plainText

  const buffer = Buffer.from(fileData, 'base64')

  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ data: buffer })
    const parsed = await parser.getText()
    await parser.destroy()
    return parsed.text.trim()
  }

  if (
    mimeType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const parsed = await mammoth.extractRawText({ buffer })
    return parsed.value.trim()
  }

  if (mimeType === 'text/plain') {
    return buffer.toString('utf8').trim()
  }

  return plainText
}

function normalizeStringList(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  return values
    .map((value) => {
      if (typeof value === 'string') return value.trim()
      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>
        return String(
          record.name ??
            record.title ??
            record.skill ??
            record.label ??
            record.description ??
            ''
        ).trim()
      }
      return ''
    })
    .filter(Boolean)
}

function normalizeTitles(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  return values
    .map((value) => {
      if (!value || typeof value !== 'object') return ''
      const record = value as Record<string, unknown>
      return String(record.title ?? record.role ?? record.position ?? '').trim()
    })
    .filter(Boolean)
}

function normalizeExperienceSummary(values: unknown) {
  if (!Array.isArray(values)) return ''

  return values
    .slice(0, 4)
    .map((value) => {
      if (!value || typeof value !== 'object') return ''
      const record = value as Record<string, unknown>
      const title = String(record.title ?? record.role ?? '').trim()
      const company = String(record.company ?? record.organization ?? '').trim()
      const summary = String(record.summary ?? record.description ?? '').trim()
      return [title, company].filter(Boolean).join(' at ') + (summary ? ` — ${summary}` : '')
    })
    .filter(Boolean)
    .join(' | ')
}

function mapCvParseResult(data: Record<string, unknown>, extractedResumeText: string) {
  const profile =
    data.profile && typeof data.profile === 'object'
      ? (data.profile as Record<string, unknown>)
      : data
  const basics =
    profile.basics && typeof profile.basics === 'object'
      ? (profile.basics as Record<string, unknown>)
      : {}
  const experiences =
    (profile.professional_experiences as unknown[]) ??
    (profile.work_experience as unknown[]) ??
    (profile.experience as unknown[]) ??
    (profile.employment_history as unknown[]) ??
    []
  const certifications =
    (profile.trainings_and_certifications as unknown[]) ??
    (profile.certifications as unknown[]) ??
    []
  const projects = normalizeStringList(profile.projects)
  const cvText =
    typeof data.cv_text === 'string' && data.cv_text.trim()
      ? data.cv_text.trim()
      : extractedResumeText

  return {
    name: String(
      data.full_name ??
        profile.full_name ??
        basics.full_name ??
        [basics.first_name, basics.last_name].filter(Boolean).join(' ') ??
        data.name ??
        profile.name ??
        ''
    ).trim(),
    skills: normalizeStringList(basics.skills ?? profile.skills ?? data.skills),
    experience:
      String(basics.summary ?? profile.professional_summary ?? profile.summary ?? data.summary ?? '')
        .trim() ||
      normalizeExperienceSummary(experiences),
    titles: normalizeTitles(experiences),
    projects,
    certifications: normalizeStringList(certifications),
    resumeText: cvText,
  }
}

async function parseResumeWithCvParse({
  fileData,
  mimeType,
  fileName,
  extractedResumeText,
}: {
  fileData: string
  mimeType: string
  fileName: string
  extractedResumeText: string
}) {
  const apiKey = getCvParseApiKey()
  if (!apiKey) return null

  const formData = new FormData()
  formData.append(
    'file',
    new Blob([Buffer.from(fileData, 'base64')], { type: mimeType || 'application/octet-stream' }),
    fileName || 'resume'
  )

  const parseResponse = await fetch(`${CVPARSE_API_BASE_URL}/parse`, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
    },
    body: formData,
  })

  const parseData = await parseResponse.json()
  if (!parseResponse.ok) {
    throw new Error(getErrorMessage(parseData, 'CV Parse.Ai upload failed'))
  }

  const jobId = parseData?.job_id
  if (!jobId) {
    throw new Error('CV Parse.Ai did not return a job ID')
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const statusResponse = await fetch(`${CVPARSE_API_BASE_URL}/jobs/${jobId}`, {
      headers: {
        'x-api-key': apiKey,
      },
      cache: 'no-store',
    })
    const statusData = await statusResponse.json()

    if (!statusResponse.ok) {
      throw new Error(getErrorMessage(statusData, 'CV Parse.Ai status check failed'))
    }

    if (statusData?.status === 'completed') {
      const resultResponse = await fetch(`${CVPARSE_API_BASE_URL}/jobs/${jobId}/result`, {
        headers: {
          'x-api-key': apiKey,
        },
        cache: 'no-store',
      })
      const resultData = await resultResponse.json()

      if (!resultResponse.ok) {
        throw new Error(getErrorMessage(resultData, 'CV Parse.Ai result fetch failed'))
      }

      const parsed = mapCvParseResult(
        (resultData?.data as Record<string, unknown>) ?? {},
        extractedResumeText
      )
      if (!parsed.skills.length && !parsed.titles.length && !parsed.experience) {
        throw new Error('CV Parse.Ai returned an empty profile')
      }
      return {
        ...parsed,
        parserDebug: {
          parser: 'cvparse',
          extractedTextLength: extractedResumeText.length,
          cvParseStatus: 'completed',
          usedFallback: false,
        },
      }
    }

    if (statusData?.status === 'failed') {
      throw new Error(getErrorMessage(statusData?.error, 'CV Parse.Ai failed to parse the resume'))
    }

    await new Promise((resolve) => setTimeout(resolve, 1200))
  }

  throw new Error('CV Parse.Ai parse timed out')
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
      if (body.fileData && body.mimeType) {
        try {
          const cvParseProfile = await parseResumeWithCvParse({
            fileData: String(body.fileData),
            mimeType: String(body.mimeType),
            fileName: String(body.fileName ?? 'resume'),
            extractedResumeText: '',
          })

          if (cvParseProfile) {
            console.log('resume-extract result', {
              parser: cvParseProfile.parserDebug?.parser,
              skills: cvParseProfile.skills?.length ?? 0,
              titles: cvParseProfile.titles?.length ?? 0,
              textLength: cvParseProfile.resumeText?.length ?? 0,
            })
            return NextResponse.json(cvParseProfile)
          }
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown CV Parse.Ai error'

          const mimeType = String(body.mimeType ?? '')
          const isDocumentUpload =
            mimeType === 'application/pdf' ||
            mimeType ===
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

          if (isDocumentUpload) {
            const payload = {
              error: message,
              skills: [],
              experience: '',
              titles: [],
              projects: [],
              certifications: [],
              resumeText: '',
              parserDebug: {
                parser: 'cvparse-failed',
                extractedTextLength: 0,
                cvParseStatus: 'failed',
                cvParseError: message,
                usedFallback: false,
              },
            }
            console.log('resume-extract result', {
              parser: payload.parserDebug.parser,
              skills: 0,
              titles: 0,
              textLength: 0,
              error: message,
            })
            return NextResponse.json(payload)
          }

          const extractedResumeText = await extractResumeText(body)

          if (!extractedResumeText) {
            throw new Error(message)
          }

          const prompt = `Extract key information from this resume. Return ONLY valid JSON with this exact shape:
{"name":"string","skills":["skill1","skill2"],"experience":"brief summary","titles":["job title"],"projects":["project name or description"],"certifications":["certification name"]}

Extract ALL skills, projects, and certifications mentioned. For projects, include a short name or one-line description. For certifications, include the full name.`

          const text = await generateText({
            maxOutputTokens: 1024,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${prompt}

Resume:
${extractedResumeText.slice(0, 12000)}`,
                  },
                ],
              },
            ],
          })

          const payload = {
            ...(extractJsonObject(text) ?? {
              skills: [],
              experience: '',
              titles: [],
              projects: [],
              certifications: [],
            }),
            resumeText: extractedResumeText,
            parserDebug: {
              parser: 'gemini-fallback',
              extractedTextLength: extractedResumeText.length,
              cvParseStatus: 'failed',
              cvParseError: message,
              usedFallback: true,
            },
          }
          console.log('resume-extract result', {
            parser: payload.parserDebug.parser,
            skills: payload.skills?.length ?? 0,
            titles: payload.titles?.length ?? 0,
            textLength: payload.resumeText?.length ?? 0,
            error: message,
          })
          return NextResponse.json(payload)
        }
      }

      const extractedResumeText = await extractResumeText(body)

      if (!extractedResumeText) {
        throw new Error('Could not extract readable text from the uploaded resume')
      }

      const prompt = `Extract key information from this resume. Return ONLY valid JSON with this exact shape:
{"name":"string","skills":["skill1","skill2"],"experience":"brief summary","titles":["job title"],"projects":["project name or description"],"certifications":["certification name"]}

Extract ALL skills, projects, and certifications mentioned. For projects, include a short name or one-line description. For certifications, include the full name.`

      const text = await generateText({
        maxOutputTokens: 1024,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${prompt}

Resume:
${extractedResumeText.slice(0, 12000)}`,
              },
            ],
          },
        ],
      })

      const payload = {
        ...(extractJsonObject(text) ?? {
          skills: [],
          experience: '',
          titles: [],
          projects: [],
          certifications: [],
        }),
        resumeText: extractedResumeText,
        parserDebug: {
          parser: 'gemini-only',
          extractedTextLength: extractedResumeText.length,
          usedFallback: false,
        },
      }
      console.log('resume-extract result', {
        parser: payload.parserDebug.parser,
        skills: payload.skills?.length ?? 0,
        titles: payload.titles?.length ?? 0,
        textLength: payload.resumeText?.length ?? 0,
      })
      return NextResponse.json(payload)
    }

    if (body.type === 'extract-email') {
      const prompt = `Extract the primary email address from this resume. Return ONLY valid JSON in this exact shape:
{"email":"candidate@example.com"}

If no email is found, return {"email":""}.`

      if (body.fileData && body.mimeType) {
        try {
          const text = await generateText({
            maxOutputTokens: 128,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inline_data: {
                      mime_type: String(body.mimeType),
                      data: String(body.fileData),
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          })

          const parsed = extractJsonObject(text) ?? {}
          return NextResponse.json({
            email: typeof parsed.email === 'string' ? parsed.email : '',
            parserDebug: {
              parser: 'gemini-email',
              usedFallback: false,
            },
          })
        } catch (error) {
          const plainText = String(body.text ?? '')
          return NextResponse.json({
            email: extractEmailFromText(plainText),
            parserDebug: {
              parser: 'regex-email-fallback',
              cvParseError: error instanceof Error ? error.message : 'Email extraction failed',
              usedFallback: true,
            },
          })
        }
      }

      const text = String(body.text ?? '')
      return NextResponse.json({
        email: extractEmailFromText(text),
        parserDebug: {
          parser: 'regex-email',
          usedFallback: false,
        },
      })
    }

    if (body.type === 'suggest-jobs') {
      const text = await generateText({
        maxOutputTokens: 1024,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Based on the following candidate profile, suggest 5 job roles that would be a great fit. Return ONLY valid JSON as an array of objects with this shape:
[{"title":"Job Title","reason":"One sentence why this is a good fit","match":85}]

The match should be a number 70-98 representing how well they'd fit.

Skills: ${JSON.stringify(body.skills ?? [])}
Experience: ${String(body.experience ?? '')}
Titles: ${JSON.stringify(body.titles ?? [])}
Projects: ${JSON.stringify(body.projects ?? [])}`,
              },
            ],
          },
        ],
      })

      const parsed = text.match(/\[[\s\S]*\]/)?.[0]
      let suggestions = []
      try {
        suggestions = parsed ? JSON.parse(parsed) : []
      } catch {
        suggestions = []
      }
      return NextResponse.json({ suggestions })
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
When the additional candidate details below are relevant, weave them into the tailored resume naturally and prioritize the strongest matching skills, projects, certifications, and experience for this job.

JOB TITLE: ${String(body.jobTitle ?? '')}
JOB DESCRIPTION: ${String(body.jobDesc ?? 'Not provided').slice(0, 1000)}

PARSED SKILLS: ${JSON.stringify(body.skills ?? [])}
PARSED PROJECTS: ${JSON.stringify(body.projects ?? [])}
PARSED CERTIFICATIONS: ${JSON.stringify(body.certifications ?? [])}
PARSED EXPERIENCE SUMMARY: ${String(body.experience ?? '')}
ADDITIONAL SKILLS: ${JSON.stringify(body.extraSkills ?? [])}
ADDITIONAL PROJECTS: ${JSON.stringify(body.extraProjects ?? [])}
ADDITIONAL EXPERIENCE: ${String(body.extraExperience ?? '')}
PREFERRED ROLES: ${JSON.stringify(body.preferredRoles ?? [])}

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
