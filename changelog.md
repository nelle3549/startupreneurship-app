# Course Builder — Autosave Refinement, Image Uploads, UI Polish, Data Recovery

**Date:** 2026-04-19
**Session window:** ~evening, continuing after the afternoon course-builder session.
**Session:** deeper autosave refactor, Supabase Storage image uploads in the builder, end-to-end UI polish across the editor, and recovery of an accidentally-wiped lesson.
**Links:** App [startupreneurship-app.vercel.app](https://startupreneurship-app.vercel.app/) · Docs [docs-startupreneurship-app.vercel.app](https://docs-startupreneurship-app.vercel.app/) · Changelog [docs-startupreneurship-app.vercel.app/changelog](https://docs-startupreneurship-app.vercel.app/changelog)

## Autosave

### 67. Autosave refactor — snapshotted saves, error signature, flush-on-navigate
*Changed: 2026-04-19 evening*
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

Replaced the 800ms-debounced autosave from §64 with a more robust variant:

- **Snapshot saves.** `runSave` now takes `{detailsSnap, lessonsSnap, sectionsSnap, objectivesSnap, lessonNumSnap, signature}` captured at effect-schedule time so a save in-flight can't be clobbered by concurrent edits.
- **Error signature.** `erroredSignatureRef` records the state signature of a failed save; retries are blocked until state actually changes. No more auto-retry loops on validation errors.
- **`flushSave()`** awaits any in-flight save, then flushes pending edits with the current state. Wired into `handleSelectLesson`, `handleCloseClick`, and `handlePreview` so lesson-switch / close / preview never lose edits.
- **`initial*` setters use `prev === snap` equality** before overwriting — edits made during a save keep their dirty flag.
- **`startTransition` around save-side state updates** (`setIsSaving`, `setInitial*`, `setLastSavedAt`, `setSaveError`) so post-save re-renders are low-priority and can't interrupt keystrokes.

### 68. Debounce 800ms → 5s + save-on-section-blur
*Changed: 2026-04-19 evening*
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

The 800ms debounce fired on every short pause and caused perceived typing lag. Raised to **5000ms** and added a focus-out trigger: a document-level `focusin` listener reads the `[data-section-id]` ancestor of `document.activeElement`; when it changes, a pending save is flushed immediately. Section cards now carry `data-section-id={section.id}` so the listener can resolve them. Net effect: rarely saves during active typing; always saves the moment you leave a section.

### 69. `beforeunload` guard for pending / in-flight saves
*Changed: 2026-04-19 evening*
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

Tab close or hard refresh while `hasUnsavedChanges` or `isSaving` is true fires a browser "leave page?" dialog.

### 70. **Critical autosave bug fix** — gate on `lessonContentLoading` to stop empty-sections wipes
*Diagnosed and fixed: 2026-04-19 evening*
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

Between clicking a lesson and React Query resolving its content, `sections` state was `[]` as a placeholder. If *other* state (`details` or `lessons`) was dirty from a previous edit, the autosave or flush path used the current in-memory sections as the payload — writing `sections: []` to a lesson whose server content hadn't arrived yet, **wiping the row**. Reproduced the symptom exactly for grade-1 lesson 1 (§73).

**Fix:** added `lessonContentNotReady = !!selectedLessonNum && (lessonContentLoading || lessonContentFetching)` and gated three places on it — the sync-from-DB effect, the autosave debounce effect, and `flushSave`. Also stopped the sync effect from writing `[]` while the query is in flight (previously it would flash empty before the real data arrived).

## Builder — image uploads

### 71. Supabase Storage direct uploads from Quill toolbar
*Changed: 2026-04-19 evening*
**New file:** `src/api/storage.js`
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

Quill's default image button embeds uploads as inline `data:` URIs, which bloated `sections` JSON (several MB per image) and slowed every lesson read. Added `uploadLessonImage(file, {folder})` that uploads to the `lesson-images` bucket (public read, already provisioned) with MIME/size validation (≤10 MB images only), timestamp + random-id filename sanitization, and returns `{publicUrl, path}`.

Custom Quill toolbar handler swaps the default. Clicking the image icon now opens a file picker, uploads, and inserts the public URL via `quill.insertEmbed`. Verified end-to-end: test PNG landed at `lesson-images/test/1776585695377-...`.png, served with `200 image/png`.

> Known limitation: paste and drag-drop still fall through Quill's default (base64). Intercepting those via `clipboard.addMatcher` + a drop handler is a follow-up.

## Builder — UI polish

### 72. Ten-item UI pass across the builder
*Changed: 2026-04-19 evening*
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

1. **Dropped duplicate "Saved" chip** in the header — only the footer indicator survives.
2. **Removed "Lesson N — Title" and "Summary" micro-labels** — the title and summary read themselves; placeholder becomes italic "Add a summary…".
3. **Consolidated 4 add-section buttons** (Content / Callout / MCQ / Micro Validation) into a single **"+ Add Section" dropdown**. MCQ shows "Only one" hint when already present.
4. **Sections heading row** forced to single line — no more wrap.
5. **Sidebar lesson cards** tightened (`p-3` → `px-3 py-2`, one-line title with truncation). Chevrons + trash now appear only on hover/focus via `group-hover`.
6. **Section card header** — smaller `h-7 w-7` icons, grouped behind a `border-l` divider, cleaner MCQ chip.
7. **Vertical rhythm** — `mb-8`/`space-y-6` → `mb-6`/`space-y-5` on Course Details and lesson blocks.
8. **Footer Preview/Close layout** — replaced `justify-between` with `flex-1 min-w-0` status slot + `flex-shrink-0` action slot. Buttons no longer shift when the status chip changes (verified: Preview stays at `left: 588.72px` across idle/pending/saving/saved).
9. **Removed Close button** from the footer — redundant with the X in the header.
10. **Sidebar "+ Lesson" / "+ Milestone" split** → single **"+ Add" dropdown** (Lesson / Milestone). Was overflowing the 320px sidebar and clipping Milestone at narrow widths.

## Data recovery

### 73. Grade 1 · Lesson 1 content restored from legacy static file
*Changed: 2026-04-19 evening*
**Target:** `lesson_content` (Supabase)

DB row for `grade-1` lesson `1` had `sections: []`, `lesson_objectives: []`, last written `2026-04-19 01:27 PST` — wiped hours before tonight's session by the race in §70 (the bug was latent in both the old manual Save flow and the pre-refactor autosave). Other grade-1 lessons were intact.

Migrated `src/components/data/lessonContent/grade-1.json.jsx` into the new builder schema via a single `UPDATE lesson_content SET sections = …::jsonb`. Five sections now live: WHAT IS A BUSINESS? · WHY DO PEOPLE START A BUSINESS? · HOW TO START A BUSINESS? · VIDEO: BIZWORLD.ORG (with reflection questions) · LET'S WRAP UP! (tip callout). No MCQ — grade-1 never had one.

> Supabase free tier has no PITR; unrecoverable losses would have been permanent. §70 closes that class of bug going forward.

## Deployment

Five production deploys through the session, each via `vercel deploy --prod --yes`:

| # | Scope | Deployment |
|---|---|---|
| 1 | Initial fixes (§1–§7 from afternoon session) | `dpl_22B5EYZNLpf3C1GsiJARUVhkL4UY` |
| 2 | Autosave refactor (§67) | `dpl_HcQM2WZPPBnayG2W7GqwmPAGn5rF` |
| 3 | Image uploads (§71) | `dpl_4nfKg6zgRxVdAuy1XqtCa5MV8mN1` |
| 4 | Debounce bump + blur save + UI polish (§68, §72) | `dpl_…eijs72ywz…` |
| 5 | Autosave bug fix + data recovery + sidebar dropdown (§70, §73) | current |

Live: https://startupreneurship-app.vercel.app — aliased to each prod deploy as it lands.

## Files touched

| File | Change |
|---|---|
| `src/components/admin/CourseEditorFullscreen.jsx` | Autosave refactor (snapshots + flush + signature + startTransition), 5s debounce, focus-out save trigger, `beforeunload`, `lessonContentNotReady` gate, UI polish pass, Quill image-upload handler, sidebar + sections "+ Add" dropdowns |
| `src/api/storage.js` | **New** — Supabase Storage `uploadLessonImage` helper |
| `src/components/admin/McqActivityBuilder.jsx` | Pool editor refinements (user-side edits layered on the stateless rewrite) |
| `lesson_content` (Supabase) | Restored grade-1 lesson-1 sections from legacy static file |

## Possible follow-ups (not done)

- **Clipboard / drop image uploads.** Paste and drag-drop into Quill still base64-embed. Wire the same `uploadLessonImage` through a `clipboard.addMatcher` + drop listener so every image path funnels through Storage.
- **Per-section autosave scoping.** Right now a save always writes the whole `sections` array. Once per-section dirtiness tracking exists, a save can target only the changed section to reduce payload size on heavy lessons.
- **Audit other lessons for the §70 bug's victims.** We confirmed grade-1 lesson 1 was wiped. Other lessons with `section_count = 0` but a non-null `created_at` should be spot-checked; same restoration recipe applies if a legacy static file exists.
- **Dropdown-driven section reordering.** Moving sections with up/down chevrons is fine for short lessons but tedious past ~8 sections. A drag-handle + `@dnd-kit` would scale better (the library is already in `package.json`).
- **Build chunk splitting.** Production bundle is 2.1 MB / 571 KB gzip. `manualChunks` split for `react-quill`, `pdfjs-dist`, and route-level code would cut first paint.

---

# Classroom, Viewer, MCQ Anti-Cheat, Autosave — Change Log

**Date:** 2026-04-19
**Session window:** ~evening, continuing from the afternoon course-builder session below.
**Session:** student progress tracking end-to-end, classroom redesign, quiz anti-cheat, course-builder autosave, MCQ bulk import for grade-4 + college 1–4.

## Schema migrations (Supabase)

### 41. Add 11 progress-tracking columns to `student_lesson_progress`
*Applied: 2026-04-18*

Added `completed bool`, `current_step_index int`, `total_steps int`, `completion_date timestamptz`, `activity_scores jsonb`, `overall_score numeric`, `highest_score numeric`, `highest_score_date timestamptz`, `all_scores jsonb`, `retake_requested bool`, `retake_approved bool` — all with safe defaults.

Every write to this table from the app was silently failing with `PGRST204` because the columns didn't exist. "Mark as Complete" produced no record; quiz scores were never persisted. Migration unblocked the full progress flow.

### 42. Add `retake_attempts` to `student_lesson_progress`
*Applied: 2026-04-18*

Separate migration. The facilitator's "Approve Retake" handler writes `retake_attempts: (prog.retake_attempts || 0) + 1`; without the column the update silently dropped that field. Now tracked.

### 43. Add `is_auto_announcement` + `metadata` to `announcements`
*Applied: 2026-04-18*

Both columns referenced by the unlock-announcement code but didn't exist, so every auto-announcement write was silently failing. No rows ever appeared despite lessons being unlocked.

### 44. Fix `author_id: "system"` (string) → `null` on auto-announcements
*Changed: 2026-04-18*
**Files:** `src/components/classroom/LessonManagementDialog.jsx`, `src/components/portal/LessonManagementTab.jsx`

`author_id` is a `uuid` column. Writing `"system"` failed type-check regardless of RLS. Changed to `null` for system-posted announcements.

## Classroom

### 45. Auto-announcement on lesson unlock (both paths, with lesson number)
*Changed: 2026-04-18 → 2026-04-19*
**Files:** `src/components/classroom/LessonManagementDialog.jsx`, `src/components/portal/LessonManagementTab.jsx`

Both unlock paths (classroom-side Manage dialog + Portal Lesson Management tab) now post an auto-announcement "New Lesson Available: Lesson N – <title>" with `is_auto_announcement: true` and lesson metadata for the "Go to Lesson" CTA. Portal path gates on transition (`isOpen && !wasOpen`) so re-saves don't spam the feed.

### 46. Spacing polish across Classroom views
*Changed: 2026-04-18*
**Files:** `src/pages/ClassroomView.jsx`, `src/components/classroom/ClassroomHeader.jsx`, `src/components/classroom/AnnouncementsSection.jsx`, `src/components/classroom/LessonsTab.jsx`, `src/components/classroom/StudentListSection.jsx`, `src/components/ui/BrandTabs.jsx`

Collapsed `ClassroomHeader` meta (Facilitator / Code / Students) from a 3-row stack into a single wrapping row; tightened section `space-y-6 → space-y-4`, lesson card padding `p-5 → p-4`, lesson-list `gap-4 → gap-3`, BrandTabsList `mb-6 → mb-5`. Roughly 2× denser lesson list at the same readability.

### 47. Compact completed-state lesson cards
*Changed: 2026-04-19*
**File:** `src/components/classroom/LessonsTab.jsx`

Completed cards drop the summary, progress bar (always 100%), and footer row. Now a single row: emerald left border, Lesson + Completed badges, title, completion date, clickable "Quiz: N%" chip (links straight to the quiz review), and a Review button. Long lesson lists are scannable.

### 48. Start / Resume / Review / Continue Retake / Locked action buttons
*Changed: 2026-04-18*
**File:** `src/components/classroom/LessonsTab.jsx`

`getActionButton(status)` helper returns label/icon/variant per state. Not-started → gradient "Start", in_progress → gradient "Resume", retake_in_progress → gradient "Continue Retake", completed → outline "Review", retake_requested → disabled "Pending Approval", locked → disabled "Locked". Buttons inline on the right of each card.

### 49. Drop "Lesson 0" badge and stop counting Course Overview as a lesson
*Changed: 2026-04-19*
**File:** `src/components/classroom/LessonsTab.jsx`

Removed the "Lesson 0" badge from the Course Overview card. Totals went from "N+1 lessons / 1 of N+1 completed" to the actual lesson count.

### 50. Reset Progress (student, password-guarded)
*Changed: 2026-04-19*
**File:** `src/components/classroom/LessonsTab.jsx`

Red "Reset Progress" button at the bottom of the student's lesson list (only visible with progress). Confirmation dialog lists consequences and requires re-entering the password; handler calls `supabase.auth.signInWithPassword` to verify before deleting every `StudentLessonProgress` row for that student + classroom (any `year_level_key`, so orphaned rows after a year-level change are also cleaned). Wrong password shows "Incorrect password." inline and aborts.

### 51. Rename "Dashboard" → "Home" for students
*Changed: 2026-04-18*
**File:** `src/pages/ClassroomView.jsx`

Students now see "Home" in the classroom's top-right nav (admin/facilitator users keep "Dashboard" because they route to `/Admin`/`/Portal`).

### 52. Remove 3 empty "Review Questions:" placeholder sections
*Changed: 2026-04-18*
**Target:** `lesson_content` (Supabase)

college-1 L10, college-2 L1, college-4 L1 each had a `Review:` text section whose entire content was `<p><strong>Review Questions:</strong></p>` — no actual questions. Deleted.

## Viewer

### 53. Resume-where-you-left-off
*Changed: 2026-04-18 → 2026-04-19*
**File:** `src/pages/Viewer.jsx`

On mount, if the saved `current_step_index > 0` and the lesson isn't completed, the Viewer jumps to that step. Completed lessons open at step 0 so students can re-read from the top. Effect watches `current_step_index` and `completed` so query refetches trigger re-init.

### 54. `?activity=mcq` URL shortcut
*Changed: 2026-04-18*
**File:** `src/pages/Viewer.jsx`

On mount the Viewer searches steps for an MCQ activity and jumps directly, so the Lessons tab's "Quiz: N%" chip drops the student straight onto the review view.

### 55. Mark-lesson-completed on quiz submission
*Changed: 2026-04-19*
**File:** `src/pages/Viewer.jsx`

When the MCQ is submitted (non-retake), `handleActivityComplete` now writes `completed: true`, `status: 'completed'`, `completion_date: now()` alongside the score/history. Revisits land on the past-result view and the Lessons tab flips to Completed — no separate "Mark as Complete" click needed.

### 56. Normalize MCQ `activity_id` for past-result lookup
*Changed: 2026-04-19*
**Files:** `src/pages/Viewer.jsx`, `src/components/viewer/LessonRenderer.jsx`

MCQ scores were stored with `activity_id: <section.id>` (e.g. `"activity-grade-6-l3-mcq"`), but the past-result lookup reads `activity_scores.mcq`. Mismatch → every revisit started a fresh quiz. Added a `kind: "mcq"` signal from `LessonRenderer` to `handleActivityComplete`; the handler now always stores under the `"mcq"` key regardless of section id.

### 57. Main scroll ref never attached until late — fixed via callback ref
*Diagnosed and fixed: 2026-04-18*
**File:** `src/pages/Viewer.jsx`

The Viewer has early-return loading spinners that render before `<main>` mounts. The scroll-listener effect ran with `mainScrollRef.current === null`, then never re-ran (deps `[stepIdx]` didn't change) — so no `scroll` listener was ever attached and `reachedBottom` stayed `false`, leaving Next disabled forever on content that fit the viewport.

Switched to a callback ref (`<main ref={setMainEl}>`). Effects now depend on `[stepIdx, mainEl]` and re-run when the element actually mounts. Also added a `ResizeObserver` so content that fits the viewport (no scroll event ever fires) still flips `reachedBottom` to `true`.

### 58. Fix flex-centered iframe collapse (video embeds)
*Changed: 2026-04-18*
**Files:** `src/components/viewer/LessonRenderer.jsx`, `src/index.css`

The Viewer main uses `flex items-center justify-center`; children shrink to their content. Iframes without explicit width collapsed to their ~420px intrinsic size instead of filling `max-w-3xl`. Added `w-full` to all `LessonRenderer` section wrappers and reset `.video-embed-wrapper iframe` CSS (border/radius/aspect-ratio/margin) so embedded videos render at the full container width.

### 59. Mid-quiz navigation confirmation + beforeunload
*Changed: 2026-04-19*
**Files:** `src/pages/Viewer.jsx`, `src/components/viewer/MCQActivity.jsx`, `src/components/viewer/LessonRenderer.jsx`

MCQActivity fires `onInProgressChange(true/false)` and writes a `submitPartial` function into a parent-held ref. Viewer tracks `mcqInProgress` and intercepts Previous / Classroom / Course Builder clicks with a "Leave quiz in progress?" dialog: "Leave and submit" finalizes with answered items scored and unanswered marked wrong; "Stay" keeps them in. `beforeunload` also guards browser refresh/close while a quiz is active.

## MCQ

### 60. Past-result view with retakes-remaining + attempt history
*Changed: 2026-04-19*
**Files:** `src/components/viewer/MCQActivity.jsx`, `src/components/viewer/LessonRenderer.jsx`, `src/pages/Viewer.jsx`

When a student revisits a completed MCQ section, the Viewer renders a read-only past-result view instead of restarting: **latest score** in the circle (passed → emerald, below threshold → gray), "Best overall" sub-line when different, retake-status chip ("N retakes remaining · M of K used" / "Retakes disabled" / "All retakes used"), per-attempt history rows with BEST and LATEST badges. No self-retake button — retakes go through the facilitator approval flow.

### 61. Quiz anti-cheat: locked set + hidden feedback + 10-min timer
*Changed: 2026-04-19*
**File:** `src/components/viewer/MCQActivity.jsx`

Closes the reroll exploit:
- **Locked question set** — `useMemo` with a stable seed pins the 5 sampled questions per attempt; refreshes can't reshuffle into easier questions.
- **Hidden per-item feedback** — option buttons only show a selected state (blue); correctness is revealed only on the summary. Running score hidden during the quiz.
- **10-minute countdown** in the quiz header (amber → red+pulsing under 1 min); auto-submits at 0 with remaining items marked wrong.
- **beforeunload** guard blocks browser refresh/close while the quiz is in progress.

### 62. Improved results screen: % + pass/fail + answer review
*Changed: 2026-04-18 → 2026-04-19*
**File:** `src/components/viewer/MCQActivity.jsx`

After submission: percentage in the score circle (`PASSING_THRESHOLD = 70`), pass/fail line, and an expandable **"Review your answers"** list. Expanding a question reveals all options with the correct one highlighted green and the student's wrong pick highlighted red. Unanswered items get a "Not answered" chip.

### 63. Rules-of-Hooks bug that stuck students in the Viewer
*Diagnosed and fixed: 2026-04-19*
**File:** `src/components/viewer/MCQActivity.jsx`

The past-result branch did an early `return` *above* all `useState`/`useMemo`/`useEffect` calls. When `previousScore` flipped `undefined → number` on the render right after quiz submission, the hook count changed mid-component, React threw, and the `mcqInProgress` flag got stuck at `true` — every navigation button in the Viewer then fired the Leave-quiz dialog, locking students inside the lesson.

Fix: moved all hooks above the early return, gated each effect body on `!showPastResult`. Effect cleanup now also fires `onInProgressChange(false)` so the flag can't latch.

## Course Builder

### 64. Autosave with live save-status indicator
*Changed: 2026-04-19*
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

Replaced the manual "Save Changes" button with autosave:
- Debounced **800 ms** after edits settle; in-flight saves are awaited before the next one kicks off.
- Bottom-panel status cycles "Saving…" → "Saved · HH:MM" → "Unsaved changes" → "Save failed · [Retry]"; idle empty-state shows "Changes save automatically".
- `flushPendingSave` awaits any pending/in-flight save before `handleSelectLesson` / `handleCloseClick` proceeds, so nav can't drop edits.
- `beforeunload` guard when a save is pending or in-flight.
- Removed the old "Unsaved Changes" dialog — autosave + flush-on-navigate make it redundant.

## Home

### 65. Non-blocking Wordle win celebration for logged-in users
*Changed: 2026-04-18*
**File:** `src/components/home/GameOfTheDay.jsx`

Replaced the blocking `AchievementDialog` for logged-in users with a toast ("🎉 Solved in N tries!" + streak subtitle) plus a compact inline footer inside the Wordle modal: "🔥 N-day streak" chip on the left, "Share" button on the right. Guests still see the "Create Account to track your streak" dialog — the feature is exactly what's being pitched.

## MCQ bulk import — Grade 4 + College 1–4

### 66. Imported 590 MCQ questions across 59 lessons
*Changed: 2026-04-19*
**Source:** `/Users/nelle/My Drive/000 Serial Disruptors/Books/MCQ/{Grade 4, 1st..4th Year College} MCQ/*.pdf`
**Target:** `lesson_content.sections` (Supabase)

| Scope | Lessons | Items | Mapping notes |
|---|---|---|---|
| Grade 4 | 12 | 120 | direct `s01→L1` … `s12→L12` |
| College Y1 | 9 | 90 | milestones at L4/L8/L12 skipped; `s01→L1, s02→L2, s03→L3, s04→L5, s05→L6, s06→L7, s07→L9, s08→L10, s09→L11` |
| College Y2 | 14 | 140 | direct |
| College Y3 | 12 | 120 | 11 PDFs `s01→L1 … s11→L11`; **10 MCQs generated** for L12 ("Building and Nurturing a Team") from lesson title + objectives |
| College Y4 | 12 | 120 | direct |
| **Total** | **59** | **590** | — |

Each import appends an MCQ activity section shaped as `{id: "activity-<key>-l<N>-mcq", type: "activity", activity_type: "mcq", title: "Assessment Quiz", items: [10 × {question, options[4], correct_answer_index}]}`. Five parallel agents parsed the PDFs into per-year JSON; consolidated into 5 DO-block SQL upserts that strip any prior MCQ activity before appending, so reruns are idempotent.

Grades 5–12 and milestone lessons were skipped per spec (grades 5–12 already had MCQs imported in the earlier session).

## Verification

```sql
WITH mcq AS (
  SELECT year_level_key, lesson_number, s AS sec
  FROM lesson_content, jsonb_array_elements(sections) s
  WHERE s->>'activity_type' = 'mcq'
)
SELECT year_level_key,
       COUNT(*) AS lessons_with_mcq,
       SUM(jsonb_array_length(sec->'items')) AS total_items
FROM mcq
WHERE year_level_key IN ('grade-4','college-1','college-2','college-3','college-4')
GROUP BY year_level_key;
```

Result: grade-4 12/120, college-1 9/90, college-2 14/140, college-3 12/120, college-4 12/120. Matches the import plan exactly.

## Deployment

- Commit `2144c97` ("Classroom, Viewer, and MCQ quiz improvements") pushed to `main`. The GitHub→Vercel webhook did not fire automatically; direct `vercel --prod` from the freshly fast-forwarded main repo produced deployment `dpl_4YLMsKE7KLdxieor4Dy2oAkikLeQ` — state `READY`, `githubCommitSha: 2144c97`, production. Prod: https://startupreneurship-app.vercel.app.
- The MCQ bulk-import changes are Supabase-only; no rebuild needed — the existing production build reads the new activity sections at runtime.

## Files touched

| File | Change |
|---|---|
| `src/pages/Viewer.jsx` | Resume-at-saved-step, `?activity=mcq` shortcut, mark-completed on MCQ submit, MCQ in-progress coordination + leave-confirm dialog, callback ref for `<main>` |
| `src/components/viewer/MCQActivity.jsx` | Past-result view + retake info + attempt history; locked set, hidden per-item feedback, 10-min timer, leave-confirm hooks, Rules-of-Hooks refactor |
| `src/components/viewer/LessonRenderer.jsx` | `studentProgress` + `lessonAccess` + `mcqSubmitRef` + `onMcqInProgressChange` props wired to MCQ; `w-full` section wrappers for iframe width; `kind: "mcq"` signal on MCQ onComplete |
| `src/components/classroom/LessonsTab.jsx` | Action buttons (Start/Resume/Review/Retake/Locked), compact completed card, Reset Progress + password guard, drop Lesson 0 badge and counts |
| `src/components/classroom/LessonManagementDialog.jsx` | Auto-announcement with lesson number on unlock; `author_id: null` |
| `src/components/portal/LessonManagementTab.jsx` | Auto-announcement on unlock *transition only*; `author_id: null` |
| `src/components/classroom/ClassroomHeader.jsx` | Single-row meta layout |
| `src/components/classroom/AnnouncementsSection.jsx`, `StudentListSection.jsx`, `src/components/ui/BrandTabs.jsx`, `src/pages/ClassroomView.jsx` | Spacing polish; Dashboard → Home for students |
| `src/components/admin/CourseEditorFullscreen.jsx` | Autosave + status indicator + flush-on-navigate + beforeunload; removed Unsaved-Changes dialog |
| `src/components/home/GameOfTheDay.jsx` | Non-blocking toast + inline stats for logged-in winners |
| `src/index.css` | `.video-embed-wrapper iframe` reset (border/radius/aspect-ratio/margin) |
| `student_lesson_progress` (Supabase) | +11 progress columns, +`retake_attempts` |
| `announcements` (Supabase) | +`is_auto_announcement`, +`metadata` |
| `lesson_content` (Supabase) | +59 MCQ activity sections (grade-4 + college-1/2/3/4); removed 3 empty "Review Questions:" placeholder sections (college-1 L10, college-2 L1, college-4 L1) |

## Possible follow-ups (not done)

- **Persist locked question set across refresh.** The `useMemo` seed is session-only; a hard refresh mid-quiz re-randomizes. Persist selected question IDs + current index + answers to the DB so a refresh resumes the same attempt.
- **Count mid-quiz exit as a `retake_attempts` increment.** Currently abandoning a quiz is a "free" attempt.
- **Investigate GitHub→Vercel webhook.** The auto-deploy didn't fire on this session's push to main; `vercel --prod` had to run manually. Worth re-verifying the git integration in the Vercel dashboard.
- **Dedupe `student_lesson_progress` rows.** `goNext`'s autosave does filter-then-create without a unique key, so multiple in-progress rows accrue per student/lesson over time. Observed during testing. A `(classroom_id, student_id, year_level_key, lesson_number)` unique constraint + proper upsert would fix it cleanly.
- **Persist MCQ per-question answers** so the past-result review can show what the student actually picked for each item (currently only the final score history is stored, not per-question answers for past attempts).

---

# Course Builder & Viewer — Change Log

**Date:** 2026-04-19
**Session window:** ~13:10 – 13:52 PST
**Session:** course builder + lesson viewer review and improvements.

## Critical bug fixes

### 1. Builder-created MCQ activities didn't render in the viewer
*Changed: 2026-04-19 ~13:18 PST*
**File:** `src/components/viewer/LessonRenderer.jsx`

`MCQActivity` reads `q.q` and `q.answer`, but the builder saves `{question, correct_answer_index}`. The previous adapter only renamed the outer wrapper, not the inner fields — so the question text was blank and every answer was marked wrong.

Added a `toViewerQuestion` mapper that normalizes both legacy `items` entries and the flat builder shape to `{q, options, answer}`.

### 2. Builder-created Micro-Validation activities didn't render
*Changed: 2026-04-19 ~13:22 PST*
**File:** `src/components/viewer/LessonRenderer.jsx`

`MicroValidationActivity` expects `{q, options: [{text, explanation}], correct_answer}`. The builder saves flat `{question, options: [string], correct_answer_index, correct_answer_explanation}`.

Added normalization that:
- Maps `question` → `q`, `correct_answer_index` → `correct_answer`.
- Wraps each string option into `{text, explanation}`.
- Uses `correct_answer_explanation` for the correct option and surfaces a hint on wrong options so students always see feedback.

### 3. Activity gating was disabled — students could skip MCQs
*Changed: 2026-04-19 ~13:26 PST*
**File:** `src/pages/Viewer.jsx`

`getSteps` tagged every DB section as `type: "content"`, so `isActivity` was always false, `activityReady` was always true, and the Next button never required activity completion.

- `getSteps` now tags activity sections with `type: "activity"` and carries `activity_type` forward.
- `renderStep`'s default branch now routes both `"content"` and `"activity"` step types through `LessonRenderer`.

Students can no longer skip past an MCQ without answering. The existing "Skip" link for admins/facilitators still works.

### 4. Phantom "Unsaved changes" on load
*Diagnosed and fixed: 2026-04-19 ~13:45 PST*
**Files:**
- `src/components/admin/McqActivityBuilder.jsx`
- `src/components/admin/MicroValidationActivityBuilder.jsx`

Both builders kept a local `useState` copy of activity fields and had a mount-time `useEffect` that wrote them back into the parent section. Any field absent from the saved DB section (e.g. `correct_answer_explanation`) got injected as a default (`""`, `0`, `["","",""]`) on mount — making `sections` diverge from `initialSections` and lighting up the "Unsaved changes" banner with no user action.

Refactored both components to be fully controlled: read from `activity` props, write directly via `updateSection`. No local state, no sync-back effect, no phantom writes.

> Note: `McqActivityBuilder` was subsequently extended (outside this refactor) into a pool-based editor that stores up to 10 questions in `activity.items` and shows students 5 random ones. The controlled pattern carried through — it still reads from and writes directly to `activity.items`.

## UX polish

### 5. No more dummy default sections
*Changed: 2026-04-19 ~13:30 PST*
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

Opening an empty lesson used to inject a placeholder `"New Section"` + `"New MCQ Activity"`. Now it starts with an empty sections list so there's no clutter or stale empty-question warning.

### 6. Empty-state UI for sections
*Changed: 2026-04-19 ~13:36 PST*
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

When a lesson has no sections, a dashed-border card explains what to do next and offers three quick-add buttons (Text, Image, Video), instead of showing blank space under the heading.

### 7. Delete confirmation for sections and lessons
*Changed: 2026-04-19 ~13:33 PST*
**File:** `src/components/admin/CourseEditorFullscreen.jsx`

Added a `confirmDelete` state and a second `AlertDialog`. Section and lesson trash icons now open a confirmation dialog that names the item and warns the action can't be undone. The Delete button is styled destructive (red).

## Files touched

| File | Change |
|---|---|
| `src/components/viewer/LessonRenderer.jsx` | MCQ + Micro-Validation data-shape adapters |
| `src/pages/Viewer.jsx` | Activity-step tagging + gating routing |
| `src/components/admin/CourseEditorFullscreen.jsx` | No default sections, empty state, delete confirmation |
| `src/components/admin/McqActivityBuilder.jsx` | Stateless/controlled rewrite (later extended to pool editor) |
| `src/components/admin/MicroValidationActivityBuilder.jsx` | Stateless/controlled rewrite |

## Verification
*Performed: 2026-04-19 13:40 – 13:51 PST*

Manual verification in the running dev server (`vite-dev` preview):

- Loaded `CourseBuilder?yearLevel=grade-4`, cycled through Course Details + Lessons 1–12: "Unsaved changes" banner stayed off at every step.
- Added an MCQ section → banner correctly turned on.
- Typed a question and Option A → values persisted through the stateless refactor (read-back confirmed) and the banner remained on.
- Clicked the section trash icon → delete confirmation dialog appeared, Cancel dismissed it.
- Opened an empty lesson → empty-state card rendered with its quick-add buttons.
- Loaded `Viewer?yearLevel=grade-4&lesson=1` → rendered without console errors.

Only warnings observed were pre-existing `findDOMNode` deprecations from `react-quill` — unrelated to these changes.

## Possible follow-ups (not done)

- **Random pool sampling in the viewer.** The new pool-based `McqActivityBuilder` tells the author "students answer 5 random questions from this pool," but `LessonRenderer` passes the pool to `MCQActivity` in storage order. Add a one-time random sample (seeded or unseeded) before rendering.
- **Preview button uses DB data.** Clicking "Preview" in the builder opens `Viewer` in a new tab reading from DB, so unsaved edits aren't reflected. A save-before-preview prompt (or live preview via state) would remove the surprise.
- **Quill image toolbar button.** Embeds base64 images inline, which can bloat `sections` JSON quickly. Consider disabling or wiring to an upload endpoint.
- **MicroValidation "Continue" button.** The activity has its own Continue that sets `activityDone` but doesn't advance; the footer Next is what advances. Either remove the inner button or have it call next directly.

---

# Base44 → Supabase Migration & Platform Build

**Session window:** ~April 2026 (multi-session marathon preceding 2026-04-18; exact start date not recorded in transcript).
**Session:** full platform build — GitHub + Vercel setup, Base44 → Supabase migration, auth overhaul, course builder/viewer, K-College content import, UX polish.

## Infrastructure & Setup

### 9. Initialize Git repo, push to GitHub, deploy to Vercel
*Changed: session start*
**Files:** repo root, `.claude/launch.json`

First-time setup. Authenticated `gh` CLI, created `https://github.com/nelle3549/startupreneurship-app`, pushed initial commit, deployed to `https://startupreneurship-app.vercel.app`. Added `.claude/launch.json` for IDE-launched Vite dev server. Early builds warned about `VITE_BASE44_APP_BASE_URL` — rendered moot by the migration below.

### 10. Create Supabase project and provision 23-table schema
*Changed: early session*
**Target:** Supabase project `dtyvpzjbyqyipwkhjfsm` (ap-southeast-1, free tier)

Created the "Startupreneurship" Supabase project and applied migrations for 23 tables with RLS policies plus a `handle_new_user` trigger that auto-creates `public.users` rows from `auth.users`.

## Migration: Base44 → Supabase

### 11. Add Supabase client + Base44-shaped entity abstraction
*Changed: Phase 3 of migration*
**Files:** `src/api/supabaseClient.js` (new), `src/api/entities.js` (new), `src/contexts/AuthContext.jsx`, `src/hooks/useCurrentUser.jsx`

Installed `@supabase/supabase-js` and built `entities.js` — a proxy that mimics the Base44 SDK's `.filter/.create/.update/.delete/.list` API on top of Supabase. The abstraction was the key decision: 40+ component files stayed untouched during the backend swap. `AuthContext` now uses `supabase.auth.onAuthStateChange`.

### 12. Remove all Base44 dependencies
*Changed: later in session*
**Files:** deleted `src/api/base44Client.js`, `src/lib/app-params.js`, `src/components/NavigationTracker.jsx`, `base44/functions/*`; bulk-updated 40+ component files

Uninstalled `@base44/sdk` and `@base44/vite-plugin`. Used `sed` to bulk-replace `base44.entities.` → `entities.` across the repo. Hand-fixed residual `base44.auth.logout`, `base44.functions.invoke`, and dynamic `base44.entities[x]` references. Final grep confirms zero Base44 references.

## Authentication & Onboarding

### 13. Switch login from multi-provider OAuth to email/password only
*Changed: mid-session*
**Files:** `src/components/auth/LoginSignup.jsx` (rewritten), `src/contexts/AuthContext.jsx`

Removed Google/Microsoft/Facebook/Apple OAuth buttons. New form: email + password + confirm-password with a Sign In / Create Account toggle. Password policy (sign-up only): min 8 chars, at least one letter + one number. Added `onCancel` close-X for dialog contexts.

### 14. Disable email confirmation via auto-confirm trigger
*Changed: mid-session*
**Target:** Supabase migration

Added a SQL trigger that sets `auth.users.email_confirmed_at` on insert so new accounts can sign in without a confirmation click.
**Caveat:** the trigger fires *after* Supabase tries to send the email, so free-tier rate limits (3/hr) still block sign-ups. The proper fix is Dashboard → Auth → Providers → Email → "Confirm email" OFF. Transcript doesn't confirm this toggle was flipped.

### 15. Public Home landing, protected routes behind RequireAuth
*Changed: mid-session*
**Files:** `src/App.jsx` (rewritten), `src/pages/Home.jsx`, `src/hooks/useNotifications.jsx`

Home is now the public landing page. Top-right "Get Started" button (red/orange gradient) replaces the old Account Settings link for guests. Portal, Admin, ClassroomView, and Viewer gate behind `RequireAuth`. `useCurrentUser` and `useNotifications` now crash-safe for unauthenticated visitors. Added public RLS read policies on home-content tables.

### 16. Make CompleteProfileDialog mandatory and unskippable
*Changed: mid-session*
**Files:** `src/components/onboarding/CompleteProfileDialog.jsx`, `src/components/ui/dialog.jsx`

Removed "Skip for now" button, close-X, Escape handling, and outside-click dismissal. Added `hideCloseButton` prop on shared shadcn `DialogContent`. Fires immediately after sign-up (`onboarding_completed` defaults false) and re-appears on every visit until completed.

### 17. Critical fix: `user_accounts` FK mismatch (auth.users.id vs public.users.id)
*Changed: mid-session*
**Files:** `src/hooks/useCurrentUser.jsx` (rewritten), Supabase schema

`useCurrentUser` was inserting `user_id: authUser.id` (the auth UUID) where the FK expected `public.users.id` (a different UUID). Every insert silently failed, so `userAccount` was always `null` and `CompleteProfileDialog` never opened. Fix: resolve `public.users` by email first, then insert. Dropped the FK to keep inserts non-blocking. Globally override `user.id` in the merged object to `public.users.id` so all downstream comparisons (`facilitator_id === user.id`, `student_id === user.id`) work; original auth id stays as `user.auth_id`.

### 18. Open Sign Up (not Sign In) by default from Get Started / Wordle completion
*Changed: mid-session*
**Files:** `src/components/auth/LoginSignup.jsx`, `src/pages/Home.jsx`, `src/components/home/GameOfTheDay.jsx`

Added `defaultSignup` prop. `Home`'s Get Started and the Wordle `GuestStreakDialog` "Create Account" path pass `true`. `RequireAuth` keeps the default (Sign In) since protected-route hits usually have accounts already.

### 19. Fix admin approve/reject and self-delete flow
*Changed: mid-session*
**Files:** `src/components/admin/UserActionDialog.jsx`, `src/components/admin/Users.jsx`, `src/pages/AccountSettings.jsx`; Supabase RLS

Three bugs in one: (a) Approve/reject tried to update `facilitator_status` on `public.users` but that column lives on `user_accounts`. Split the mutation per table. (b) Existing RLS restricted UPDATE/DELETE on `public.users` to `auth_id = auth.uid()`, blocking admins. Added role-based admin policies. (c) Self-delete in AccountSettings called `localStorage.clear()` *before* the `delete-user-and-data` Edge Function, wiping the JWT and causing 401. Reordered: invoke → clear → signOut → redirect.

### 20. Deploy `delete-user-and-data` Supabase Edge Function
*Changed: mid-session*
**Target:** Supabase Edge Function `delete-user-and-data`

Server-side cascade delete: transfers owned classrooms to an admin, removes enrollments/progress/activity/evaluator rows, deletes `user_accounts`, logs to `deleted_user_log`, deletes `public.users`, then `auth.users`. Supports self-delete (caller JWT) and admin-delete (`{targetUserId}` body, admin role verified).

## Course Builder & Viewer

### 21. Collapse section types from 6 → 4 (Content absorbs Image/Video)
*Changed: mid-session*
**Files:** `src/components/courseBuilder/CourseEditorFullscreen.jsx`, `src/components/viewer/LessonRenderer.jsx`

Initially added Image, Video, Callout as dedicated types. UX feedback said 6 buttons was too much; simplified to **Content, Callout, MCQ, Micro Validation**. Images and videos now live inside Content via Quill's toolbar. Migrated existing `type: "image"`/`type: "video"` rows by prepending `<img>`/`<iframe>` into `content` HTML and retyping to `text`.

### 22. Install `@tailwindcss/typography` so `prose` actually works
*Changed: mid-session*
**Files:** `tailwind.config.js`, `src/index.css`, `src/components/viewer/LessonRenderer.jsx`

Root cause of "formatting isn't reflected in the viewer": the `prose` class was inert because the plugin was never installed — bold, italic, headings, lists, blockquotes, tables, links all rendered as plain text. Installed plugin and added brand prose overrides (h1–h3 `#0B5394`, blue blockquote border).

### 23. Extend Quill Video blot to accept Google Drive URLs; fix iframe rendering
*Changed: late session (commit `3fcda71`)*
**Files:** `src/components/courseBuilder/CourseEditorFullscreen.jsx`, `src/components/viewer/LessonRenderer.jsx`, `src/index.css`

Quill's default Video blot rejected GDrive embeds. Subclassed to accept any URL. Added `processContent()` in `LessonRenderer` that post-processes HTML to add `allow="autoplay; encrypted-media"` on iframes and wraps `ql-video` in a 16:9 responsive container. Affected 57 GDrive embeds already in DB.

### 24. Add Milestone section type with independent numbering
*Changed: mid-session*
**Files:** `src/components/courseBuilder/CourseEditorFullscreen.jsx`, `src/data/courseData.jsx`; `lesson_content.type` column

Two buttons: "+ Lesson" (blue) and "+ Milestone" (amber). Sidebar shows "Lesson N" / "Milestone N" with separate counters. DB column stores `"lesson"` | `"milestone"`. College Y1 restructured so milestones sit at positions 4, 8, 12 between lesson triads.

### 25. Replace builder preview with the real Viewer route
*Changed: late session (commits `03d5657`, `8a645fe`)*
**File:** `src/components/courseBuilder/CourseEditorFullscreen.jsx`

Evolved through three iterations: `<a target="_blank">` → `window.open()` → custom step-by-step PreviewModal → final form: Preview button (footer, next to Close/Save) saves if dirty, then opens the real `/Viewer` route in a new tab. Builder preview now matches student experience byte-for-byte.

### 26. MCQ: 10-question pool with per-attempt 5-question randomization
*Changed: late session (commit `4bec432`)*
**Files:** `src/components/courseBuilder/McqActivityBuilder.jsx` (rewrite), `src/components/viewer/activities/MCQActivity.jsx`, `src/components/viewer/LessonRenderer.jsx`

Builder accepts up to 10 pooled questions with completion indicators and a <5-question warning. Viewer Fisher-Yates-shuffles and picks 5 per attempt; "Retake with New Questions" reshuffles so each attempt is unique.

### 27. Preserve classroom tab when returning from Viewer
*Changed: late session (commit `b7fc1d3`)*
**Files:** `src/pages/Viewer.jsx`, `src/components/classroom/LessonsTab.jsx`, `src/components/announcements/AnnouncementCard.jsx`

Viewer's "Classroom" button always returned to Announcements. Added a `returnTab` URL param propagated from the opening page and honoured by both the back-link and Mark-as-Complete redirect.

## Content Import

### 28. Upload lesson images and import 193 lessons / 1,736 sections
*Changed: late session*
**Target:** Supabase storage bucket `lesson-images`, `lesson_content` table

Uploaded Grade-1 (~90), College (~270), and full K-12 + Grade 7-12 image sets. Imported lesson content parsed from `/Users/nelle/My Drive/000 Serial Disruptors/Books/Book-HTML/`:

| Scope | Lessons | Sections |
|---|---|---|
| Grades 1–12 | 156 | 1,395 |
| College Y1 (with milestones) | 12 | 118 |
| College Y2 | 14 | 178 |
| College Y3 | 11 | 139 |
| College Y4 | 12 | 156 |
| **Total** | **193** | **1,736** |

College Y2–Y4 initially imported 0 sections because the College HTML uses `<section>` without the `class="section-block"` selector the parser expected, and anon-key PATCHes couldn't SELECT through RLS to verify matches. Fixed with a temporary anon SELECT policy, re-imported, reverted. Grade 1 and College Y1 were wiped and re-imported to capture previously-missed GDrive videos.

### 29. Add missing DB columns discovered during import/CRUD
*Changed: throughout*
**Target:** Supabase schema

Base44 accepted arbitrary fields; Supabase rejects unknown columns. Multiple `ALTER TABLE` migrations added:
- `classrooms`: `school`, `school_year`
- `announcements`: `author_avatar`, `status`, `is_pinned`, `created_date`
- `reactions`: `emoji`, `user_name` (dropped old unique constraint)
- `course_details`: `quoteAuthor`
- `lesson_content`: `sections` (jsonb), `lesson_objectives` (jsonb), `type`
- `coursewares`: `lessons` (jsonb), `quote`, `quoteAuthor`, `objectives` (jsonb), `order`

### 30. Seed Home content tables with 30 entries
*Changed: mid-session*
**Target:** Supabase data

Added 5 entries each across Funding, Competitions, Articles, Games, Quotes, and Archived (DOST-SETUP, IdeaSpace Challenge, Lean Startup, PITCH, Peter Drucker quotes, etc.).

## UX Polish

### 31. Wordle in viewport-fitting floating dialog
*Changed: mid-session*
**File:** `src/components/home/GameOfTheDay.jsx`

Full-screen dialog, darkened backdrop, compact mobile-first grid (`w-10 h-10` mobile, `w-12 h-12` desktop), on-screen keyboard fully visible. No scrolling on mobile.

### 32. Fix toast system: auto-dismiss + sane limits
*Changed: mid-session*
**Files:** `src/hooks/use-toast.jsx`, `src/components/ui/use-toast.js`

Original shadcn defaults were `TOAST_LIMIT=20` and `TOAST_REMOVE_DELAY=1000000` (~16 min) with no auto-dismiss — toasts stacked and persisted forever. Fixed to limit 3, auto-dismiss on add, 2-second removal.

### 33. Cap Select dropdown at 40vh to prevent modal overflow
*Changed: mid-session (commit `e2d0faa`)*
**File:** `src/components/ui/select.jsx`

Radix Select Viewport had no max height, so long option lists (e.g. school picker) overflowed modals and became unclickable on smaller screens. Added `max-h-[40vh]` globally.

### 34. Clipboard copy fallback for non-HTTPS contexts
*Changed: mid-session*
**File:** `src/components/classroom/ClassroomHeader.jsx`

`navigator.clipboard.writeText` throws silently on non-HTTPS or unfocused tabs. Added hidden-textarea + `document.execCommand("copy")` fallback so enrollment-code copy works everywhere.

### 35. Remove QR-scan enrollment option
*Changed: mid-session*
**Files:** Student form components

Enrollment is now a plain text-input flow — removed the code-method toggle, QR scanner placeholder, and `QrCode` import.

### 36. Move Admin stats cards inside Users tab
*Changed: mid-session (commit `995637c`)*
**File:** `src/pages/Admin.jsx`

Guest/Student/Facilitator count cards were rendering on every admin tab. Scoped to Users tab only. Removed the meaningless "pending: —" badge on Students.

### 37. Sync AccountSettings form with DB `user_accounts`
*Changed: mid-session (commit `0c53fee`)*
**File:** `src/pages/AccountSettings.jsx`

Form was reading from `getSavedUser()` (localStorage) which was stale/empty — DB profile never hydrated. Replaced with a `useEffect` keyed off `authUser.account_id` that resets the form when the merged user object updates.

### 38. Rename "Province" → "Region" in profile dialog
*Changed: mid-session*
**File:** `src/components/onboarding/CompleteProfileDialog.jsx`

Label/placeholder only; underlying DB column stays `province`.

### 39. Three always-visible reaction buttons on announcements
*Changed: mid-session (commit `7e0610f`)*
**Files:** `src/components/announcements/AnnouncementCard.jsx`, `src/components/announcements/ReactionButton.jsx`

Replaced the single `➕` emoji picker with three fixed buttons: 👍 Approve, 👎 Disapprove, 🚀 Rocket. Live counts; brand-gradient highlight when the user has reacted; toggling off deletes the reaction row.

### 40. Branding and favicon
*Changed: Phase 1*
**Files:** `public/favicon.svg`, `index.html`, `public/manifest.json`, `vercel.json`, `README.md`

Favicon, page title "Startupreneurship", OG tags, manifest, and `vercel.json` SPA rewrite so client-side routes don't 404.

## Files touched

| File | Change |
|---|---|
| `src/api/supabaseClient.js` | New — Supabase JS client |
| `src/api/entities.js` | New — Base44-shaped abstraction over Supabase |
| `src/api/base44Client.js`, `src/lib/app-params.js`, `src/components/NavigationTracker.jsx`, `base44/functions/*` | Deleted |
| `src/contexts/AuthContext.jsx` | Rewritten for Supabase auth |
| `src/hooks/useCurrentUser.jsx` | Rewritten — resolves `public.users.id` correctly |
| `src/hooks/useNotifications.jsx` | Crash-safe for unauth users |
| `src/hooks/use-toast.jsx` | Auto-dismiss + sane limits |
| `src/App.jsx` | Public Home + `RequireAuth` gate |
| `src/pages/Home.jsx` | Get Started opens LoginSignup in sign-up mode |
| `src/pages/AccountSettings.jsx` | DB-synced form, Edge Function delete |
| `src/pages/Admin.jsx` | Stats scoped to Users tab |
| `src/pages/Portal.jsx`, `src/pages/ClassroomView.jsx` | Use `public.users.id` |
| `src/pages/Viewer.jsx` | `returnTab` URL param; `processContent` iframe handling |
| `src/components/auth/LoginSignup.jsx` | Email/password only, password policy, `defaultSignup` prop |
| `src/components/onboarding/CompleteProfileDialog.jsx` | Mandatory, unskippable; Region label |
| `src/components/admin/UserActionDialog.jsx`, `Users.jsx` | Admin delete via Edge Function; split mutation |
| `src/components/admin/AdminContentTab.jsx`, `CreateAccountDialog.jsx` | Dynamic `entities[key]` |
| `src/components/classroom/ClassroomHeader.jsx` | Clipboard fallback |
| `src/components/classroom/LessonsTab.jsx`, `ClassroomsTab.jsx` | `returnTab`; schema-aligned create |
| `src/components/home/GameOfTheDay.jsx` | Floating Wordle dialog; sign-up default |
| `src/components/announcements/*` | 3 reaction buttons; returnTab; schema-aligned |
| `src/components/courseBuilder/CourseEditorFullscreen.jsx` | Milestone type, 4-button section UI, Quill GDrive blot, Preview→real Viewer |
| `src/components/courseBuilder/McqActivityBuilder.jsx` | 10-question pool |
| `src/components/viewer/LessonRenderer.jsx` | `processContent()` iframes, prose styling |
| `src/components/viewer/activities/MCQActivity.jsx` | 5-of-10 random per attempt |
| `src/components/ui/dialog.jsx` | `hideCloseButton` prop |
| `src/components/ui/select.jsx` | `max-h-[40vh]` on Viewport |
| `src/data/courseData.jsx` | Milestones at 4/8/12 for College Y1 |
| `src/index.css` | Prose + video-embed-wrapper styles |
| `tailwind.config.js` | `@tailwindcss/typography` plugin |
| `vercel.json`, `index.html`, `public/favicon.svg`, `public/manifest.json` | Branding + SPA rewrite |
| `documentation.md` | New — full project documentation |
| Supabase — `delete-user-and-data` | New Edge Function |
| Supabase schema | 23 tables; column additions, RLS revisions, auto-confirm trigger |

## Possible follow-ups

- **Disable email confirmation in Supabase Dashboard** — the auto-confirm trigger fires *after* Supabase attempts the send, so free-tier rate limits (3/hr) still block sign-ups. Transcript doesn't confirm the dashboard toggle was flipped.
- **Enable Google OAuth** (if ever re-adding) — redirect URL `https://dtyvpzjbyqyipwkhjfsm.supabase.co/auth/v1/callback`. Currently email/password only.
- **Restore FK constraints** on `classrooms.facilitator_id` and `user_accounts.user_id` once all ID-mismatch bugs are confirmed resolved.
- **Audit the temporary anon SELECT policy** on `lesson_content` (added for College Y2-Y4 import, then reverted) — worth confirming the revert was complete.
- **Portal / Analytics end-to-end** — both pages hung during the button audit (likely preview timeout, not a real bug, but unverified).
- **Orphaned data cleanup** — `nellejuly@gmail.com` existed in `public.users` without an `auth.users` row; similar orphans may exist. One-time reconciliation job would help.
- **Integration tests for Classrooms / Portal** — UUID-mismatch bugs that landed this session weren't caught by any test; a minimal integration harness would prevent regressions.
- **Node.js system-wide** — dev server required downloaded-to-`/tmp` Node during the session. Permanent `nvm`/Homebrew install would be cleaner.
- **2 of 4 user accounts** had no `user_accounts` row at audit time and will hit the mandatory profile dialog on next login per the fix — expected behaviour, just a heads-up.

---

# MCQ Bulk Import — Change Log

**Date:** 2026-04-18
**Session:** bulk import of MCQ assessment quizzes for Grades 5–12 from source PDFs into Supabase.

## What shipped

### 8. Imported 960 MCQ questions across 96 lessons
*Changed: 2026-04-18*
**Scope:** Grades 5–12, 12 lessons each = 96 lessons × 10 questions.
**Source:** `/Users/nelle/My Drive/000 Serial Disruptors/Books/MCQ/Grade {5..12} MCQ/*.pdf`
**Target:** `lesson_content.sections` (Supabase `Startupreneurship` project, `dtyvpzjbyqyipwkhjfsm`).

Appended a new activity section to every lesson with shape:

```json
{
  "id": "activity-<year_level_key>-l<lesson>-mcq",
  "type": "activity",
  "activity_type": "mcq",
  "title": "Assessment Quiz",
  "question": "", "options": ["","","",""], "correct_answer_index": 0,
  "items": [ 10 × {question, options[4], correct_answer_index} ]
}
```

The legacy top-level `question`/`options`/`correct_answer_index` fields are retained (empty) for compatibility with the pre-pool MCQ renderer.

### Parser pipeline
Built a Python script (`tmp/parse_mcq.py`, local tooling only, not committed) that:

1. Extracts text per PDF via `pypdf`, strips C0 control-byte glyphs used as list-bullets.
2. Splits each document into questions + answer-key halves on the `Answer Key` marker.
3. Locates `a)`/`b)`/`c)`/`d)` option markers (bullet-prefixed `◦ a)` or bare `a)` format — both occur across grades) and pairs them into 10 option quartets.
4. Determines the d-option → next-question boundary with a two-pass heuristic:
   - **Pass 1:** require the question's first word to be a recognized sentence-starter (What/Who/Which/The/According/etc.).
   - **Pass 2:** relax starter requirement, cap d-option at 8 words, use sibling (a/b/c) option word counts as a length hint to pick the best split.
5. Parses the answer key and maps letters (a/b/c/d) to indices 0–3.

Four compound-noun edge cases (e.g. "Value Proposition", "Corporate Social Responsibility") that no heuristic could disambiguate are handled by an `OVERRIDES` dict keyed on `(year_key, lesson, question_idx)`.

Final parse: 96/96 lessons, 960/960 questions, 0 empty fields.

### SQL upsert
The UPDATE uses `jsonb_agg` filtered by `s->>'activity_type' IS DISTINCT FROM 'mcq'` to strip any existing MCQ section before appending the new one, so reruns are idempotent. 24 batches of 4 statements each, ~280 KB total SQL executed via Supabase MCP.

## Incident: Grade 5 Lesson 1 content loss
*Noted: 2026-04-18*

The initial version of the UPSERT SQL used `WHERE NOT (s->>'activity_type' = 'mcq')`. For sections without an `activity_type` key, `s->>'activity_type'` is NULL; `NULL = 'mcq'` is NULL, `NOT NULL` is NULL, so every pre-existing non-activity section was filtered out. The first test run (grade-5 lesson 1) wiped 9 text sections from both duplicate rows before the bug was spotted.

**Fix:** switched to `s->>'activity_type' IS DISTINCT FROM 'mcq'`, which treats NULL as "not equal to 'mcq'" and keeps those rows.

**Damage:** limited to grade-5 lesson 1 (two duplicate rows, each holding only the MCQ section after the incident). All other 95 lessons retained their original content — the corrected WHERE clause appended the MCQ section cleanly.

**Not restored.** Supabase free tier has no PITR. Source content exists in `src/components/data/lessonContent/grade-5.json.jsx` and the source HTML at `Books/Book-HTML/K12/Grade 5/G5 Lesson (1).html`; reconstructing the DB section array from either is a follow-up.

## Data issues surfaced (not fixed)

- **Duplicate `lesson_content` rows for grades 2–5.** The seed script ran twice on 2026-04-18 (01:09 and 02:18 UTC), leaving two rows per lesson with identical content. The MCQ upsert targets both rows by `year_level_key + lesson_number`, so both got the same MCQ section — behaviour is consistent regardless of which row the app reads, but a dedupe pass is worth doing.
- **Minor parsing artifacts in ~10 questions:** stray space before `?` (e.g. `BMC ?`, `VC ?`), dropped opening parens in abbreviations (`CSR)`, `PR )`). Answer correctness unaffected; cosmetic only.

## Verification

```sql
SELECT year_level_key,
  COUNT(*) FILTER (WHERE mcq_count = 1) AS lessons_with_mcq,
  COUNT(*) FILTER (WHERE mcq_count = 0) AS missing,
  SUM(mcq_items) AS total_questions
FROM (
  SELECT lc.year_level_key, lc.lesson_number,
    (SELECT COUNT(*) FROM jsonb_array_elements(sections) s WHERE s->>'activity_type' = 'mcq') AS mcq_count,
    (SELECT jsonb_array_length(s->'items') FROM jsonb_array_elements(sections) s WHERE s->>'activity_type' = 'mcq' LIMIT 1) AS mcq_items
  FROM lesson_content lc
  WHERE year_level_key IN ('grade-5','grade-6','grade-7','grade-8','grade-9','grade-10','grade-11','grade-12')
) t GROUP BY year_level_key;
```

Result: every grade 5–12 lesson has exactly 1 MCQ section with 10 items; 0 missing, 0 duplicated. (Grade 5 counts double due to the pre-existing duplicate rows.)

## Deployment

Redeployed prod via `vercel deploy --prod --yes` even though no frontend code changed — MCQ data is read from Supabase at runtime, so the existing production build already surfaces the new quizzes. Deploy completed in ~32s.

- Prod: https://startupreneurship-app.vercel.app
- Deployment id: `dpl_6WYNBHLGzBj6tyhek3gpc9kvpAkn`

## Files touched

| File | Change |
|---|---|
| `lesson_content` table (Supabase) | Appended MCQ activity section to 96 lessons (grades 5–12) |
| `tmp/parse_mcq.py` | New — PDF-to-JSON MCQ parser (local tooling, not committed) |
| `tmp/build_upsert_sql.py`, `tmp/split_sql_by_grade.py` | New — SQL generators (local tooling, not committed) |
| `tmp/mcq_parsed.json` | New — intermediate structured MCQ data (local tooling, not committed) |

No application source code changed this session.

## Possible follow-ups (not done)

- **Restore Grade 5 Lesson 1 content** from the `.json.jsx` seed or source HTML.
- **Dedupe grades 2–5** `lesson_content` rows (keep earliest by `created_at`).
- **Clean up parsing artifacts** (`BMC ?` → `BMC?`, `CSR)` → `CSR`, etc.) — safest via targeted SQL UPDATEs against the 10 affected items.
- **Port parser to the repo** under `scripts/` if MCQ imports become recurring.
