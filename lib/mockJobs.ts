export interface Job {
  id: string
  title: string
  company: string
  location: string
  daysAgo: number
  match: number
  matchReason: string
  applyUrl: string
  applied: boolean
  description: string
  logo?: string
  salaryMin?: number
  salaryMax?: number
}

export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Frontend Developer',
    company: 'TechCorp',
    location: 'Remote',
    daysAgo: 2,
    match: 92,
    matchReason: 'Strong match for your React and TypeScript skills',
    applyUrl: 'https://careers.google.com',
    applied: false,
    description: 'Build beautiful, performant web applications using React, TypeScript, and modern CSS. Work with a collaborative team to ship features users love.',
  },
  {
    id: '2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'San Francisco, CA',
    daysAgo: 1,
    match: 88,
    matchReason: 'Your project experience aligns perfectly with our stack',
    applyUrl: 'https://stripe.com/jobs',
    applied: false,
    description: 'Join a fast-growing startup to build the next generation of fintech tools. Experience with Node.js and React preferred.',
  },
  {
    id: '3',
    title: 'React Developer',
    company: 'FinTech Co',
    location: 'Remote',
    daysAgo: 3,
    match: 85,
    matchReason: 'Matches your open source contributions and passion for UI',
    applyUrl: 'https://jobs.lever.co',
    applied: false,
    description: 'Design and implement complex UI components for our trading platform. Strong CSS and accessibility knowledge required.',
  },
  {
    id: '4',
    title: 'Software Engineer II',
    company: 'Acme Inc.',
    location: 'New York, NY (Hybrid)',
    daysAgo: 1,
    match: 80,
    matchReason: 'Your background in web development is a great fit',
    applyUrl: 'https://linkedin.com/jobs',
    applied: false,
    description: 'Work across the full product lifecycle at a well-funded B2B SaaS company. Collaborative culture and strong engineering team.',
  },
  {
    id: '5',
    title: 'Junior Frontend Engineer',
    company: 'GreenTech Startup',
    location: 'Remote',
    daysAgo: 2,
    match: 78,
    matchReason: 'Entry-level friendly with mentorship — great for growth',
    applyUrl: 'https://wellfound.com',
    applied: false,
    description: 'Join our mission-driven team building climate tech tools. We invest heavily in mentorship and professional development.',
  },
]
