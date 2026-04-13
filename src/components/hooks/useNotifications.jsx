import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useNotifications() {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  // Count pending facilitator requests (admin only)
  const { data: pendingFacilitators = [] } = useQuery({
    queryKey: ["pending-facilitators"],
    queryFn: () => base44.entities.User.list(),
    enabled: user?.role === "admin",
    select: (data) => data.filter(u => u.facilitator_status === "pending"),
    staleTime: 5000,
  });

  // Count pending student enrollments (facilitator only)
  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms", user?.id],
    queryFn: () => base44.entities.Classroom.filter({ facilitator_id: user?.id }),
    enabled: user?.role === "facilitator",
  });

  const { data: pendingEnrollments = [] } = useQuery({
    queryKey: ["pending-enrollments", classrooms.map(c => c.id).join(',')],
    queryFn: () => base44.entities.Enrollment.list(),
    enabled: classrooms.length > 0,
    select: (data) => data.filter(e => e.status === "pending" && classrooms.some(c => c.id === e.classroom_id)),
    staleTime: 5000,
  });

  return {
    user,
    pendingFacilitatorsCount: pendingFacilitators.length,
    pendingEnrollmentsCount: pendingEnrollments.length,
  };
}