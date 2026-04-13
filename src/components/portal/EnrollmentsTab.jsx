import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Users } from "lucide-react";

export default function EnrollmentsTab({ facilitatorId }) {
  const queryClient = useQueryClient();

  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms", facilitatorId],
    queryFn: () => base44.entities.Classroom.filter({ facilitator_id: facilitatorId }),
    enabled: !!facilitatorId,
  });

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments-all", classrooms.map(c => c.id).join(',')],
    queryFn: () => base44.entities.Enrollment.list(),
    enabled: !!facilitatorId && classrooms.length > 0,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Enrollment.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollments-all"] });
    },
  });

  const classroomMap = useMemo(() => {
    return Object.fromEntries(classrooms.map(c => [c.id, c]));
  }, [classrooms]);

  // Only show enrollments for this facilitator's classrooms
  const myClassroomIds = new Set(classrooms.map(c => c.id));
  const myEnrollments = enrollments.filter(e => myClassroomIds.has(e.classroom_id));

  const pending = myEnrollments.filter(e => e.status === "pending");
  const approved = myEnrollments.filter(e => e.status === "approved");
  const rejected = myEnrollments.filter(e => e.status === "rejected");

  const EnrollmentRow = ({ e }) => {
    const cls = classroomMap[e.classroom_id];
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-gray-100 last:border-0">
        <div>
          <p className="text-sm font-medium text-gray-900">{e.student_name || e.student_email}</p>
          <p className="text-xs text-gray-400">{e.student_email}</p>
          {cls && <p className="text-xs text-blue-600 mt-0.5">{cls.name}</p>}
        </div>
        <div className="flex items-center gap-2">
          {e.status === "pending" && (
            <>
              <Button
                size="sm"
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-7 px-3 text-xs"
                onClick={() => updateMutation.mutate({ id: e.id, status: "approved" })}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 rounded-full h-7 px-3 text-xs"
                onClick={() => updateMutation.mutate({ id: e.id, status: "rejected" })}
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </Button>
            </>
          )}
          {e.status === "approved" && (
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Enrolled</Badge>
          )}
          {e.status === "rejected" && (
            <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Rejected</Badge>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <CardTitle className="text-sm font-semibold text-gray-800">Pending Requests</CardTitle>
            {pending.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">{pending.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No pending enrollment requests.</p>
          ) : (
            <div>{pending.map(e => <EnrollmentRow key={e.id} e={e} />)}</div>
          )}
        </CardContent>
      </Card>

      {/* Approved */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <CardTitle className="text-sm font-semibold text-gray-800">Accepted</CardTitle>
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">{approved.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {approved.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No accepted enrollments yet.</p>
          ) : (
            <div>{approved.map(e => <EnrollmentRow key={e.id} e={e} />)}</div>
          )}
        </CardContent>
      </Card>

      {/* Rejected */}
      {rejected.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-gray-400" />
              <CardTitle className="text-sm font-semibold text-gray-800">Rejected</CardTitle>
              <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">{rejected.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div>{rejected.map(e => <EnrollmentRow key={e.id} e={e} />)}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}