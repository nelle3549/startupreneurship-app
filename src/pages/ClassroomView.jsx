import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/useCurrentUser";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Users, BarChart3, AlertTriangle, Pencil, Home, Bell } from "lucide-react";

import EditClassroomModal from "@/components/classroom/EditClassroomModal";
import { BrandTabsList } from "@/components/ui/BrandTabs";
import ClassroomHeader from "@/components/classroom/ClassroomHeader";
import AnnouncementsSection from "@/components/classroom/AnnouncementsSection";
import StudentListSection from "@/components/classroom/StudentListSection";
import GradesSection from "@/components/classroom/GradesSection";
import LessonsTab from "@/components/classroom/LessonsTab";

export default function ClassroomView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const classroomId = searchParams.get("id");
  const activeTab = searchParams.get("tab") || "announcements";
  const setActiveTab = (t) => setSearchParams(prev => { prev.set("tab", t); return prev; });
  const { user, isLoading: userLoading, isAdmin } = useCurrentUser();
  const isFacilitator = user?.role === "facilitator";
  const [editOpen, setEditOpen] = useState(false);

  const { data: classroom, isLoading: classroomLoading } = useQuery({
    queryKey: ["classroom", classroomId],
    queryFn: () => base44.entities.Classroom.list().then(classrooms => 
      classrooms.find(c => c.id === classroomId)
    ),
    enabled: !!classroomId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["classroom-enrollments-access", classroomId],
    queryFn: () => base44.entities.Enrollment.filter({ classroom_id: classroomId }),
    enabled: !!classroomId,
  });

  // Check access: admin, facilitator owner, or enrolled student
  const isOwner = classroom && user && classroom.facilitator_id === user.id;
  const isEnrolled = enrollments.some(e => e.student_id === user?.id && e.status === "approved");
  const hasAccess = isAdmin || isOwner || isEnrolled;

  if (userLoading || classroomLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">Classroom not found.</p>
            <Link to={isAdmin ? "/Admin" : isFacilitator ? "/Portal" : "/Home"}>
              <Button variant="outline">Back</Button>
            </Link>
          </CardContent>
        </Card>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            You don't have permission to access this classroom. Only the facilitator and enrolled students can view it.
          </p>
          <Link to={isAdmin ? "/Admin" : isFacilitator ? "/Portal" : "/Home"}>
            <Button className="brand-gradient text-white rounded-full px-8">Back</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(isFacilitator || isAdmin) && (
              <Link to={isAdmin ? "/Admin" : "/Portal"}>
                <Button variant="ghost" size="icon" className="w-auto px-2">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to={isAdmin ? "/Admin" : isFacilitator ? "/Portal" : "/Home"}>
              <Button variant="ghost" size="icon" className="w-auto px-2 gap-1">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Dashboard</span>
              </Button>
            </Link>
            {(isFacilitator || isAdmin) && (
              <Button variant="ghost" size="icon" className="w-auto px-2 gap-1" onClick={() => setEditOpen(true)}>
                <Pencil className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Edit Classroom</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Classroom Header */}
      <ClassroomHeader classroom={classroom} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <BrandTabsList tabs={[
            { value: "announcements", icon: <Bell className="w-3.5 h-3.5" />, label: "Announcements" },
            { value: "lessons", icon: <BookOpen className="w-3.5 h-3.5" />, label: "Lessons" },
            { value: "students", icon: <Users className="w-3.5 h-3.5" />, label: "Students" },
            ...((isFacilitator || isAdmin) ? [{ value: "grades", icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Grades" }] : []),
          ]} />

          <TabsContent value="announcements">
            <AnnouncementsSection classroom={classroom} />
          </TabsContent>

          <TabsContent value="lessons">
            <LessonsTab classroom={classroom} />
          </TabsContent>

          <TabsContent value="students">
            <StudentListSection classroom={classroom} isFacilitator={isFacilitator} />
          </TabsContent>

          {(isFacilitator || isAdmin) && (
            <TabsContent value="grades">
              <GradesSection classroom={classroom} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {editOpen && classroom && (
        <EditClassroomModal
          classroom={classroom}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  );
}