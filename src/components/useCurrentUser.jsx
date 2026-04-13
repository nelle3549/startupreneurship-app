import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useCurrentUser() {
  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: userAccount, isLoading: accountLoading } = useQuery({
    queryKey: ["user-account", authUser?.email],
    queryFn: async () => {
      const accounts = await base44.entities.UserAccount.filter({ email: authUser.email });
      if (accounts.length > 0) return accounts[0];
      // Auto-create UserAccount on first login, migrating existing role data
      return await base44.entities.UserAccount.create({
        user_id: authUser.id,
        email: authUser.email,
        first_name: authUser.first_name || "",
        last_name: authUser.last_name || "",
        role: authUser.role === "admin" ? "admin" : "guest",
        facilitator_status: authUser.facilitator_status || "none",
        school_organization: authUser.school_organization || "",
      });
    },
    enabled: !!authUser?.email,
    staleTime: 1000 * 60 * 5,
  });

  // Merge authUser + userAccount — UserAccount is source of truth for app-specific fields
  const user = authUser ? {
    ...authUser,
    first_name: userAccount?.first_name || authUser?.first_name,
    last_name: userAccount?.last_name || authUser?.last_name,
    full_name: [userAccount?.first_name, userAccount?.last_name].filter(Boolean).join(" ") || authUser?.full_name || "",
    role: userAccount?.role || authUser?.role || "guest",
    facilitator_status: userAccount?.facilitator_status || "none",
    extension: userAccount?.extension,
    gender: userAccount?.gender,
    school_organization: userAccount?.school_organization || authUser?.school_organization,
    province: userAccount?.province,
    city_municipality: userAccount?.city_municipality,
    account_id: userAccount?.id,
  } : null;

  const isAdmin = authUser?.role === "admin" || userAccount?.role === "admin";
  const isFacilitator = userAccount?.role === "facilitator" && userAccount?.facilitator_status === "approved";
  const isStudent = userAccount?.role === "student";

  return {
    user,
    userAccount,
    isLoading: authLoading || (!!authUser && accountLoading),
    error: null,
    isAdmin,
    isFacilitator,
    isStudent,
  };
}