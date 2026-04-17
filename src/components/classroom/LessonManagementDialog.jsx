import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Users } from "lucide-react";

export default function LessonManagementDialog({
  lesson,
  classroom,
  lessonAccess,
  allStudentProgress,
  enrollments,
  onClose,
  onAccessUpdated,
}) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const access = lessonAccess.find((la) => la.lesson_number === lesson.num);
  const isCurrentlyOpen = access?.is_open === true;

  // Can only unlock if all previous lessons are open (sequential) and not already open
  const canUnlock = (() => {
    if (isCurrentlyOpen) return false;
    for (let i = 1; i < lesson.num; i++) {
      const prev = lessonAccess.find((la) => la.lesson_number === i);
      if (!prev?.is_open) return false;
    }
    return true;
  })();

  const handleUnlock = async () => {
    if (!canUnlock) return;
    setLoading(true);

    // Auto-cascade: ensure all preceding lessons also have an open LessonAccess record
    for (let i = 1; i < lesson.num; i++) {
      const prev = lessonAccess.find((la) => la.lesson_number === i);
      if (!prev) {
        await entities.LessonAccess.create({
          classroom_id: classroom.id,
          year_level_key: classroom.year_level_key,
          lesson_number: i,
          is_open: true,
        });
      } else if (!prev.is_open) {
        await entities.LessonAccess.update(prev.id, { is_open: true });
      }
    }

    if (access) {
      await entities.LessonAccess.update(access.id, { is_open: true });
    } else {
      await entities.LessonAccess.create({
        classroom_id: classroom.id,
        year_level_key: classroom.year_level_key,
        lesson_number: lesson.num,
        is_open: true,
      });
    }

    // Auto-post announcement
    try {
      await entities.Announcement.create({
        classroom_id: classroom.id,
        author_id: "system",
        author_name: classroom.facilitator_id ? "System" : "Classroom",
        author_email: classroom.facilitator_email || "system@classroom.local",
        title: `New Lesson Available: ${lesson.title}`,
        content: `Good news! **${lesson.title}** is now unlocked and available for you to start. Click on the Lessons tab to begin!`,
        status: "published",
        is_auto_announcement: true,
        metadata: {
          lesson_number: lesson.num,
          lesson_title: lesson.title,
          year_level_key: classroom.year_level_key,
        },
      });
      queryClient.invalidateQueries({ queryKey: ["classroom-announcements", classroom.id] });
    } catch (err) {
      console.error("Failed to post auto-announcement:", err);
    }

    queryClient.invalidateQueries({ queryKey: ["lesson-access", classroom.id] });
    onAccessUpdated();
    setLoading(false);
  };

  const progressForLesson = allStudentProgress.filter((p) => p.lesson_number === lesson.num);
  const completedCount = progressForLesson.filter((p) => p.completed).length;
  const inProgressCount = progressForLesson.filter((p) => !p.completed).length;
  const notStartedCount = Math.max(0, enrollments.length - completedCount - inProgressCount);
  const classProgressPct = enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Lesson {lesson.num}</DialogTitle>
          <DialogDescription>{lesson.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Access Control */}
          <div className="border rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-900">Lesson Access</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCurrentlyOpen ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                    <Unlock className="w-3 h-3" />Open
                  </Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700 border-0 gap-1">
                    <Lock className="w-3 h-3" />Locked
                  </Badge>
                )}
                {lesson.num === 1 && !isCurrentlyOpen && (
                  <span className="text-xs text-gray-400">First lesson — unlock to begin</span>
                )}
              </div>

              {!isCurrentlyOpen && (
                <Button
                  size="sm"
                  onClick={handleUnlock}
                  disabled={!canUnlock || loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full gap-1 text-xs"
                >
                  <Unlock className="w-3 h-3" />
                  {loading ? "Unlocking..." : "Unlock"}
                </Button>
              )}
              {isCurrentlyOpen && (
                <span className="text-xs text-gray-400 italic">Cannot re-lock</span>
              )}
            </div>

            {!canUnlock && !isCurrentlyOpen && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                ⚠️ Unlock lessons in order. Previous lesson(s) must be unlocked first.
              </p>
            )}
          </div>

          {/* Student Progress */}
          <div className="border rounded-xl p-4 space-y-3">
            <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Student Progress
              <span className="text-gray-400 font-normal">({enrollments.length} students)</span>
            </h4>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xl font-bold text-emerald-600">{completedCount}</p>
                <p className="text-xs text-emerald-600 mt-0.5">Completed</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xl font-bold text-blue-600">{inProgressCount}</p>
                <p className="text-xs text-blue-600 mt-0.5">In Progress</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xl font-bold text-gray-500">{notStartedCount}</p>
                <p className="text-xs text-gray-500 mt-0.5">Not Started</p>
              </div>
            </div>

            {enrollments.length > 0 && (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Class completion</span>
                  <span>{classProgressPct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all"
                    style={{ width: `${classProgressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button variant="outline" onClick={onClose} className="rounded-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}