import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useAuth(requireOrganization = true) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (err) {
        return null;
      }
    },
  });

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!user) {
      base44.auth.redirectToLogin('/Sites');
      return;
    }

    // Requires organization but user doesn't have one
    if (requireOrganization && !user.organization_id) {
      // This is handled by UserNotRegisteredError component
      return;
    }
  }, [user, isLoading, requireOrganization]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    hasOrganization: !!user?.organization_id,
  };
}