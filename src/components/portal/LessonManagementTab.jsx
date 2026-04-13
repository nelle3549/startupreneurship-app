import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock } from "lucide-react";
import { useCoursewares } from "@/hooks/useCoursewares";

export default function LessonManagementTab({ classrooms, selectedClassroom }) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const { getCourseware } = useCoursewares();

  const classroom = classrooms.find(c => c.id === selectedClassroom);
  const yearLevel = classroom ? getCourseware(classroom.year_level_key) : null;

  const { data: lessonAccess = [] } = useQuery({
    queryKey: ["lesson-access", selectedClassroom],
    queryFn: () => base44.entities.LessonAccess.filter({ classroom_id: selectedClassroom }),
    enabled: !!selectedClassroom,
  });

  const toggleAccessMutation = useMutation({
    mutationFn: async ({ lessonNum, isOpen }) => {
      const existing = lessonAccess.find(la => la.lesson_number === lessonNum);
      if (existing) {
        return base44.entities.LessonAccess.update(existing.id, { is_open: isOpen });
      } else {
        return base44.entities.LessonAccess.create({
          classroom_id: selectedClassroom,
          year_level_key: classroom.year_level_key,
          lesson_number: lessonNum,
          is_open: isOpen,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lesson-access", selectedClassroom] }),
  });

  if (!yearLevel) {
    return (
      <div className="text-center py-12 text-gray-400">
        Select a classroom to manage lessons
      </div>
    );
  }

  const lessons = yearLevel.lessons || [];
  const getLessonStatus = (lessonNum) => {
    const access = lessonAccess.find(la => la.lesson_number === lessonNum);
    return access ? access.is_open : lessonNum === 1; // Lesson 1 open by default
  };

  const filtered = filter === "all"
    ? lessons
    : filter === "open"
      ? lessons.filter(l => getLessonStatus(l.num))
      : lessons.filter(l => !getLessonStatus(l.num));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">{classroom.name}</h3>
          <p className="text-xs text-gray-400">{yearLevel.grade} • {lessons.length} lessons</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lessons</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        {filtered.map(lesson => {
          const isOpen = getLessonStatus(lesson.num);
          return (
            <Card key={lesson.num} className={isOpen ? "border-emerald-200 bg-emerald-50/30" : "border-gray-200 bg-gray-50/30"}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    Lesson {lesson.num}: {lesson.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{lesson.summary}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={isOpen ? "bg-emerald-100 text-emerald-700 border-0" : "bg-gray-200 text-gray-600 border-0"}>
                    {isOpen ? "Open" : "Closed"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={isOpen ? "outline" : "default"}
                    className={`rounded-full gap-1.5 text-xs px-3 ${isOpen ? "text-gray-600 border-gray-300" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                    onClick={() => toggleAccessMutation.mutate({ lessonNum: lesson.num, isOpen: !isOpen })}
                    disabled={toggleAccessMutation.isPending}
                  >
                    {isOpen ? (
                      <>
                        <Lock className="w-3 h-3" />
                        Close
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        Open
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}