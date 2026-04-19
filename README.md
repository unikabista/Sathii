# 🌱 Sathi — Your Job Search Friend

> *"A friend is someone who walks beside you when the journey feels long."*

Sathi is a job search companion that fights application fatigue. Check in daily, set a small goal, watch a plant grow as you apply, and celebrate when you're done.

---

## 🚀 Live Demo
Deploy URL: `your-app.vercel.app`  
GitHub: `https://github.com/unikabista/Sathii`

---

## ✨ What It Does

- **Daily vibe check** — sets the tone based on your mood
- **Goal setting** — pick how many jobs to apply to today (1–10)
- **Smart job matching** — real jobs from Indeed, LinkedIn, Adzuna & Himalayas
- **Plant growth tracker** — sprout → leaves → bud → full bloom 🌸
- **AI resume customization** — Gemini rewrites your resume per job
- **Celebration screen** — "You did it." with stats + streak

---

## 🖥️ Screens

| Screen | Description |
|---|---|
| Landing | "Sathi" + quote + Get Started |
| Onboarding | Intro → Resume upload → Who are you → Vibe check → Goal |
| Dashboard | Job cards + filter bar + plant tracker |
| Celebrate | Full bloom flower + stats + closing message |

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| AI | Google Gemini 1.5 Flash (free) |
| Job Data | Adzuna API + Himalayas API (free) |
| Storage | localStorage (no database needed) |
| Deploy | Vercel |
| Icons | Lucide React |

---

## 📁 File Structure

```
sathi/
├── app/
│   ├── layout.tsx              # Root layout, DM Sans font
│   ├── page.tsx                # Landing screen
│   ├── globals.css             # Cream bg, DM Sans, Tailwind
│   ├── onboarding/
│   │   └── page.tsx            # 5-step onboarding flow
│   ├── dashboard/
│   │   └── page.tsx            # Main job search dashboard
│   ├── celebrate/
│   │   └── page.tsx            # Goal completion screen
│   ├── api/
│   │   ├── jobs/
│   │   │   └── route.ts        # Job search (Adzuna + Himalayas)
│   │   └── ai/
│   │       └── route.ts        # Gemini AI (resume + chat)
├── components/
│   ├── Plant.tsx               # SVG plant stages 0-4
│   ├── JobCard.tsx             # Job card with apply/save/dismiss
│   ├── ResumeModal.tsx         # AI resume customization modal
│   ├── FilterDrawer.tsx        # All Filters slide-in panel
│   ├── SathiChat.tsx           # AI chat companion
│   └── ConfettiBlast.tsx       # Celebration confetti
├── lib/
│   ├── jobs.ts                 # Job fetch + query builder
│   └── store.ts                # localStorage helpers
├── .env.local                  # API keys (never commit this)
├── tailwind.config.ts
└── package.json
```

---

## 🎨 Design System

| Token | Value | Use |
|---|---|---|
| Cream | `#FFFBF0` | Background |
| Sage | `#7CB987` | Primary buttons, accents |
| Sage Dark | `#5a9768` | Hover states |
| Mint | `#E8F5E9` | Card backgrounds |
| Charcoal | `#2D2D2D` | Headings |
| Muted | `#6B7280` | Subtext |
| Yellow | `#FFD166` | Good match badge |

Font: **DM Sans** (Google Fonts)

---

## 🌿 Plant Growth Stages

| Applications Done | Plant |
|---|---|
| 0 | Empty pot 🪴 |
| 1 | Tiny sprout 🌱 |
| 2 | Sprout with leaves |
| 3 | Growing bud 🌷 |
| Goal reached | Full bloom 🌸 + confetti |

---

## 🔧 Onboarding Flow

1. **Intro** — "Let's get to know each other"
2. **Resume Upload** — drag & drop, Gemini extracts skills
3. **Who are you?** — Student / Recent Grad / Career Changer / Experienced Pro
4. **Vibe Check** — 😔 Drained / 😐 Okay / 🙂 Good / 🔥 Motivated
5. **Goal Setting** — slider 1–10, mood auto-suggests number

---

## 🔍 Job Search Logic

### APIs Used
- **Adzuna** — onsite/hybrid jobs, filters by city + country + salary
- **Himalayas** — remote jobs, zero ghost postings, no API key needed

### Query Building
```
Student/Recent Grad  → "role intern OR entry level OR junior"
Experienced Pro      → "role senior OR lead"
Career Changer       → skills-based search
Always adds          → &category=it-jobs &sort_by=date &max_days_old=14
```

### Filters That Work
- Role / Job Function (multi-tag)
- Experience level (Intern → Lead)
- Job type (Full-time / Part-time / Contract / Internship)
- Work model (Remote / Hybrid / Onsite)
- Time posted (24h / 3 days / 1 week / 14 days)
- Country (US / UK / Canada / Australia / India)
- City (free text)
- Salary range ($0 – $200k slider)
- Excluded title keywords

### Match % Calculation
```
matchScore = (profile.skills ∩ job keywords) / profile.skills.length × 100
85%+ = STRONG MATCH (sage green)
70–84% = GOOD MATCH (yellow)
<70% = MATCH (gray)
```

---

## 🤖 AI Features (Gemini 1.5 Flash)

### Resume Extraction
On upload → Gemini extracts:
`{ name, currentRole, skills[], experience[], education }`

### Resume Customization
User clicks "Customize Resume" on any job card →
Gemini rewrites their resume bullets to match that specific job →
Side-by-side view: Original | Customized →
Copy or Download as .txt

### Sathi Chat
Floating chat button → warm, encouraging AI friend →
Adjusts tone based on mood set in vibe check

---

## 📊 localStorage Keys

| Key | Contents |
|---|---|
| `sathi_profile` | name, skills, experience, type, resumeText, targetRoles, workTypes, city, country |
| `sathi_today` | mood, goal, applied[], date |
| `sathi_filters` | all filter drawer state |
| `sathi_streak` | day streak count |
| `sathi_saved` | saved/hearted jobs |

---

## ⚙️ Setup & Run

### 1. Clone
```bash
git clone https://github.com/unikabista/Sathii.git
cd Sathii
npm install
```

### 2. Environment Variables
Create `.env.local`:
```
GEMINI_API_KEY=your_gemini_key_here
ADZUNA_APP_ID=your_key
ADZUNA_APP_KEY=your_new_key_here
```

### 3. Run Locally
```bash
npm run dev
```
Open `http://localhost:3000`
