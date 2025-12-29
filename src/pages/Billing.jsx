import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePlanLimits } from "@/components/usePlanLimits";
import { usePermissions } from "@/components/usePermissions";
import { useLanguage } from "@/components/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Check, Zap, Shield, Crown, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function Billing() {
  const { t } = useLanguage();
  const { isAdmin } = usePermissions();
  const { organization, plan, limits, allPlans, isTrialing, isActive, isPastDue } = usePlanLimits();
  const [loading, setLoading] = useState(null);
  const queryClient = useQueryClient();

  const createCheckoutMutation = useMutation({
    mutationFn: async (selectedPlan) => {
      const response = await base44.functions.invoke('createStripeCheckout', { 
        plan: selectedPlan,
        organization_id: organization.id 
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast.error("Failed to create checkout session");
      setLoading(null);
    },
  });

  const manageBillingMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('createStripeBillingPortal', {
        organization_id: organization.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast.error("Failed to access billing portal");
    },
  });

  const handleUpgrade = (selectedPlan) => {
    setLoading(selectedPlan);
    createCheckoutMutation.mutate(selectedPlan);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">{t('settingsAccessDenied')}</h1>
        <Card className="p-12 text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">{t('billingAdminOnly') || 'Only administrators can manage billing.'}</p>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    );
  }

  const planIcons = {
    free: Zap,
    starter: TrendingUp,
    professional: Crown,
    enterprise: Shield,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{t('billingTitle')}</h1>
        <p className="text-slate-500 mt-1">{t('billingSubtitle') || 'Manage your subscription and billing'}</p>
      </div>

      {/* Current Plan */}
      <Card className="p-6 border-2 border-purple-200 bg-purple-50/30">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-900">{t('billingCurrentPlan')}: {limits.name}</h3>
              {isTrialing && (
                <Badge className="bg-blue-100 text-blue-700">{t('billingTrial') || 'Trial'}</Badge>
              )}
              {isPastDue && (
                <Badge className="bg-red-100 text-red-700">{t('billingPastDue') || 'Past Due'}</Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-slate-600">
              <p>• {limits.max_sites === -1 ? t('pricingUnlimited') : limits.max_sites} {t('pricingSites')}</p>
              <p>• {limits.max_crawls_per_month === -1 ? t('pricingUnlimited') : limits.max_crawls_per_month} {t('pricingCrawls')}</p>
              <p>• {organization.crawls_this_month} {t('superAdminCrawlsThisMonth')?.toLowerCase() || 'crawls used this month'}</p>
              {isTrialing && organization.trial_ends_at && (
                <p className="text-blue-600 font-medium">Trial ends {format(new Date(organization.trial_ends_at), "MMM d, yyyy")}</p>
              )}
            </div>
          </div>
          {organization.stripe_subscription_id && (
            <Button
              variant="outline"
              onClick={() => manageBillingMutation.mutate()}
              disabled={manageBillingMutation.isPending}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {t('billingManageBilling')}
            </Button>
          )}
        </div>
      </Card>

      {/* Pricing Plans */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">{t('billingChoosePlan') || 'Choose Your Plan'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(allPlans).map(([key, planData]) => {
            const Icon = planIcons[key];
            const isCurrentPlan = plan === key;
            const isPremium = key === "professional" || key === "enterprise";

            return (
              <Card 
                key={key} 
                className={`p-6 relative ${isPremium ? 'border-2 border-purple-300' : ''} ${isCurrentPlan ? 'ring-2 ring-slate-900' : ''}`}
              >
                {isPremium && (
                  <Badge className="absolute top-4 right-4 bg-purple-100 text-purple-700">
                    {t('pricingPopular')}
                  </Badge>
                )}
                
                <div className="mb-4">
                  <Icon className={`w-8 h-8 mb-3 ${isPremium ? 'text-purple-600' : 'text-slate-600'}`} />
                  <h3 className="text-xl font-bold text-slate-900">{planData.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-slate-900">${planData.price}</span>
                    <span className="text-slate-500 ml-1">{t('pricingPerMonth')}</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {planData.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <p className="text-xs text-slate-500">
                    • {planData.max_sites === -1 ? t('pricingUnlimited') : planData.max_sites} {t('pricingSites')}
                  </p>
                  <p className="text-xs text-slate-500">
                    • {planData.max_crawls_per_month === -1 ? t('pricingUnlimited') : planData.max_crawls_per_month} {t('pricingCrawls')}
                  </p>
                  <p className="text-xs text-slate-500">
                    • {planData.max_users === -1 ? t('pricingUnlimited') : planData.max_users} team members
                  </p>
                </div>

                <Button
                  className={`w-full mt-6 ${isCurrentPlan ? 'bg-slate-300 cursor-not-allowed' : isPremium ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                  disabled={isCurrentPlan || loading === key || key === 'free'}
                  onClick={() => handleUpgrade(key)}
                >
                  {loading === key ? (
                    t('commonLoading')
                  ) : isCurrentPlan ? (
                    t('billingCurrentPlan')
                  ) : key === 'free' ? (
                    t('billingDefaultPlan') || 'Default Plan'
                  ) : (
                    t('billingUpgrade')
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}