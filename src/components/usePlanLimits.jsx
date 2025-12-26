import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const PLAN_LIMITS = {
  free: {
    name: "Free",
    max_sites: 3,
    max_crawls_per_month: 30,
    max_users: 2,
    features: ["Basic SEO scanning", "Issue detection", "Manual reports"],
    price: 0,
  },
  starter: {
    name: "Starter",
    max_sites: 10,
    max_crawls_per_month: 100,
    max_users: 5,
    features: ["Everything in Free", "Scheduled crawls", "AI prioritization", "Ahrefs integration"],
    price: 29,
  },
  professional: {
    name: "Professional",
    max_sites: 50,
    max_crawls_per_month: 500,
    max_users: 20,
    features: ["Everything in Starter", "Google Search Console", "White-label reports", "Priority support"],
    price: 99,
  },
  enterprise: {
    name: "Enterprise",
    max_sites: -1, // Unlimited
    max_crawls_per_month: -1, // Unlimited
    max_users: -1, // Unlimited
    features: ["Everything in Professional", "Custom integrations", "Dedicated support", "SLA"],
    price: 299,
  },
};

export function usePlanLimits() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: organization } = useQuery({
    queryKey: ["organization", user?.organization_id],
    queryFn: async () => {
      if (!user?.organization_id) return null;
      const orgs = await base44.entities.Organization.filter({ id: user.organization_id });
      return orgs[0];
    },
    enabled: !!user?.organization_id,
  });

  const plan = organization?.plan || "free";
  const limits = PLAN_LIMITS[plan];

  const canAddSite = (currentSiteCount) => {
    if (limits.max_sites === -1) return true;
    return currentSiteCount < limits.max_sites;
  };

  const canCrawl = () => {
    if (!organization) return false;
    if (limits.max_crawls_per_month === -1) return true;
    return organization.crawls_this_month < limits.max_crawls_per_month;
  };

  const isTrialing = organization?.subscription_status === "trialing";
  const isActive = organization?.subscription_status === "active";
  const isPastDue = organization?.subscription_status === "past_due";
  const isCanceled = organization?.subscription_status === "canceled";

  return {
    organization,
    plan,
    limits,
    canAddSite,
    canCrawl,
    isTrialing,
    isActive,
    isPastDue,
    isCanceled,
    needsUpgrade: !isActive && !isTrialing,
    allPlans: PLAN_LIMITS,
  };
}