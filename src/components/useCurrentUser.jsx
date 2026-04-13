import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import { entities } from "@/api/entities";

export function useCurrentUser() {
  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw error || new Error("Not authenticated");
      const meta = user.user_metadata || {};
      return {
        id: user.id,
        email: user.email,
        first_name: meta.first_name || meta.full_name?.split(" ")[0] || "",
        last_name: meta.last_name || meta.full_name?.split(" ").slice(1).join(" ") || "",
        full_name: meta.full_name || "",
        avatar_url: meta.avatar_url || meta.picture || "",
        role: "guest",
      };
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const { data: userAccount, isLoading: accountLoading } = useQuery({
    queryKey: ["user-account", authUser?.email],
    queryFn: async () => {
      const accounts = await entities.UserAccount.filter({ email: authUser.email });
      if (accounts.length > 0) return accounts[0];

      // Auto-create UserAccount on first login, using Google profile data
      const hasName = !!(authUser.first_name && authUser.last_name);
      return await entities.UserAccount.create({
        user_id: authUser.id,
        email: authUser.email,
        first_name: authUser.first_name || "",
        last_name: authUser.last_name || "",
        role: "guest",
        facilitator_status: "none",
        school_organization: "",
        // Auto-complete onboarding if Google provided name
        onboarding_completed: hasName,
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
