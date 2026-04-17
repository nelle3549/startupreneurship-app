# Startupreneurship - Project Documentation

> A comprehensive entrepreneurship education platform for Grade 1-12 and College students, with interactive lessons, gamification, and classroom management.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Environment Variables](#environment-variables)
6. [Architecture](#architecture)
7. [Authentication](#authentication)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Pages & Routes](#pages--routes)
10. [Database Schema](#database-schema)
11. [Entity Abstraction Layer](#entity-abstraction-layer)
12. [Features](#features)
13. [Course Content System](#course-content-system)
14. [Interactive Activities](#interactive-activities)
15. [Classroom & Enrollment System](#classroom--enrollment-system)
16. [Admin Panel](#admin-panel)
17. [Deployment](#deployment)
18. [API Reference](#api-reference)

---

## Overview

Startupreneurship is a web-based learning platform that teaches entrepreneurship concepts across all Philippine education levels (Grade 1 through College Year 4). It features:

- **13 grade-level coursewares** with structured lesson content
- **6+ interactive activity types** (MCQ, Wordle, Jigsaw, etc.)
- **Multi-role system** (Admin, Facilitator, Student, Guest)
- **Classroom management** with enrollment codes and facilitator approval
- **Gamification** with login streaks, daily games, and achievements
- **Content management** for funding opportunities, competitions, and articles

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 18.2, React Router 6.26 |
| **Build Tool** | Vite 6.1 |
| **Styling** | Tailwind CSS 3.4, PostCSS |
| **UI Components** | Radix UI primitives, shadcn/ui |
| **Icons** | Lucide React |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **State Management** | TanStack React Query 5.84 |
| **Backend / Auth** | Supabase (PostgreSQL + Auth) |
| **Forms** | React Hook Form + Zod validation |
| **Rich Text** | React Quill |
| **PDF** | React PDF, jsPDF, html2canvas |
| **Drag & Drop** | @dnd-kit, @hello-pangea/dnd |
| **Payments** | Stripe (React + JS) |
| **Deployment** | Vercel |

---

## Project Structure

```
src/
 +-- api/
 |   +-- supabaseClient.js      # Supabase client initialization
 |   +-- entities.js             # Entity abstraction layer (DB operations)
 |   +-- base44Client.js         # Compatibility wrapper (delegates to Supabase)
 +-- components/
 |   +-- admin/                  # Admin panel components (13 files)
 |   |   +-- AdminContentTab     # Manage home page sections
 |   |   +-- ClassroomsTab       # Admin classroom CRUD
 |   |   +-- CoursewaresTab      # Course listing & editor
 |   |   +-- CourseEditorFullscreen # Full-screen course builder
 |   |   +-- CreateAccountDialog # Bulk account creation
 |   |   +-- UserActionDialog    # User role/status changes
 |   |   +-- McqActivityBuilder  # MCQ question builder
 |   |   +-- MicroValidationActivityBuilder
 |   |   +-- RoleManagementTab, HistoryArchiveTab, DragDropScheduler
 |   +-- classroom/              # Classroom view components (11 files)
 |   |   +-- AnnouncementsSection, AnnouncementCard
 |   |   +-- LessonsTab, LessonManagementDialog
 |   |   +-- StudentListSection, GradesSection
 |   |   +-- ClassroomHeader, EditClassroomModal
 |   |   +-- CalendarSection, CourseDetailsDialog, ActivitiesSection
 |   +-- home/                   # Home page widgets (8 files)
 |   |   +-- DailyBanner, GameOfTheDay, FundingOpportunities
 |   |   +-- InnovationCompetitions, WhatsBrewingSection
 |   |   +-- StreaksSection, StreakCard, AchievementDialog
 |   +-- portal/                 # Facilitator/Student portal (7 files)
 |   |   +-- ClassroomsTab, EnrollmentsTab, StudentsTab
 |   |   +-- LessonManagementTab, ProgressTrackingTab
 |   |   +-- PortalOnboardingTour, NotificationTutorial
 |   +-- registration/           # Auth & onboarding (4 files)
 |   |   +-- LoginSignup, RoleSelector, StudentForm, FacilitatorForm
 |   +-- viewer/                 # Lesson viewer & activities (12 files)
 |   |   +-- LessonRenderer, LessonNav
 |   |   +-- MCQActivity, MCQCompletionPage
 |   |   +-- WordleActivity, JigsawPuzzleActivity
 |   |   +-- OddOneOutActivity, MatchObjectsToBusinessesActivity
 |   |   +-- MicroValidationActivity
 |   |   +-- ImageViewer, ActivityShortcuts, EvaluationComplete
 |   +-- library/                # Content library components (8 files)
 |   +-- ui/                     # shadcn/ui primitives (40+ files)
 |   +-- data/                   # Static data & content
 |   |   +-- courseData.jsx      # 13 courseware definitions
 |   |   +-- activityData.jsx    # MCQ & Wordle question pools
 |   |   +-- lessonContent/      # Per-grade lesson JSON/JSX files
 |   |   +-- pdfLinks.jsx        # PDF resource URLs
 |   +-- hooks/                  # Custom hooks
 |   +-- CompleteProfileDialog.jsx
 |   +-- UserNotRegisteredError.jsx
 |   +-- useCurrentUser.jsx      # Core user data hook
 +-- lib/
 |   +-- AuthContext.jsx          # Supabase auth state management
 |   +-- query-client.js          # React Query configuration
 |   +-- PageNotFound.jsx
 |   +-- utils.js                 # Utility functions (cn, etc.)
 +-- pages/
 |   +-- Home.jsx                 # Landing dashboard
 |   +-- Portal.jsx               # Facilitator/Student portal
 |   +-- Viewer.jsx               # Lesson viewer
 |   +-- Admin.jsx                # Admin panel
 |   +-- ClassroomView.jsx        # Classroom detail
 |   +-- Analytics.jsx            # Student analytics
 |   +-- AccountSettings.jsx      # Profile management
 |   +-- CourseBuilder.jsx        # Course editor
 |   +-- FundingGrants.jsx        # Funding directory
 |   +-- InnovationCompetitionsPage.jsx
 |   +-- WhatsBrewingPage.jsx     # Resource library
 +-- App.jsx                      # Root component, routing, auth wrapper
 +-- Layout.jsx                   # Page layout shell
 +-- main.jsx                     # Entry point
 +-- pages.config.js              # Page registry
 +-- index.css                    # Global styles & Tailwind imports
```

---

## Setup & Installation

### Prerequisites

- Node.js 18+ (recommended: 22.x)
- npm 9+
- A Supabase project with Google OAuth configured

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/nelle3549/startupreneurship-app.git
cd startupreneurship-app

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start dev server
npm run dev
# App runs at http://localhost:5173
```

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server |
| `build` | `vite build` | Production build |
| `preview` | `vite preview` | Preview production build |
| `lint` | `eslint . --quiet` | Run linter |
| `lint:fix` | `eslint . --fix` | Auto-fix lint issues |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |

These are set in `.env.local` for local development and in Vercel project settings for production.

---

## Architecture

```
Browser
  |
  +-- React App (Vite SPA)
  |     +-- AuthContext (session management)
  |     +-- React Query (server state cache)
  |     +-- Entity Layer (entities.js)
  |           |
  |           +-- Supabase Client (supabaseClient.js)
  |                 |
  +-- Supabase
        +-- Auth (Google OAuth, session tokens)
        +-- PostgreSQL (23 tables with RLS)
        +-- Auto-triggers (user creation on signup)
```

### Key Design Decisions

1. **Entity Abstraction Layer** — `src/api/entities.js` provides a unified API (`filter()`, `create()`, `update()`, `delete()`, `list()`) over Supabase, making it easy to swap backends.

2. **Compatibility Wrapper** — `src/api/base44Client.js` exports a `base44` object that delegates to Supabase, so existing component imports (`import { base44 } from '@/api/base44Client'`) continue to work without modification.

3. **Auto User Provisioning** — A database trigger creates a `users` row when someone signs up via Supabase Auth. The `useCurrentUser` hook then auto-creates a `user_accounts` row with profile data from Google.

4. **Role-Based Access** — Permissions are enforced at the component level using the `useCurrentUser` hook's `isAdmin`, `isFacilitator`, `isStudent` flags. Row Level Security (RLS) policies on Supabase tables provide server-side enforcement.

---

## Authentication

Authentication uses **Supabase Auth with Google OAuth**. No email/password confirmation is required — users sign in with Google and land directly in the app.

### Auth Flow

```
1. User visits app
2. AuthContext checks Supabase session (getSession)
3. If no session → LoginSignup component shown
4. User clicks "Continue with Google"
5. Supabase OAuth redirect → Google consent → callback
6. onAuthStateChange fires with SIGNED_IN event
7. User metadata extracted (name, email, avatar)
8. useCurrentUser hook:
   a. Queries user_accounts table by email
   b. If not found → auto-creates record (role: guest)
   c. If Google provided name → onboarding_completed: true
   d. If name missing → CompleteProfileDialog shown (skippable)
9. User lands on /Home
```

### Key Auth Files

| File | Purpose |
|------|---------|
| `src/lib/AuthContext.jsx` | Global auth state, session management, `onAuthStateChange` listener |
| `src/api/supabaseClient.js` | Supabase client initialization |
| `src/api/base44Client.js` | Auth method wrappers (`me()`, `redirectToLogin()`, `logout()`, `updateMe()`) |
| `src/components/useCurrentUser.jsx` | Fetches/creates UserAccount, computes role flags |
| `src/components/registration/LoginSignup.jsx` | Login UI with OAuth buttons |
| `src/components/CompleteProfileDialog.jsx` | Skippable profile completion modal |

### Session Management

- Sessions are managed by Supabase Auth (JWT tokens stored in browser)
- `onAuthStateChange` listens for `SIGNED_IN`, `SIGNED_OUT`, and `TOKEN_REFRESHED` events
- React Query caches user data with a 5-minute stale time

---

## User Roles & Permissions

### Roles

| Role | How Assigned | Access Level |
|------|-------------|-------------|
| **Guest** | Default on first login | Browse public content (funding, competitions, articles). No classroom access. |
| **Student** | Self-enroll via classroom code | View enrolled classrooms, access lessons, complete activities, view own analytics |
| **Facilitator** | Apply via Account Settings → Admin approves | Create/manage classrooms, manage enrollments, control lesson access, view student progress |
| **Admin** | Set directly in database | Full system access: manage all users, approve facilitators, manage coursewares, edit home content |

### Facilitator Approval Workflow

```
1. User registers as facilitator (facilitator_status = "pending")
2. Admin sees pending application in Admin > Users tab
3. Admin approves → status = "approved", role = "facilitator"
   OR rejects → status = "rejected", role = "student"
4. Approved facilitators can access Portal and create classrooms
```

### Permission Checks in Code

```jsx
const { isAdmin, isFacilitator, isStudent } = useCurrentUser();

// isAdmin:       role === "admin" (in either auth user or UserAccount)
// isFacilitator: role === "facilitator" AND facilitator_status === "approved"
// isStudent:     role === "student"
```

---

## Pages & Routes

| Route | Component | Access | Description |
|-------|-----------|--------|-------------|
| `/` | Redirect | All | Redirects to `/Home` |
| `/Home` | `Home.jsx` | Authenticated | Dashboard with greeting, streaks, daily banner, game, funding, competitions, articles |
| `/Portal` | `Portal.jsx` | Facilitator / Student | Facilitator: classroom management, enrollments, progress. Student: enrolled classrooms |
| `/Viewer` | `Viewer.jsx` | Student / Facilitator / Admin | Interactive lesson viewer with activities and progress tracking |
| `/Admin` | `Admin.jsx` | Admin only | User management, facilitator approval, classrooms, coursewares, home content |
| `/ClassroomView` | `ClassroomView.jsx` | Facilitator / Enrolled Student / Admin | Classroom detail: announcements, lessons, students, grades |
| `/Analytics` | `Analytics.jsx` | Student | Learning analytics: completion %, streak, quiz scores, per-course breakdown |
| `/AccountSettings` | `AccountSettings.jsx` | Authenticated | Profile editing, role enrollment, logout, delete account |
| `/CourseBuilder` | `CourseBuilder.jsx` | Admin | Full-screen course content editor |
| `/FundingGrants` | `FundingGrants.jsx` | Authenticated | Directory of startup funding opportunities |
| `/InnovationCompetitions` | `InnovationCompetitionsPage.jsx` | Authenticated | Innovation competition listings |
| `/WhatsBrewing` | `WhatsBrewingPage.jsx` | Authenticated | Resource library (books, courses, articles) |
| `*` | `PageNotFound.jsx` | All | 404 page |

---

## Database Schema

### Core Tables

#### `users`
Auto-created by database trigger on Supabase Auth signup.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `auth_id` | UUID (FK → auth.users) | Supabase auth user ID |
| `email` | TEXT (unique) | User email |
| `full_name` | TEXT | Full name from Google |
| `first_name` | TEXT | First name |
| `last_name` | TEXT | Last name |
| `role` | TEXT | guest, student, facilitator, admin |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

#### `user_accounts`
App-specific profile data, auto-created by `useCurrentUser` hook.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `user_id` | UUID (FK → users) | Link to users table |
| `email` | TEXT (unique) | User email |
| `first_name` | TEXT | First name |
| `last_name` | TEXT | Last name |
| `extension` | TEXT | Name suffix (Jr., Sr., III) |
| `gender` | TEXT | Male, Female, Other, Prefer not to say |
| `role` | TEXT | guest, student, facilitator, admin |
| `facilitator_status` | TEXT | none, pending, approved, rejected |
| `school_organization` | TEXT | School or organization name |
| `province` | TEXT | Province |
| `city_municipality` | TEXT | City/Municipality |
| `onboarding_completed` | BOOLEAN | Profile completion status |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update |

#### `classrooms`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `name` | TEXT | Classroom name |
| `facilitator_id` | UUID (FK → users) | Owner facilitator |
| `facilitator_email` | TEXT | Facilitator email |
| `enrollment_code` | TEXT (unique) | Code students use to enroll |
| `year_level_key` | TEXT | Linked courseware (e.g., "grade-7") |
| `description` | TEXT | Classroom description |
| `is_archived` | BOOLEAN | Soft delete |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `enrollments`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `classroom_id` | UUID (FK → classrooms) | Target classroom |
| `student_id` | UUID (FK → users) | Student |
| `student_email` | TEXT | Student email |
| `student_name` | TEXT | Student name |
| `status` | TEXT | pending, approved, rejected |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `student_lesson_progress`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `classroom_id` | UUID (FK → classrooms) | Classroom |
| `student_id` | UUID (FK → users) | Student |
| `year_level_key` | TEXT | Grade level |
| `lesson_number` | INTEGER | Lesson number |
| `completion_percentage` | NUMERIC | 0-100 |
| `score` | NUMERIC | Activity score |
| `status` | TEXT | not_started, in_progress, completed |
| `answers` | JSONB | Student answers |
| `attempt_count` | INTEGER | Number of attempts |

#### `lesson_access`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `classroom_id` | UUID (FK → classrooms) | Classroom |
| `year_level_key` | TEXT | Grade level |
| `lesson_number` | INTEGER | Lesson number |
| `is_open` | BOOLEAN | Whether lesson is unlocked |
| `retakes_enabled` | BOOLEAN | Allow retakes |
| `max_retakes` | INTEGER | Maximum retake attempts |

### Content Tables

#### `course_details`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `year_level_key` | TEXT | Grade level identifier |
| `subtitle` | TEXT | Course subtitle |
| `summary` | TEXT | Course overview |
| `quote` | TEXT | Inspirational quote |
| `quote_author` | TEXT | Quote attribution |
| `objectives` | JSONB | Learning objectives array |

#### `lesson_content`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `year_level_key` | TEXT | Grade level |
| `lesson_number` | INTEGER | Lesson number |
| `title` | TEXT | Lesson title |
| `content` | JSONB | Full lesson content |
| `slides` | JSONB | Slide-format content |

#### `coursewares`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Primary key |
| `key` | TEXT (unique) | Identifier (e.g., "grade-1") |
| `grade` | TEXT | Display name |
| `subtitle` | TEXT | Short description |
| `segment` | TEXT | grade-school, junior-senior-hs, college |
| `summary` | TEXT | Course summary |
| `status` | TEXT | draft, published |

### Social & Engagement Tables

#### `announcements`
Classroom announcements with author tracking.

#### `comments`
Comments on announcements (FK → announcements).

#### `reactions`
Emoji reactions on announcements (unique per user + announcement + type).

### Content Directory Tables
Read-mostly tables managed by admins, displayed on the home page:

| Table | Content Type |
|-------|-------------|
| `articles` | "What's Brewing" resources |
| `competitions` | Innovation competition listings |
| `quotes` | Daily banner quotes |
| `funding_opportunities` | Funding/grant listings |
| `wordle_words` | Game of the Day word pool |
| `presentation_slides` | Slide content |
| `history_archives` | Historical content |

### Audit Tables

| Table | Purpose |
|-------|---------|
| `user_activity` | Activity logging (lesson completions, etc.) |
| `evaluator_progress` | Evaluation/grading progress |
| `deleted_user_log` | Audit trail of deleted accounts |

---

## Entity Abstraction Layer

The entity layer (`src/api/entities.js`) provides a unified API over Supabase tables:

```javascript
import { entities } from '@/api/entities';

// List all rows (optionally ordered)
const classrooms = await entities.Classroom.list("created_at");       // ascending
const articles = await entities.Article.list("-featured_date");        // descending

// Filter by field equality
const approved = await entities.Enrollment.filter({
  classroom_id: "abc-123",
  status: "approved"
});

// Create a row
const classroom = await entities.Classroom.create({
  name: "Entrepreneurship 101",
  facilitator_id: userId,
  enrollment_code: "ENT101"
});

// Update a row by ID
await entities.UserAccount.update(accountId, {
  role: "facilitator",
  facilitator_status: "approved"
});

// Delete a row by ID
await entities.Enrollment.delete(enrollmentId);
```

### Available Entity Names

`User`, `UserAccount`, `Classroom`, `Enrollment`, `StudentLessonProgress`, `LessonAccess`, `CourseDetails`, `LessonContent`, `Courseware`, `Announcement`, `Comment`, `Reaction`, `UserActivity`, `EvaluatorProgress`, `DeletedUserLog`, `Article`, `Competition`, `Quote`, `FundingOpportunity`, `WordleWord`, `PresentationSlide`, `HistoryArchive`

---

## Features

### Home Dashboard
- Personalized greeting based on user role and time of day
- **Login streak tracker** with visual calendar and achievement badges
- **Daily inspirational banner** (rotating quotes from database)
- **Game of the Day** (Wordle-style word game)
- **Funding opportunities** carousel
- **Innovation competitions** showcase
- **"What's Brewing"** resource articles
- Quick-access buttons to Portal, Classroom, Admin (role-dependent)

### Gamification
- Login streak tracking with localStorage persistence
- Achievement dialogs for milestones (3-day, 7-day, 30-day streaks)
- Canvas confetti celebrations on achievements
- Game of the Day widget on home page

### Student Analytics
- Overall completion percentage across all courses
- Learning streak (consecutive days)
- Average quiz score
- Per-course progress breakdown (lessons completed, completion %)

### Account Settings
- Edit personal info (name, gender, school, location)
- Enroll as student (via classroom code)
- Register as facilitator (pending admin approval)
- Logout and delete account options
- Unsaved changes detection with navigation prompts

---

## Course Content System

### Structure

Courses are organized into **3 segments** with **13 year levels**:

| Segment | Year Levels |
|---------|------------|
| Grade School | Grade 1, 2, 3, 4, 5, 6 |
| Junior-Senior HS | Grade 7, 8, 9, 10, 11, 12 |
| College | Year 1, 2, 3, 4 |

### Course Hierarchy

```
Courseware (e.g., "Grade 7")
 +-- Lesson 0: Course Overview (summary, quote, objectives)
 +-- Lesson 1: [Topic]
 |    +-- Learning Objectives
 |    +-- Section 1: [Content]
 |    +-- Section 2: [Content]
 |    +-- Activity (MCQ, Wordle, etc.)
 +-- Lesson 2: [Topic]
 +-- ... (up to ~12 lessons per grade)
```

### Content Sources

1. **Static** — `src/components/data/courseData.jsx` defines course metadata (titles, summaries, objectives)
2. **Static** — `src/components/data/lessonContent/` has per-grade lesson content (JSON + JSX)
3. **Database** — `course_details` and `lesson_content` tables for admin-editable content
4. **Admin Editor** — `CourseEditorFullscreen` allows real-time course content editing

---

## Interactive Activities

| Activity | Description | Grades | Scoring |
|----------|-------------|--------|---------|
| **MCQ** | 5 random multiple-choice questions from a grade-level pool (40-80 questions) | All | 0-100% |
| **Wordle** | 5-letter word guessing game with 6 attempts and hints | Grade 5+ | Pass/Fail |
| **Jigsaw Puzzle** | Drag-and-drop image assembly | Select grades | Completion |
| **Odd One Out** | Identify which item doesn't belong in a set | Select grades | Correct/Incorrect |
| **Match Objects** | Pair objects/products with business types | Select grades | Completion |
| **Micro Validation** | Short reflection prompts or quick-check questions | Select grades | Completion |

### Progress Tracking

- Scores saved per lesson, per student, per classroom
- Multiple attempts tracked with timestamps (`all_scores` JSONB array)
- Highest score preserved (`highest_score`, `highest_score_date`)
- Retake system: facilitator can enable retakes with configurable max attempts
- Sequential lesson unlocking: must complete lesson N before accessing N+1

---

## Classroom & Enrollment System

### Classroom Creation (Facilitator)

```
1. Facilitator creates classroom (name, year level, description)
2. System generates unique enrollment code
3. Facilitator shares code with students
```

### Student Enrollment

```
1. Student enters enrollment code in Account Settings or Student Form
2. Enrollment created with status = "pending"
3. Facilitator reviews in Portal > Enrollments tab
4. Facilitator approves → student gains classroom access
   OR rejects → enrollment removed
```

### Lesson Access Control

```
1. Facilitator opens Portal > Lesson Management tab
2. Toggles individual lessons open/closed per classroom
3. Configures retake settings (enabled, max attempts)
4. Students can only access open lessons
5. Sequential requirement: previous lesson must be completed
```

---

## Admin Panel

The admin panel (`/Admin`) has four tabs:

### Users Tab
- Full user table with search and role filtering
- Pending facilitator applications highlighted at top
- Approve/reject facilitator applications
- Change user roles, create new accounts
- Delete user accounts (with audit logging)

### Classrooms Tab
- View all classrooms across all facilitators
- Create, edit, archive classrooms
- Reassign facilitator ownership

### Coursewares Tab
- List of all 13 coursewares with publish status
- Launch full-screen course editor
- Create new courseware entries

### Home Content Tab
- Manage content sections displayed on the home page
- CRUD operations for: Articles, Competitions, Quotes, Funding Opportunities, Wordle Words
- Toggle content visibility (hidden flag)
- Reorder content (order field)

---

## Deployment

### Vercel (Production)

- **URL:** https://startupreneurship-app.vercel.app
- **GitHub:** https://github.com/nelle3549/startupreneurship-app
- **Build Command:** `vite build`
- **Output Directory:** `dist`
- **SPA Routing:** Configured via `vercel.json` (catch-all rewrite to `/index.html`)

### Environment Variables (Vercel)

Set in Vercel Project Settings > Environment Variables:

```
VITE_SUPABASE_URL = https://dtyvpzjbyqyipwkhjfsm.supabase.co
VITE_SUPABASE_ANON_KEY = [your-anon-key]
```

### Supabase

- **Project:** Startupreneurship
- **Region:** ap-southeast-1 (Singapore)
- **Auth:** Google OAuth (must be configured in Supabase Dashboard > Auth > Providers)
- **Database:** 23 tables with Row Level Security enabled

### Google OAuth Setup

To enable Google login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials (Web application type)
3. Add authorized redirect URI: `https://dtyvpzjbyqyipwkhjfsm.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret
5. In Supabase Dashboard > Auth > Providers > Google: enable and paste credentials

---

## API Reference

### Auth Methods (`base44.auth`)

```javascript
import { base44 } from '@/api/base44Client';

// Get current user
const user = await base44.auth.me();
// Returns: { id, email, first_name, last_name, full_name, avatar_url, role }

// Redirect to Google OAuth
await base44.auth.redirectToLogin('/Home');

// Sign out
await base44.auth.logout('/');          // with redirect
await base44.auth.logout();             // without redirect

// Update user metadata
await base44.auth.updateMe({ first_name: 'Jane', last_name: 'Doe' });
```

### Entity Methods (`entities.*`)

```javascript
import { entities } from '@/api/entities';

// List with optional ordering
await entities.Article.list("order");           // ASC
await entities.Article.list("-created_at");      // DESC (prefix with -)

// Filter by field equality
await entities.Enrollment.filter({ student_email: "user@email.com", status: "approved" });

// Create
await entities.Classroom.create({ name: "Class A", facilitator_id: userId });

// Update by ID
await entities.UserAccount.update(id, { role: "student" });

// Delete by ID
await entities.Enrollment.delete(id);
```

### React Query Keys

| Key | Data |
|-----|------|
| `["current-user"]` | Authenticated user from Supabase Auth |
| `["user-account", email]` | UserAccount record for the logged-in user |

### Custom Hooks

| Hook | File | Returns |
|------|------|---------|
| `useCurrentUser()` | `src/components/useCurrentUser.jsx` | `{ user, userAccount, isLoading, isAdmin, isFacilitator, isStudent }` |
| `useAuth()` | `src/lib/AuthContext.jsx` | `{ user, isAuthenticated, isLoadingAuth, authError, logout, navigateToLogin }` |
| `useCoursewares()` | `src/hooks/useCoursewares.js` | Courseware data |
| `useNotifications()` | `src/components/hooks/useNotifications.jsx` | Pending counts for facilitator/enrollment approvals |
