import React from "react";
import { useNavigate } from "react-router-dom";
import { entities } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/useCurrentUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Flame, Target, BookOpen } from "lucide-react";
import { useCoursewares } from "@/hooks/useCoursewares";
import { getProgress, getAllProgress } from "@/components/progressStorage";

export default function Analytics() {
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { getCourseware } = useCoursewares();

  // Fetch enrollments
  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["student-enrollments", user?.email],
    queryFn: () => entities.Enrollment.list(),
    enabled: !!user?.email,
    select: (data) => data.filter(e => e.student_email === user?.email && e.status === "approved"),
  });

  // Fetch classrooms
  const { data: classrooms = [], isLoading: classroomsLoading } = useQuery({
    queryKey: ["classrooms"],
    queryFn: () => entities.Classroom.list(),
  });

  // Get enrolled classrooms with course info
  const enrolledCourses = enrollments.map(enrollment => {
    const classroom = classrooms.find(c => c.id === enrollment.classroom_id);
    const yearLevel = getCourseware(classroom?.year_level_key);
    const progress = getProgress(classroom?.year_level_key);
    
    return {
      enrollment,
      classroom,
      yearLevel,
      progress,
    };
  }).filter(c => c.yearLevel);

  // Calculate learning streak
  const allProgress = getAllProgress();
  const streakDays = calculateStreak(allProgress);

  // Calculate average quiz score
  const avgQuizScore = calculateAverageScore(enrolledCourses);

  // Calculate total completion percentage
  const totalCompletion = calculateTotalCompletion(enrolledCourses);

  if (userLoading || enrollmentsLoading || classroomsLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/Home")}
              className="rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Learning Analytics</h1>
          </div>
          <p className="text-sm text-gray-500 ml-12">Track your progress across all courses</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Completion */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Overall Progress</CardTitle>
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{totalCompletion}%</div>
              <Progress value={totalCompletion} className="h-2" />
              <p className="text-xs text-gray-500 mt-2">{enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} enrolled</p>
            </CardContent>
          </Card>

          {/* Learning Streak */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Learning Streak</CardTitle>
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{streakDays} days</div>
              <p className="text-xs text-gray-600">Keep it up! 🔥</p>
            </CardContent>
          </Card>

          {/* Average Score */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Avg. Quiz Score</CardTitle>
                <Target className="w-5 h-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-2">{avgQuizScore}%</div>
              <p className="text-xs text-gray-600">Based on completed assessments</p>
            </CardContent>
          </Card>
        </div>

        {/* Courses Progress */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Course Progress
          </h2>

          {enrolledCourses.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-gray-500 mb-4">No enrolled courses yet</p>
              <Button onClick={() => navigate("/Home")} variant="outline" className="rounded-full">
                Enroll in a Course
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {enrolledCourses.map((course) => {
                const lessonsCompleted = Object.values(course.progress?.lesson_completions || {}).filter(Boolean).length;
                const totalLessons = course.yearLevel?.lessons?.length || 12;
                const completionPercent = Math.round((lessonsCompleted / totalLessons) * 100);

                return (
                  <Card key={course.classroom.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {course.classroom.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {course.yearLevel.bookTitle}
                          </p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs">
                              {lessonsCompleted} of {totalLessons} lessons
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700 text-xs border-0">
                              {completionPercent}% complete
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-gray-900">
                            {completionPercent}%
                          </div>
                          <p className="text-xs text-gray-500">done</p>
                        </div>
                      </div>
                      <Progress value={completionPercent} className="h-3" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate streak
function calculateStreak(allProgress) {
  let streak = 0;
  let currentDate = new Date();
  
  while (streak < 365) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const hasActivity = Object.values(allProgress).some(p => {
      const lastActivity = p.last_activity_timestamp ? new Date(p.last_activity_timestamp).toISOString().split('T')[0] : null;
      return lastActivity === dateStr;
    });
    
    if (!hasActivity && streak > 0) break;
    if (hasActivity) streak++;
    
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
}

// Helper function to calculate average quiz score
function calculateAverageScore(courses) {
  const scores = courses
    .map(c => c.progress?.overall_score || 0)
    .filter(score => score > 0);
  
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Helper function to calculate total completion
function calculateTotalCompletion(courses) {
  if (courses.length === 0) return 0;
  const completion = courses.map(c => {
    const lessonsCompleted = Object.values(c.progress?.lesson_completions || {}).filter(Boolean).length;
    const totalLessons = c.yearLevel?.lessons?.length || 12;
    return (lessonsCompleted / totalLessons) * 100;
  });
  
  return Math.round(completion.reduce((a, b) => a + b, 0) / courses.length);
}