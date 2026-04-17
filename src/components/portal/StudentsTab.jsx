import React, { useState, useMemo, useEffect } from "react";
import { entities } from "@/api/entities";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Trash2, ArrowRight, Mail, X } from "lucide-react";
import { YEAR_LEVELS } from "../data/courseData";

export default function StudentsTab({ facilitatorId, selectedClassroom, onClearClassroom }) {
  const [search, setSearch] = useState("");
  const [classroomFilter, setClassroomFilter] = useState(selectedClassroom?.id || "all");
  const [showTransferModal, setShowTransferModal] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteClassroom, setInviteClassroom] = useState("");
  const queryClient = useQueryClient();

  // Sync external classroom selection
  useEffect(() => {
    if (selectedClassroom) setClassroomFilter(selectedClassroom.id);
  }, [selectedClassroom]);

  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms", facilitatorId],
    queryFn: () => entities.Classroom.filter({ facilitator_id: facilitatorId }),
    enabled: !!facilitatorId,
  });

  const { data: enrollments = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["enrollments-all"],
    queryFn: () => entities.Enrollment.list(),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users-list"],
    queryFn: () => entities.User.list(),
  });

  const myClassroomIds = new Set(classrooms.map(c => c.id));
  const approvedEnrollments = enrollments.filter(
    e => myClassroomIds.has(e.classroom_id) && e.status === "approved"
  );

  const userMap = useMemo(() => Object.fromEntries(allUsers.map(u => [u.id, u])), [allUsers]);

  const deleteEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId) => entities.Enrollment.delete(enrollmentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enrollments-all"] }),
  });

  const transferEnrollmentMutation = useMutation({
    mutationFn: ({ enrollmentId, newClassroomId }) => 
      entities.Enrollment.update(enrollmentId, { classroom_id: newClassroomId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments-all"] });
      setShowTransferModal(null);
    },
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: ({ email, classroomId }) => {
      const user = allUsers.find(u => u.email === email);
      if (!user) throw new Error("User not found");
      return entities.Enrollment.create({
        classroom_id: classroomId,
        student_id: user.id,
        student_email: user.email,
        student_name: `${user.first_name} ${user.last_name}`,
        status: "approved",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments-all"] });
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteClassroom("");
    },
  });

  const classroomMap = useMemo(() => Object.fromEntries(classrooms.map(c => [c.id, c])), [classrooms]);

  const filtered = useMemo(() => {
    return approvedEnrollments.filter(e => {
      const matchSearch = !search ||
        (e.student_name || "").toLowerCase().includes(search.toLowerCase()) ||
        e.student_email.toLowerCase().includes(search.toLowerCase());
      const matchClass = classroomFilter === "all" || e.classroom_id === classroomFilter;
      return matchSearch && matchClass;
    });
  }, [approvedEnrollments, search, classroomFilter]);

  const yearLevelLabel = (key) => YEAR_LEVELS[key]?.grade || key;

  if (enrollmentsLoading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={classroomFilter} onValueChange={(v) => { setClassroomFilter(v); onClearClassroom(); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Classrooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classrooms</SelectItem>
            {classrooms.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No enrolled students found.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Classroom</TableHead>
                  <TableHead>Year Level</TableHead>
                  <TableHead>Date Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(e => {
                   const cls = classroomMap[e.classroom_id];
                   return (
                     <TableRow key={e.id}>
                       <TableCell>
                         <p className="text-sm font-medium text-gray-900">
                           {(() => {
                             const user = userMap[e.student_id];
                             if (user) {
                               return `${user.honorifics ? `${user.honorifics} ` : ""}${user.first_name} ${user.last_name}`;
                             }
                             return e.student_name || "—";
                           })()}
                         </p>
                       </TableCell>
                       <TableCell className="text-xs text-gray-600">{e.student_email}</TableCell>
                       <TableCell className="text-xs text-gray-600">{cls?.school || "—"}</TableCell>
                       <TableCell className="text-sm text-gray-600">{cls?.name || "—"}</TableCell>
                       <TableCell>
                         <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                           {cls ? yearLevelLabel(cls.year_level_key) : "—"}
                         </Badge>
                       </TableCell>
                       <TableCell className="text-xs text-gray-600">
                         {e.created_date ? new Date(e.created_date).toLocaleDateString() : "—"}
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2">
                           <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Enrolled</Badge>
                           <button
                             onClick={() => setShowTransferModal(e)}
                             className="text-gray-400 hover:text-blue-600 transition-colors"
                             title="Transfer to another section"
                           >
                             <ArrowRight className="w-4 h-4" />
                           </button>
                           <button
                             onClick={() => { if (confirm(`Remove ${e.student_name}?`)) deleteEnrollmentMutation.mutate(e.id); }}
                             className="text-gray-400 hover:text-red-600 transition-colors"
                             title="Remove student"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
                       </TableCell>
                     </TableRow>
                   );
                 })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex gap-3">
        <Button
          onClick={() => setShowInviteModal(true)}
          className="brand-gradient text-white rounded-full gap-2"
          size="sm"
        >
          <Mail className="w-4 h-4" />
          Invite Students
        </Button>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTransferModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <button onClick={() => setShowTransferModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Transfer Student</h3>
            <p className="text-sm text-gray-500 mb-5">Move to another section</p>
            <Select defaultValue={showTransferModal.classroom_id} onValueChange={(val) => {
              if (val !== showTransferModal.classroom_id) {
                transferEnrollmentMutation.mutate({ enrollmentId: showTransferModal.id, newClassroomId: val });
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select classroom..." />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Invite Student</h3>
            <p className="text-sm text-gray-500 mb-5">Add existing user to a classroom</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Student Email *</label>
                <Input
                  placeholder="student@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Classroom *</label>
                <Select value={inviteClassroom} onValueChange={setInviteClassroom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select classroom..." />
                  </SelectTrigger>
                  <SelectContent>
                    {classrooms.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)} className="flex-1">Cancel</Button>
                <Button
                  onClick={() => {
                    if (!inviteEmail || !inviteClassroom) return;
                    createEnrollmentMutation.mutate({ email: inviteEmail, classroomId: inviteClassroom });
                  }}
                  className="flex-1 brand-gradient text-white"
                  disabled={createEnrollmentMutation.isPending || !inviteEmail || !inviteClassroom}
                >
                  {createEnrollmentMutation.isPending ? "Adding..." : "Add Student"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}