import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { entities } from "@/api/entities";
import { useAuth } from "@/lib/AuthContext";

export function useNotifications() {
  const { isAuthenticated } = useAuth();

  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      return user;
    },
    retry: false,
    enabled: isAuthenticated,
  });

  // Count pending facilitator requests (admin only)
  const { data: pendingFacilitators = [] } = useQuery({
    queryKey: ["pending-facilitators"],
    queryFn: () => entities.User.list(),
    enabled: !!user && user?.role === "admin",
    select: (data) => data.filter(u => u.facilitator_status === "pending"),
    staleTime: 5000,
  });

  // Count pending student enrollments (facilitator only)
  const { data: classrooms = [] } = useQuery({
    queryKey: ["classrooms", user?.id],
    queryFn: () => entities.Classroom.filter({ facilitator_id: user?.id }),
    enabled: !!user && user?.role === "facilitator",
  });

  const { data: pendingEnrollments = [] } = useQuery({
    queryKey: ["pending-enrollments", classrooms.map(c => c.id).join(',')],
    queryFn: () => entities.Enrollment.list(),
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
