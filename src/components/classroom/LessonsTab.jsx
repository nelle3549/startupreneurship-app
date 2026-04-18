import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/useCurrentUser";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCoursewares } from "@/hooks/useCoursewares";
import { Lock, CheckCircle, Clock, Eye, Settings, RotateCcw } from "lucide-react";
import LessonManagementDialog from "./LessonManagementDialog";
import ActivityShortcuts from "@/components/viewer/ActivityShortcuts";
import { format } from "date-fns";

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

  if (!yearLevel) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
        <p className="text-sm text-gray-400">Year level not found.</p>
      </div>
    );
  }

  const completedLessons = isPrivileged ? 0 : studentProgress.filter((p) => p.completed).length;
  const totalLessons = yearLevel.lessons.length + 1; // +1 for Lesson 0

  // Lesson 0 state
  const lesson0PrivProgress = allStudentProgress.filter(p => p.lesson_number === 0);
  const lesson0Status = getLessonStatus(0, lessonAccess, studentProgress);
  const lesson0Prog = studentProgress.find(p => p.lesson_number === 0);
  const lesson0Pct = getProgressPct(0, studentProgress);
  const lesson0Color = lesson0Status === "completed" ? "bg-emerald-500" : lesson0Status === "in_progress" ? "bg-blue-500" : "bg-gray-200";

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">{courseDetails?.subtitle || yearLevel.subtitle || yearLevel.bookTitle}</h2>
        <p className="text-sm text-gray-600 mb-4">{yearLevel.summary}</p>
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
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="outline" className="text-xs">Lesson 0</Badge>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Always Open</Badge>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">Course Overview</h3>
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
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <Badge variant="outline" className="text-xs">Lesson 0</Badge>
                {getStatusBadge(lesson0Status)}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">Course Overview</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">Introduction and course objectives — required before Lesson 1</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                <div className={`h-1.5 rounded-full transition-all ${lesson0Color}`} style={{ width: `${lesson0Pct}%` }} />
              </div>
              {lesson0Status === "completed" && lesson0Prog?.completion_date && (
                <div className="text-xs text-gray-400 mt-1">✓ {format(new Date(lesson0Prog.completion_date), "MMM d, yyyy")}</div>
              )}
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Lessons — single column */}
      <div className="flex flex-col gap-4">
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
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{lesson.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{lesson.summary}</p>
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

          const cardInner = (
            <Card className={`h-full transition-shadow ${isLocked ? "opacity-60" : "hover:shadow-md cursor-pointer"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">Lesson {lesson.num}</Badge>
                  {getStatusBadge(status)}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">{lesson.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{lesson.summary}</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                  <div
                    className={`h-1.5 rounded-full transition-all ${progressBarColor}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 min-h-[16px]">
                  {(status === "completed" || status === "retake_requested") && prog?.completion_date ? (
                    <span>✓ {format(new Date(prog.completion_date), "MMM d, yyyy")}</span>
                  ) : (
                    <span />
                  )}
                  {displayScore !== undefined && displayScore !== null && displayScore > 0 && (
                    <span className="text-gray-500 font-medium">Best: {displayScore}%</span>
                  )}
                </div>
                {canRequestRetake && (
                  <button
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 underline"
                    onClick={(e) => { e.preventDefault(); setRetakeDialog({ lesson, prog, accessRecord }); }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Request Retake
                    {maxRetakes !== null && maxRetakes !== undefined && (
                      <span className="text-gray-400 no-underline">({maxRetakes - usedRetakes} left)</span>
                    )}
                  </button>
                )}

                {/* Activity Shortcuts for completed lessons */}
                {status === "completed" && prog && (
                  <ActivityShortcuts
                    activities={lessonActivities}
                    studentProgress={prog.all_scores || []}
                    onActivitySelect={(activityId) => {
                      // Navigate to activity completion page
                      window.location.href = `/Viewer?yearLevel=${classroom.year_level_key}&lesson=${lesson.num}&classroomId=${classroom.id}&returnTab=lessons&activity=${activityId}`;
                    }}
                  />
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