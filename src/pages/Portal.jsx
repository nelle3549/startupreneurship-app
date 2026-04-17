import React, { useState } from "react";
import { entities } from "@/api/entities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertTriangle, Home, Users, BookOpen, Clock, Lock, BarChart3 } from "lucide-react";
import { BrandTabsList } from "@/components/ui/BrandTabs";
import { ICON_URL } from "../components/data/courseData";
import { getSavedUser } from "../components/userStorage";
import { Link, useSearchParams } from "react-router-dom";
import { useCurrentUser } from "../components/useCurrentUser";
import ClassroomsTab from "../components/portal/ClassroomsTab";
import EnrollmentsTab from "../components/portal/EnrollmentsTab";
import StudentsTab from "../components/portal/StudentsTab";
import LessonManagementTab from "../components/portal/LessonManagementTab";
import ProgressTrackingTab from "../components/portal/ProgressTrackingTab";

export default function Portal() {
  const { user: authUser, isLoading: authLoading, isFacilitator, isAdmin } = useCurrentUser();
  const legacyUser = getSavedUser();
  const isLegacyFacilitator = legacyUser?.role === "facilitator" && legacyUser?.status === "verified";
  const isFacilitatorUser = isFacilitator || isAdmin || isLegacyFacilitator;
  
  // Students with approved enrollments can also access Portal
  const { data: studentEnrollments = [] } = useQuery({
    queryKey: ["student-enrollments", authUser?.email],
    queryFn: () => entities.Enrollment.filter({ student_email: authUser?.email, status: "approved" }),
    enabled: !!authUser?.email && !isFacilitatorUser,
  });
  
  const isStudent = !isFacilitatorUser && !!authUser;
  const hasAccess = isFacilitatorUser || isStudent;

  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "classrooms";
  const setTab = (t) => setSearchParams(prev => { prev.set("tab", t); return prev; });
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  // Pending enrollment count for badge
  const facilitatorId = authUser?.id;
  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms", facilitatorId],
    queryFn: () => entities.Classroom.filter({ facilitator_id: facilitatorId }),
    enabled: !!facilitatorId && isFacilitatorUser,
  });
  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments-all"],
    queryFn: () => entities.Enrollment.list(),
    enabled: isFacilitatorUser,
  });
  
  // For students, fetch all approved classrooms they're enrolled in
  const { data: studentClassrooms = [] } = useQuery({
    queryKey: ["student-classrooms", authUser?.id],
    queryFn: async () => {
      const allClassrooms = await entities.Classroom.list();
      return allClassrooms.filter(c => 
        studentEnrollments.some(e => e.classroom_id === c.id)
      );
    },
    enabled: isStudent,
  });

  const myClassroomIds = new Set(classrooms.map(c => c.id));
  const pendingCount = enrollments.filter(
    e => myClassroomIds.has(e.classroom_id) && e.status === "pending"
  ).length;

  const handleViewStudents = (cls) => {
    setSelectedClassroom(cls);
    setTab("students");
  };


  if (authLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            {isFacilitatorUser ? "The Facilitator Portal is only available to approved facilitators. Please wait for administrator approval." : "No approved enrollments yet. Please join a classroom first."}
          </p>
          <Link to="/Home">
            <Button className="brand-gradient text-white rounded-full px-8">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={ICON_URL} alt="" className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">{isFacilitatorUser ? "Facilitator Portal" : "My Classrooms"}</h1>
              <p className="text-xs text-gray-400">
                {authUser?.full_name || legacyUser?.first_name || "User"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/Home">
              <Button variant="outline" className="rounded-full gap-2 text-sm hidden sm:flex">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
              <Button variant="outline" size="icon" className="rounded-full sm:hidden">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Summary row */}
        {isFacilitatorUser && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Classrooms", value: classrooms.length, icon: BookOpen, color: "text-blue-600 bg-blue-100" },
            { label: "Pending Enrollments", value: pendingCount, icon: Clock, color: "text-amber-600 bg-amber-100" },
            {
              label: "Total Students",
              value: enrollments.filter(e => myClassroomIds.has(e.classroom_id) && e.status === "approved").length,
              icon: Users,
              color: "text-emerald-600 bg-emerald-100"
            },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
        )}
        
        {isStudent && (
        <div className="grid grid-cols-1 gap-4 mb-6">
          {studentClassrooms.length > 0 ? (
            studentClassrooms.map(cls => (
              <Link key={cls.id} to={`/ClassroomView?id=${cls.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer">
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{cls.school || "School not specified"}</p>
                  <p className="text-xs text-gray-400 mt-2">{cls.description || "No description"}</p>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No classrooms yet. Join a classroom to get started.</p>
            </div>
          )}
        </div>
        )}

        {isFacilitatorUser && (
          <Tabs value={tab} onValueChange={setTab}>
            <BrandTabsList tabs={[
              { value: "classrooms", icon: <BookOpen className="w-3.5 h-3.5" />, label: "Classrooms" },
              { value: "enrollments", icon: <Clock className="w-3.5 h-3.5" />, label: "Enrollments", badge: pendingCount },
              { value: "students", icon: <Users className="w-3.5 h-3.5" />, label: "Students" },
              { value: "lessons", icon: <Lock className="w-3.5 h-3.5" />, label: "Lesson Access" },
              { value: "progress", icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Progress" },
            ]} />

          <TabsContent value="classrooms">
            <ClassroomsTab
              facilitatorId={facilitatorId}
              facilitatorEmail={authUser?.email}
              facilitatorSchool={authUser?.school_organization}
              onViewStudents={handleViewStudents}
            />
          </TabsContent>

          <TabsContent value="enrollments">
            <EnrollmentsTab facilitatorId={facilitatorId} />
          </TabsContent>

          <TabsContent value="students">
            <StudentsTab
              facilitatorId={facilitatorId}
              selectedClassroom={selectedClassroom}
              onClearClassroom={() => setSelectedClassroom(null)}
            />
          </TabsContent>

          <TabsContent value="lessons">
            <div className="space-y-4">
              {classrooms.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No classrooms yet. Create one to manage lessons.
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    {classrooms.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedClassroom(c.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedClassroom === c.id
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <LessonManagementTab classrooms={classrooms} selectedClassroom={selectedClassroom} />
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <div className="space-y-4">
              {classrooms.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No classrooms yet. Create one to view progress.
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    {classrooms.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedClassroom(c.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          selectedClassroom === c.id
                            ? "bg-blue-600 text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                  <ProgressTrackingTab classrooms={classrooms} selectedClassroom={selectedClassroom} />
                </>
              )}
            </div>
          </TabsContent>
          </Tabs>
          )}
          </div>
          </div>
          );
          }