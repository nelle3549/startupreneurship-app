import React, { useState, useMemo } from "react";
import { entities } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useCoursewares } from "@/hooks/useCoursewares";

export default function ProgressTrackingTab({ classrooms, selectedClassroom }) {
  const [lessonFilter, setLessonFilter] = useState("all");
  const { getCourseware } = useCoursewares();

  const classroom = classrooms.find(c => c.id === selectedClassroom);
  const yearLevel = classroom ? getCourseware(classroom.year_level_key) : null;

  const { data: enrollments = [] } = useQuery({
    queryKey: ["classroom-enrollments", selectedClassroom],
    queryFn: () => entities.Enrollment.filter({ classroom_id: selectedClassroom, status: "approved" }),
    enabled: !!selectedClassroom,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["student-progress", selectedClassroom],
    queryFn: () => entities.StudentLessonProgress.filter({ classroom_id: selectedClassroom }),
    enabled: !!selectedClassroom,
  });

  const lessons = useMemo(() => yearLevel?.lessons || [], [yearLevel]);

  const progressData = useMemo(() => {
    return enrollments.map(enrollment => {
      const studentProgress = progress.filter(p => p.student_id === enrollment.student_id);
      return {
        enrollment,
        progress: studentProgress,
      };
    });
  }, [enrollments, progress]);

  const filteredLessons = lessonFilter === "all"
    ? lessons
    : [lessons.find(l => l.num === parseInt(lessonFilter))].filter(Boolean);

  if (!yearLevel) {
    return (
      <div className="text-center py-12 text-gray-400">
        Select a classroom to view progress
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">{classroom.name}</h3>
          <p className="text-xs text-gray-400">{enrollments.length} students • {lessons.length} lessons</p>
        </div>
        <Select value={lessonFilter} onValueChange={setLessonFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lessons</SelectItem>
            {lessons.map(l => (
              <SelectItem key={l.num} value={l.num.toString()}>
                Lesson {l.num}: {l.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                {filteredLessons.map(lesson => (
                  <TableHead key={lesson.num} className="text-center text-xs">
                    <div>L{lesson.num}</div>
                    <div className="text-gray-400">Score</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {progressData.map(({ enrollment, progress: studentProgress }) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{enrollment.student_name}</p>
                      <p className="text-xs text-gray-500">{enrollment.student_email}</p>
                    </div>
                  </TableCell>
                  {filteredLessons.map(lesson => {
                    const lessonProg = studentProgress.find(p => p.lesson_number === lesson.num);
                    return (
                      <TableCell key={lesson.num} className="text-center">
                        {lessonProg ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-semibold text-gray-900">
                              {lessonProg.overall_score.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <AlertCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {progressData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={filteredLessons.length + 1} className="text-center py-8 text-gray-400">
                    No enrolled students yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="text-xs text-gray-500 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          Completed
        </div>
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-gray-300" />
          Not Started
        </div>
      </div>
    </div>
  );
}