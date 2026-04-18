import React, { useState } from "react";
import { entities } from "@/api/entities";
import { supabase } from "@/api/supabaseClient";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/useCurrentUser";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCoursewares } from "@/hooks/useCoursewares";
import { Lock, CheckCircle, Clock, Eye, Settings, RotateCcw, Play, ArrowRight, Trash2, AlertTriangle } from "lucide-react";
import LessonManagementDialog from "./LessonManagementDialog";
import ActivityShortcuts from "@/components/viewer/ActivityShortcuts";
import { format } from "date-fns";

function getActionButton(status) {
  switch (status) {
    case "completed":
      return { label: "Review", icon: Eye, variant: "outline" };
    case "in_progress":
      return { label: "Resume", icon: ArrowRight, variant: "gradient" };
    case "retake_in_progress":
      return { label: "Continue Retake", icon: RotateCcw, variant: "gradient" };
    case "retake_requested":
      return { label: "Pending Approval", icon: Clock, variant: "disabled" };
    case "locked":
      return { label: "Locked", icon: Lock, variant: "disabled" };
    default:
      return { label: "Start", icon: Play, variant: "gradient" };
  }
}

function getStatusBadge(status) {
  switch (status) {
    case "completed":
      return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1"><CheckCircle className="w-3 h-3" />Completed</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs gap-1"><Clock className="w-3 h-3" />In Progress</Badge>;
    case "locked":
      return <Badge className="bg-orange-100 text-orange-700 border-0 text-xs gap-1"><Lock className="w-3 h-3" />Locked</Badge>;
    case "retake_requested":
      return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs gap-1"><RotateCcw className="w-3 h-3" />Retake Requested</Badge>;
    case "retake_in_progress":
      return <Badge className="bg-purple-100 text-purple-700 border-0 text-xs gap-1"><RotateCcw className="w-3 h-3" />Retake In Progress</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Not Started</Badge>;
  }
}

function getLessonStatus(lessonNum, lessonAccess, studentProgress) {
  // Lesson 0 is always accessible — no LessonAccess restriction
  if (lessonNum === 0) {
    const prog = studentProgress.find((p) => p.lesson_number === 0);
    if (!prog) return "not_started";
    if (prog.completed) return "completed";
    return "in_progress";
  }

  // Enforce sequential access: all lessons from 1 up to lessonNum must be open
  for (let i = 1; i <= lessonNum; i++) {
    const access = lessonAccess.find((la) => la.lesson_number === i);
    if (!access || !access.is_open) return "locked";
  }

  // All preceding lessons must be completed
  for (let i = 1; i < lessonNum; i++) {
    const prog = studentProgress.find((p) => p.lesson_number === i);
    if (!prog?.completed) return "locked";
  }

  const prog = studentProgress.find((p) => p.lesson_number === lessonNum);
  if (!prog) return "not_started";
  if (prog.status === "retake_requested") return "retake_requested";
  if (prog.status === "retake_in_progress") return "retake_in_progress";
  if (prog.completed) return "completed";
  return "in_progress";
}

function getProgressPct(lessonNum, studentProgress) {
  const prog = studentProgress.find((p) => p.lesson_number === lessonNum);
  if (!prog) return 0;
  if (prog.completed) return 100;
  if (prog.total_steps > 0) {
    return Math.min(95, Math.round((prog.current_step_index / prog.total_steps) * 100));
  }
  return 15;
}

export default function LessonsTab({ classroom }) {
  const { user, isAdmin, isFacilitator } = useCurrentUser();
  const isPrivileged = isAdmin || isFacilitator;
  const { getCourseware } = useCoursewares();
  const yearLevel = getCourseware(classroom.year_level_key);
  const [managingLesson, setManagingLesson] = useState(null);
  const [retakeDialog, setRetakeDialog] = useState(null);
  const [resetDialog, setResetDialog] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");


  const { data: lessonAccess = [], refetch: refetchAccess } = useQuery({
    queryKey: ["lesson-access", classroom.id, classroom.year_level_key],
    queryFn: () =>
      entities.LessonAccess.filter({
        classroom_id: classroom.id,
        year_level_key: classroom.year_level_key,
      }),
  });

  const { data: studentProgress = [], refetch: refetchStudentProgress } = useQuery({
    queryKey: ["student-lesson-progress", classroom.id, user?.id],
    queryFn: () =>
      entities.StudentLessonProgress.filter({
        classroom_id: classroom.id,
        student_id: user?.id,
      }),
    enabled: !!user?.id && !isPrivileged,
  });

  const { data: allStudentProgress = [], refetch: refetchProgress } = useQuery({
    queryKey: ["all-student-lesson-progress", classroom.id],
    queryFn: () =>
      entities.StudentLessonProgress.filter({ classroom_id: classroom.id }),
    enabled: isPrivileged,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["classroom-enrollments-lessons", classroom.id],
    queryFn: () =>
      entities.Enrollment.filter({ classroom_id: classroom.id, status: "approved" }),
    enabled: isPrivileged,
  });

  const { data: courseDetails = null } = useQuery({
    queryKey: ["course-details-lessons", classroom.year_level_key],
    queryFn: () => entities.CourseDetails.filter({ year_level_key: classroom.year_level_key }).then(r => r[0] || null),
  });

  const handleRetakeRequest = async () => {
    if (!retakeDialog) return;
    const { prog, lesson } = retakeDialog;
    if (prog) {
      await entities.StudentLessonProgress.update(prog.id, {
        retake_requested: true,
        status: "retake_requested",
      });
    } else {
      await entities.StudentLessonProgress.create({
        classroom_id: classroom.id,
        student_id: user?.id,
        year_level_key: classroom.year_level_key,
        lesson_number: lesson.num,
        retake_requested: true,
        status: "retake_requested",
      });
    }
    setRetakeDialog(null);
    refetchStudentProgress();
  };

  const handleResetProgress = async () => {
    if (!user?.id) return;
    if (!resetPassword) {
      setResetError("Password required.");
      return;
    }
    setResetError("");
    setResetLoading(true);
    try {
      // Verify password via Supabase — this reissues the session token on success
      // but keeps the user signed in, so there's no disruption.
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: resetPassword,
      });
      if (authError) {
        setResetError("Incorrect password.");
        setResetLoading(false);
        return;
      }
      // Clear all of this student's progress in this classroom (across any prior year_level_key).
      const mine = await entities.StudentLessonProgress.filter({
        classroom_id: classroom.id,
        student_id: user.id,
      });
      await Promise.all(mine.map(p => entities.StudentLessonProgress.delete(p.id)));
      setResetPassword("");
      setResetDialog(false);
      refetchStudentProgress();
    } catch (err) {
      console.error("Failed to reset progress:", err);
      setResetError("Something went wrong. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  if (!yearLevel) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
        <p className="text-sm text-gray-400">Year level not found.</p>
      </div>
    );
  }

  const completedLessons = isPrivileged ? 0 : studentProgress.filter((p) => p.completed && p.lesson_number > 0).length;
  const totalLessons = yearLevel.lessons.length;

  // Lesson 0 state
  const lesson0PrivProgress = allStudentProgress.filter(p => p.lesson_number === 0);
  const lesson0Status = getLessonStatus(0, lessonAccess, studentProgress);
  const lesson0Prog = studentProgress.find(p => p.lesson_number === 0);
  const lesson0Pct = getProgressPct(0, studentProgress);
  const lesson0Color = lesson0Status === "completed" ? "bg-emerald-500" : lesson0Status === "in_progress" ? "bg-blue-500" : "bg-gray-200";

  return (
    <div className="space-y-3">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-3">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{courseDetails?.subtitle || yearLevel.subtitle || yearLevel.bookTitle}</h2>
        <p className="text-sm text-gray-600 mb-3">{yearLevel.summary}</p>
        <div className="flex flex-wrap gap-2 items-center">
          <Badge className="bg-blue-100 text-blue-700 border-0">{yearLevel.grade}</Badge>
          <Badge variant="outline">{totalLessons} lessons</Badge>
          {!isPrivileged && (
            <span className="text-xs text-gray-500 ml-1">
              {completedLessons} / {totalLessons} completed
            </span>
          )}
        </div>
      </div>

      {/* Lesson 0 — Course Overview */}
      {isPrivileged ? (
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-end mb-1.5">
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Always Open</Badge>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">Course Overview</h3>
            <p className="text-xs text-gray-500 mb-3">Introduction, summary, and course objectives — required before Lesson 1</p>
            <div className="flex gap-3 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />{lesson0PrivProgress.filter(p => p.completed).length} done</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />{lesson0PrivProgress.filter(p => !p.completed && p.current_step_index > 0).length} in progress</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />{Math.max(0, enrollments.length - lesson0PrivProgress.filter(p => p.completed).length - lesson0PrivProgress.filter(p => !p.completed && p.current_step_index > 0).length)} not started</span>
            </div>
            <Link to={`/Viewer?yearLevel=${classroom.year_level_key}&lesson=0&classroomId=${classroom.id}&returnTab=lessons`}>
              <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                <Eye className="w-3 h-3" />View
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Link to={`/Viewer?yearLevel=${classroom.year_level_key}&lesson=0&classroomId=${classroom.id}&returnTab=lessons`}>
          <Card className={`transition-shadow hover:shadow-md cursor-pointer ${lesson0Status === "completed" ? "border-l-4 border-l-emerald-400" : ""}`}>
            <CardContent className="p-4">
              {lesson0Status === "completed" ? (
                /* Compact completed layout */
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {getStatusBadge(lesson0Status)}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">Course Overview</h3>
                    {lesson0Prog?.completion_date && (
                      <div className="text-xs text-gray-400 mt-1">✓ {format(new Date(lesson0Prog.completion_date), "MMM d, yyyy")}</div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" className="rounded-full px-4 h-8 text-xs gap-1.5 flex-shrink-0">
                    <Eye className="w-3.5 h-3.5" />
                    Review
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        {getStatusBadge(lesson0Status)}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">Course Overview</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">Introduction and course objectives — required before Lesson 1</p>
                    </div>
                    <div className="flex-shrink-0 pt-0.5">
                      {(() => {
                        const a = getActionButton(lesson0Status);
                        const Icon = a.icon;
                        const base = "rounded-full px-4 h-8 text-xs gap-1.5";
                        if (a.variant === "gradient") return <Button size="sm" className={`${base} brand-gradient text-white`}><Icon className="w-3.5 h-3.5" />{a.label}</Button>;
                        if (a.variant === "outline") return <Button size="sm" variant="outline" className={base}><Icon className="w-3.5 h-3.5" />{a.label}</Button>;
                        return null;
                      })()}
                    </div>
                  </div>
                  {lesson0Pct > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
                      <div className={`h-1.5 rounded-full transition-all ${lesson0Color}`} style={{ width: `${lesson0Pct}%` }} />
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Lessons — single column */}
      <div className="flex flex-col gap-3">
        {yearLevel.lessons.map((lesson) => {
          if (isPrivileged) {
            const access = lessonAccess.find((la) => la.lesson_number === lesson.num);
                    const isOpen = access?.is_open === true;
            const lessonProgress = allStudentProgress.filter((p) => p.lesson_number === lesson.num);
            const completedCount = lessonProgress.filter((p) => p.completed).length;
            const inProgressCount = lessonProgress.filter((p) => !p.completed).length;
            const notStartedCount = Math.max(0, enrollments.length - completedCount - inProgressCount);

            return (
              <Card key={lesson.num} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">Lesson {lesson.num}</Badge>
                    {access?.is_open ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Open</Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700 border-0 text-xs gap-1">
                        <Lock className="w-2.5 h-2.5" />Locked
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">{lesson.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2.5">{lesson.summary}</p>
                  <div className="flex gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      {completedCount} done
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                      {inProgressCount} in progress
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                      {notStartedCount} not started
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/Viewer?yearLevel=${classroom.year_level_key}&lesson=${lesson.num}&classroomId=${classroom.id}&returnTab=lessons`}
                      className="flex-1"
                    >
                      <Button size="sm" variant="outline" className="w-full gap-1 text-xs">
                        <Eye className="w-3 h-3" />View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1 text-xs"
                      onClick={() => setManagingLesson(lesson)}
                    >
                      <Settings className="w-3 h-3" />Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          // ── Student view ──
          const status = getLessonStatus(lesson.num, lessonAccess, studentProgress);
          const progressPct = getProgressPct(lesson.num, studentProgress);
          const prog = studentProgress.find((p) => p.lesson_number === lesson.num);
          const displayScore = prog?.highest_score ?? prog?.overall_score;
          const isLocked = status === "locked";

          // Retake eligibility
          const accessRecord = lessonAccess.find(la => la.lesson_number === lesson.num);
          const retakesEnabled = accessRecord?.retakes_enabled;
          const maxRetakes = accessRecord?.max_retakes;
          const usedRetakes = prog?.retake_attempts || 0;
          const canRequestRetake = status === "completed" && retakesEnabled &&
            (maxRetakes === null || maxRetakes === undefined || usedRetakes < maxRetakes);

          const progressBarColor =
            status === "completed" || status === "retake_requested" ? "bg-emerald-500" :
            status === "in_progress" || status === "retake_in_progress" ? "bg-blue-500" :
            "bg-gray-200";

          // Define activities for the lesson
          const lessonActivities = [
            { id: "mcq", title: "Assessment Quiz", type: "MCQ" }
          ];

          const isCompleted = status === "completed";
          const quizUrl = `/Viewer?yearLevel=${classroom.year_level_key}&lesson=${lesson.num}&classroomId=${classroom.id}&returnTab=lessons&activity=mcq`;
          const hasQuizScore = displayScore !== undefined && displayScore !== null && displayScore > 0;

          const cardInner = (
            <Card className={`h-full transition-shadow ${isLocked ? "opacity-60" : "hover:shadow-md cursor-pointer"} ${isCompleted ? "border-l-4 border-l-emerald-400" : ""}`}>
              <CardContent className="p-4">
                {isCompleted ? (
                  /* Compact layout — the Completed badge already tells the story */
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="text-xs flex-shrink-0">Lesson {lesson.num}</Badge>
                        {getStatusBadge(status)}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">{lesson.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        {prog?.completion_date && (
                          <span>✓ {format(new Date(prog.completion_date), "MMM d, yyyy")}</span>
                        )}
                        {canRequestRetake && (
                          <button
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 underline"
                            onClick={(e) => { e.preventDefault(); setRetakeDialog({ lesson, prog, accessRecord }); }}
                          >
                            <RotateCcw className="w-3 h-3" />
                            Request Retake
                            {maxRetakes !== null && maxRetakes !== undefined && (
                              <span className="text-gray-400 no-underline">({maxRetakes - usedRetakes} left)</span>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasQuizScore && (
                        <Link
                          to={quizUrl}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-medium rounded-full px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          title="Review quiz"
                        >
                          Quiz: {displayScore}%
                        </Link>
                      )}
                      <Button size="sm" variant="outline" className="rounded-full px-4 h-8 text-xs gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Layout for active / not-started / locked / retake states */
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-xs flex-shrink-0">Lesson {lesson.num}</Badge>
                          {getStatusBadge(status)}
                        </div>
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-0.5">{lesson.title}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{lesson.summary}</p>
                      </div>
                      <div className="flex-shrink-0 pt-0.5">
                        {(() => {
                          const a = getActionButton(status);
                          const Icon = a.icon;
                          const base = "rounded-full px-4 h-8 text-xs gap-1.5";
                          if (a.variant === "gradient") return <Button size="sm" className={`${base} brand-gradient text-white`}><Icon className="w-3.5 h-3.5" />{a.label}</Button>;
                          if (a.variant === "outline") return <Button size="sm" variant="outline" className={base}><Icon className="w-3.5 h-3.5" />{a.label}</Button>;
                          if (a.variant === "disabled") return <Button size="sm" variant="outline" disabled className={`${base} cursor-not-allowed`}><Icon className="w-3.5 h-3.5" />{a.label}</Button>;
                          return null;
                        })()}
                      </div>
                    </div>
                    {/* Only show the progress bar when there's actual progress to convey */}
                    {progressPct > 0 && (
                      <>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3 mb-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${progressBarColor}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        {(status === "retake_requested" && prog?.completion_date) || hasQuizScore ? (
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            {status === "retake_requested" && prog?.completion_date ? (
                              <span>✓ {format(new Date(prog.completion_date), "MMM d, yyyy")}</span>
                            ) : <span />}
                            {hasQuizScore && (
                              <span className="text-gray-500 font-medium">Best: {displayScore}%</span>
                            )}
                          </div>
                        ) : null}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );

          // Non-clickable states
          if (isLocked || status === "retake_requested") return <div key={lesson.num}>{cardInner}</div>;

          return (
            <Link
              key={lesson.num}
              to={`/Viewer?yearLevel=${classroom.year_level_key}&lesson=${lesson.num}&classroomId=${classroom.id}&returnTab=lessons`}
            >
              {cardInner}
            </Link>
          );
        })}
      </div>

      {/* Reset Progress (student only) */}
      {!isPrivileged && studentProgress.length > 0 && (
        <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            Want to start fresh? This clears your progress for this course.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setResetDialog(true)}
            className="rounded-full gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Reset Progress
          </Button>
        </div>
      )}

      {/* Reset Progress Dialog */}
      <Dialog open={resetDialog} onOpenChange={(open) => {
        if (resetLoading) return;
        setResetDialog(open);
        if (!open) { setResetPassword(""); setResetError(""); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Reset all lesson progress?
            </DialogTitle>
            <DialogDescription>
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• All your completion marks and quiz scores in this classroom will be deleted.</p>
            <p>• Locked lessons will stay locked — only your personal progress is cleared.</p>
            <p>• You'll start over from the Course Overview.</p>
          </div>
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-medium text-gray-700">
              Enter your password to confirm
            </label>
            <Input
              type="password"
              autoComplete="current-password"
              value={resetPassword}
              onChange={(e) => { setResetPassword(e.target.value); setResetError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !resetLoading) handleResetProgress(); }}
              placeholder="Password"
              disabled={resetLoading}
              autoFocus
            />
            {resetError && <p className="text-xs text-red-600">{resetError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetDialog(false); setResetPassword(""); setResetError(""); }} disabled={resetLoading}>Cancel</Button>
            <Button
              onClick={handleResetProgress}
              disabled={resetLoading || !resetPassword}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {resetLoading ? "Resetting..." : "Reset Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Management Dialog */}
      {managingLesson && (
        <LessonManagementDialog
          lesson={managingLesson}
          classroom={classroom}
          lessonAccess={lessonAccess}
          allStudentProgress={allStudentProgress}
          enrollments={enrollments}
          onClose={() => setManagingLesson(null)}
          onAccessUpdated={() => {
            refetchAccess();
            refetchProgress();
          }}
        />
      )}

      {/* Retake Request Dialog */}
      <Dialog open={!!retakeDialog} onOpenChange={() => setRetakeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Retake</DialogTitle>
            {retakeDialog && (
              <DialogDescription>
                Lesson {retakeDialog.lesson.num}: {retakeDialog.lesson.title}
              </DialogDescription>
            )}
          </DialogHeader>
          {retakeDialog && (
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Your current score will be <strong>retained</strong> if your new attempt scores lower.</p>
              <p>• Only the <strong>highest score</strong> across all attempts will be recorded.</p>
              {retakeDialog.accessRecord?.max_retakes !== null && retakeDialog.accessRecord?.max_retakes !== undefined && (
                <p>• You have <strong>{retakeDialog.accessRecord.max_retakes - (retakeDialog.prog?.retake_attempts || 0)} retake(s) remaining</strong> after this request.</p>
              )}
              <p className="text-amber-600 text-xs pt-1">Your request must be approved by your facilitator before you can retake.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRetakeDialog(null)}>Cancel</Button>
            <Button onClick={handleRetakeRequest} className="brand-gradient text-white">Confirm Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}