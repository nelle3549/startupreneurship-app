import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Users, RotateCcw, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { YEAR_LEVELS } from "@/components/data/courseData";
import { format } from "date-fns";

function getStatusBadge(status) {
  switch (status) {
    case "completed":
      return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1"><CheckCircle className="w-3 h-3" />Completed</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs gap-1"><Clock className="w-3 h-3" />In Progress</Badge>;
    case "retake_requested":
      return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs gap-1"><RotateCcw className="w-3 h-3" />Retake Requested</Badge>;
    case "retake_in_progress":
      return <Badge className="bg-purple-100 text-purple-700 border-0 text-xs gap-1"><RotateCcw className="w-3 h-3" />Retake In Progress</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Not Started</Badge>;
  }
}

function getStudentStatus(prog) {
  if (!prog) return "not_started";
  if (prog.status === "retake_requested") return "retake_requested";
  if (prog.status === "retake_in_progress") return "retake_in_progress";
  if (prog.completed) return "completed";
  if (prog.current_step_index > 0) return "in_progress";
  return "not_started";
}

function LessonGradeCard({ lesson, classroom, enrollments, allProgress, lessonAccessList, refetchAll }) {
  const [expanded, setExpanded] = useState(false);

  const access = lessonAccessList.find(la => la.lesson_number === lesson.num);
  const lessonProgress = allProgress.filter(p => p.lesson_number === lesson.num);

  const studentsWithScores = lessonProgress.filter(p => (p.highest_score ?? p.overall_score ?? 0) > 0);
  const avgScore = studentsWithScores.length > 0
    ? Math.round(studentsWithScores.reduce((sum, p) => sum + (p.highest_score ?? p.overall_score ?? 0), 0) / studentsWithScores.length)
    : null;

  const retakesEnabled = access?.retakes_enabled || false;
  const maxRetakes = access?.max_retakes ?? 3;
  const hasRetakeRequests = lessonProgress.some(p => p.retake_requested || p.status === "retake_requested");

  const toggleRetakes = async () => {
    if (access) {
      await base44.entities.LessonAccess.update(access.id, { retakes_enabled: !retakesEnabled });
    } else {
      await base44.entities.LessonAccess.create({
        classroom_id: classroom.id,
        year_level_key: classroom.year_level_key,
        lesson_number: lesson.num,
        is_open: lesson.num === 1,
        retakes_enabled: true,
        max_retakes: 3,
      });
    }
    refetchAll();
  };

  const updateMaxRetakes = async (val) => {
    const num = val === "unlimited" ? null : parseInt(val);
    if (access) {
      await base44.entities.LessonAccess.update(access.id, { max_retakes: num });
      refetchAll();
    }
  };

  const handleRetakeAction = async (prog, approved) => {
    if (approved) {
      await base44.entities.StudentLessonProgress.update(prog.id, {
        retake_requested: false,
        retake_approved: true,
        status: "retake_in_progress",
        completed: false,
        retake_attempts: (prog.retake_attempts || 0) + 1,
      });
    } else {
      await base44.entities.StudentLessonProgress.update(prog.id, {
        retake_requested: false,
        retake_approved: false,
        status: "completed",
      });
    }
    refetchAll();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Summary Row */}
        <button
          className="w-full p-5 text-left hover:bg-gray-50 transition-colors flex items-center justify-between gap-4"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className="text-xs flex-shrink-0">Lesson {lesson.num}</Badge>
              {hasRetakeRequests && (
                <Badge className="bg-amber-100 text-amber-700 border-0 text-xs gap-1">
                  <AlertCircle className="w-3 h-3" />Retake Requests
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-sm truncate">{lesson.title}</h3>
            <div className="flex gap-4 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />{studentsWithScores.length} with scores
              </span>
              <span>Class avg: {avgScore !== null ? `${avgScore}%` : "—"}</span>
            </div>
          </div>
          {expanded
            ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
            : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
        </button>

        {expanded && (
          <div className="border-t border-gray-100">
            {/* Retake Management Controls */}
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id={`retakes-${lesson.num}`}
                  checked={retakesEnabled}
                  onCheckedChange={toggleRetakes}
                />
                <Label htmlFor={`retakes-${lesson.num}`} className="text-sm cursor-pointer">Retakes enabled</Label>
              </div>
              {retakesEnabled && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 text-xs">Max retakes:</span>
                  <select
                    className="border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                    value={maxRetakes === null || maxRetakes === undefined ? "unlimited" : maxRetakes}
                    onChange={(e) => updateMaxRetakes(e.target.value)}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>
              )}
            </div>

            {/* Student Roster */}
            <div className="divide-y divide-gray-50">
              {enrollments.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-gray-400">No enrolled students yet.</div>
              ) : (
                enrollments.map((enrollment) => {
                  const prog = lessonProgress.find(p => p.student_id === enrollment.student_id);
                  const status = getStudentStatus(prog);
                  const score = prog?.highest_score ?? prog?.overall_score ?? null;
                  const allScores = prog?.all_scores || [];
                  const retakeUsed = prog?.retake_attempts || 0;
                  const isRetakeRequested = prog?.retake_requested || status === "retake_requested";

                  return (
                    <div key={enrollment.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">{enrollment.student_name}</span>
                            {getStatusBadge(status)}
                          </div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-400">
                            <span>{enrollment.student_email}</span>
                            {retakeUsed > 0 && (
                              <span className="flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" />
                                {retakeUsed}/{maxRetakes !== null && maxRetakes !== undefined ? maxRetakes : "∞"} retakes used
                              </span>
                            )}
                            {prog?.highest_score_date && score !== null && (
                              <span>Best on {format(new Date(prog.highest_score_date), "MMM d, yyyy")}</span>
                            )}
                          </div>
                          {allScores.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {allScores.map((attempt, i) => (
                                <span key={i} className="text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-500">
                                  #{i + 1}: {attempt.score}%
                                  {attempt.timestamp && ` · ${format(new Date(attempt.timestamp), "MMM d")}`}
                                </span>
                              ))}
                            </div>
                          )}
                          {isRetakeRequested && (
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3"
                                onClick={() => handleRetakeAction(prog, true)}
                              >
                                Approve Retake
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs px-3"
                                onClick={() => handleRetakeAction(prog, false)}
                              >
                                Deny
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          {score !== null && score > 0 ? (
                            <span className={`text-xl font-bold ${score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-500"}`}>
                              {score}%
                            </span>
                          ) : (
                            <span className="text-sm text-gray-300">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function GradesSection({ classroom }) {
  const yearLevel = YEAR_LEVELS[classroom.year_level_key];

  const { data: enrollments = [], refetch: refetchEnrollments } = useQuery({
    queryKey: ["classroom-enrollments-for-grades", classroom.id],
    queryFn: () => base44.entities.Enrollment.filter({ classroom_id: classroom.id, status: "approved" }),
  });

  const { data: allProgress = [], refetch: refetchProgress } = useQuery({
    queryKey: ["classroom-progress-grades", classroom.id],
    queryFn: () => base44.entities.StudentLessonProgress.filter({ classroom_id: classroom.id }),
  });

  const { data: lessonAccessList = [], refetch: refetchAccess } = useQuery({
    queryKey: ["lesson-access-grades", classroom.id],
    queryFn: () => base44.entities.LessonAccess.filter({ classroom_id: classroom.id }),
  });

  const refetchAll = () => { refetchProgress(); refetchAccess(); };

  if (!yearLevel) {
    return <div className="text-center py-16 text-gray-400">Year level not found.</div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-4">
        {enrollments.length} enrolled student{enrollments.length !== 1 ? "s" : ""} · {yearLevel.lessons.length} lessons
      </p>
      {yearLevel.lessons.map(lesson => (
        <LessonGradeCard
          key={lesson.num}
          lesson={lesson}
          classroom={classroom}
          enrollments={enrollments}
          allProgress={allProgress}
          lessonAccessList={lessonAccessList}
          refetchAll={refetchAll}
        />
      ))}
    </div>
  );
}