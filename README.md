# Startupreneurship

Empowering students and facilitators with entrepreneurship education, courses, and innovation competitions.

## Features

- **Student Portal** — Enroll in classrooms, access lessons, track progress
- **Facilitator Portal** — Manage classrooms, students, enrollments, and lesson access
- **Admin Panel** — User management, course editing, content management
- **Course Viewer** — Interactive lessons with activities (MCQ, Wordle, Jigsaw, etc.)
- **Innovation Competitions** — Browse and participate in entrepreneurship competitions
- **Funding & Grants** — Discover funding opportunities

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, shadcn/ui (Radix)
- **Backend:** Supabase (Auth + PostgreSQL)
- **Deployment:** Vercel

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the app: `npm run dev`

## Deployment

Deployed on Vercel with automatic builds. Push to `main` to deploy.
