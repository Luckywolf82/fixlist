import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function usePermissions() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const role = user?.custom_role || user?.role === 'admin' ? 'administrator' : 'editor';

  const permissions = {
    // Viewer: Can only view data
    viewer: {
      canViewSites: true,
      canAddSite: false,
      canDeleteSite: false,
      canStartCrawl: false,
      canManageSchedules: false,
      canUpdateIssues: false,
      canGenerateReports: true,
      canAccessSettings: false,
      canManageUsers: false,
    },
    // Editor: Can manage content but not settings
    editor: {
      canViewSites: true,
      canAddSite: true,
      canDeleteSite: false,
      canStartCrawl: true,
      canManageSchedules: true,
      canUpdateIssues: true,
      canGenerateReports: true,
      canAccessSettings: false,
      canManageUsers: false,
    },
    // Administrator: Full access
    administrator: {
      canViewSites: true,
      canAddSite: true,
      canDeleteSite: true,
      canStartCrawl: true,
      canManageSchedules: true,
      canUpdateIssues: true,
      canGenerateReports: true,
      canAccessSettings: true,
      canManageUsers: true,
    },
  };

  return {
    user,
    role,
    ...permissions[role],
    isAdmin: role === 'administrator',
    isEditor: role === 'editor',
    isViewer: role === 'viewer',
  };
}