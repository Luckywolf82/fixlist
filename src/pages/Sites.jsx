import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/useAuth";
import { usePermissions } from "@/components/usePermissions";
import { usePlanLimits } from "@/components/usePlanLimits";
import { useLanguage } from "@/components/LanguageContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import PlanLimitWarning from "@/components/PlanLimitWarning";
import OnboardingWizard from "@/components/OnboardingWizard";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, ExternalLink, Play, AlertCircle, Clock, FileText, Plus, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import ScheduleCrawlDialog from "@/components/ScheduleCrawlDialog";

export default function Sites() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();
  const { canAddSite, canDeleteSite, canStartCrawl, canManageSchedules } = usePermissions();
  const { organization, limits, canAddSite: canAddSiteByPlan, canCrawl } = usePlanLimits();
  const [crawlingIds, setCrawlingIds] = useState(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [scheduleDialogSite, setScheduleDialogSite] = useState(null);
  const queryClient = useQueryClient();

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: () => base44.entities.Site.list("-created_date"),
  });

  const { data: crawls = [] } = useQuery({
    queryKey: ["crawls"],
    queryFn: () => base44.entities.Crawl.list("-started_at"),
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["issues"],
    queryFn: () => base44.entities.Issue.list(),
  });

  const addSiteMutation = useMutation({
    mutationFn: async (domain) => {
      return base44.entities.Site.create({ domain });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setIsAddDialogOpen(false);
      setNewDomain("");
    },
  });

  const deleteSiteMutation = useMutation({
    mutationFn: async (siteId) => {
      return base44.entities.Site.delete(siteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ siteId, scheduleData }) => {
      // Calculate next_crawl_at
      const now = new Date();
      const [hours, minutes] = scheduleData.schedule_time.split(':').map(Number);
      const nextCrawl = new Date();
      nextCrawl.setHours(hours, minutes, 0, 0);
      
      if (scheduleData.schedule_enabled) {
        if (nextCrawl <= now) {
          nextCrawl.setDate(nextCrawl.getDate() + 1);
        }
        
        return base44.entities.Site.update(siteId, {
          ...scheduleData,
          next_crawl_at: nextCrawl.toISOString()
        });
      } else {
        return base44.entities.Site.update(siteId, {
          ...scheduleData,
          next_crawl_at: null
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      setScheduleDialogSite(null);
      toast.success(t('sitesScheduleUpdated'));
    },
  });

  const crawlMutation = useMutation({
    mutationFn: async ({ siteId }) => {
      const response = await base44.functions.invoke('crawlSite', { site_id: siteId, render_js: false });
      return { ...response.data, siteId };
    },
    onSuccess: (data) => {
        console.log('Crawl started with data:', data);
        toast.success('Crawl started! This may take a few minutes.', { duration: 5000 });
        // Poll for crawl completion
        const pollInterval = setInterval(async () => {
            console.log('Polling for crawl status:', data.crawl_id);
            const crawls = await base44.entities.Crawl.filter({ id: data.crawl_id });
            console.log('Crawl status:', crawls[0]);
            if (crawls[0]?.status === 'done' || crawls[0]?.status === 'failed') {
                clearInterval(pollInterval);
                console.log('Crawl finished! Invalidating queries...');
                queryClient.invalidateQueries({ queryKey: ["crawls"] });
                queryClient.invalidateQueries({ queryKey: ["issues"] });
                setCrawlingIds(prev => {
                    const next = new Set(prev);
                    next.delete(data.siteId);
                    return next;
                });
                if (crawls[0].status === 'done') {
                    toast.success(`Crawl completed! Found ${crawls[0].pages_crawled} pages.`);
                } else {
                    toast.error('Crawl failed. Please try again.');
                }
            }
        }, 3000);
      
      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setCrawlingIds(prev => {
          const next = new Set(prev);
          next.delete(data.siteId);
          return next;
        });
      }, 300000);
    },
    onError: (error, siteId) => {
      toast.error('Failed to start crawl. Please try again.');
      setCrawlingIds(prev => {
        const next = new Set(prev);
        next.delete(siteId);
        return next;
      });
    }
  });

  const handleStartCrawl = (siteId) => {
    if (!canCrawl()) {
      toast.error(t('sitesCrawlLimitReached'));
      return;
    }
    setCrawlingIds(prev => new Set(prev).add(siteId));
    crawlMutation.mutate({ siteId });
  };

  const handleAddSite = () => {
    if (!canAddSiteByPlan(sites.length)) {
      toast.error(`You've reached the maximum of ${limits.max_sites} sites on your plan. Please upgrade.`);
      return;
    }
    if (newDomain.trim()) {
      const cleanDomain = newDomain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
      addSiteMutation.mutate(cleanDomain);
    }
  };

  const handleDeleteSite = (siteId) => {
    if (confirm(t('sitesDeleteConfirm'))) {
      deleteSiteMutation.mutate(siteId);
    }
  };

  const getSiteStats = (siteId) => {
    const siteCrawls = crawls.filter(c => c.site_id === siteId);
    const latestCrawl = siteCrawls[0];
    const siteIssues = latestCrawl 
      ? issues.filter(i => i.crawl_id === latestCrawl.id && i.status === "open")
      : [];
    
    return {
      crawlCount: siteCrawls.length,
      lastCrawl: latestCrawl,
      openIssues: siteIssues.length,
      criticalCount: siteIssues.filter(i => i.severity === "critical").length,
    };
  };

  // Show onboarding if user doesn't have an organization
  if (!user?.organization_id) {
    return <UserNotRegisteredError user={user} />;
  }

  const showOnboarding = user && !user.onboarding_completed && sites.length === 0;

  if (authLoading || sitesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Card className="overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Onboarding Wizard */}
      {showOnboarding && (
        <OnboardingWizard 
          user={user} 
          onComplete={() => queryClient.invalidateQueries({ queryKey: ["currentUser"] })}
        />
      )}

      {/* Plan Limit Warnings */}
      {!canCrawl() && (
        <PlanLimitWarning message={`You've used all ${limits.max_crawls_per_month} crawls this month. Upgrade to continue crawling.`} />
      )}
      {!canAddSiteByPlan(sites.length) && (
        <PlanLimitWarning message={`You've reached the maximum of ${limits.max_sites} sites on your ${limits.name} plan.`} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{t('sitesTitle')}</h1>
          <p className="text-slate-500 mt-1">{t('sitesSubtitle')}</p>
        </div>
        {canAddSite && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              {t('sitesAddSite')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('sitesAddSiteDialogTitle')}</DialogTitle>
              <DialogDescription>
                {t('sitesAddSiteDialogDesc')}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder={t('sitesDomainPlaceholder')}
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                {t('sitesCancel')}
              </Button>
              <Button 
                onClick={handleAddSite}
                disabled={!newDomain.trim() || addSiteMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {addSiteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('sitesAdding')}
                  </>
                ) : (
                  t('sitesAdd')
                )}
              </Button>
            </DialogFooter>
            </DialogContent>
            </Dialog>
            )}
            </div>

      {sites.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t('sitesNoSites')}</h3>
          <p className="text-slate-500 mb-6">{t('sitesNoSitesDesc')}</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-700">{t('sitesDomain')}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t('sitesSchedule')}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t('sitesLastCrawl')}</TableHead>
                <TableHead className="font-semibold text-slate-700">{t('sitesIssues')}</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">{t('sitesActions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sites.map((site) => {
                const stats = getSiteStats(site.id);
                return (
                  <TableRow key={site.id} className="group hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{site.domain}</p>
                          <a 
                            href={`https://${site.domain}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                          >
                            {t('sitesVisitSite')} <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {site.schedule_enabled ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="w-4 h-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600">{t('sitesSchedule' + site.schedule_frequency.charAt(0).toUpperCase() + site.schedule_frequency.slice(1))}</span>
                          </div>
                          <p className="text-xs text-slate-500">{site.schedule_time}</p>
                          {site.next_crawl_at && (
                            <p className="text-xs text-slate-400">
                              Next: {format(new Date(site.next_crawl_at), "MMM d, HH:mm")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">{t('sitesScheduleDisabled')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {stats.lastCrawl ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {format(new Date(stats.lastCrawl.started_at), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-slate-400">{t('sitesNever')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {stats.criticalCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            {stats.criticalCount} {t('sitesCritical')}
                          </span>
                        )}
                        <span className="text-slate-600">{stats.openIssues} {t('sitesTotal')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canManageSchedules && (
                        <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-8"
                         onClick={() => setScheduleDialogSite(site)}
                        >
                         <Calendar className="w-3.5 h-3.5 mr-1.5" />
                         {t('sitesManageSchedule')}
                        </Button>
                        )}
                        {canStartCrawl && (
                        <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-8"
                         onClick={() => handleStartCrawl(site.id)}
                         disabled={crawlingIds.has(site.id)}
                        >
                         {crawlingIds.has(site.id) ? (
                           <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                         ) : (
                           <Play className="w-3.5 h-3.5 mr-1.5" />
                         )}
                         {crawlingIds.has(site.id) ? t('sitesStartCrawl') + '...' : t('sitesStartCrawl')}
                        </Button>
                        )}
                        <Link to={createPageUrl(`SiteOverview?siteId=${site.id}`)}>
                         <Button size="sm" className="h-8 bg-slate-900 hover:bg-slate-800">
                           {t('sitesViewDetails')}
                         </Button>
                        </Link>
                        {canDeleteSite && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteSite(site.id)}
                          disabled={deleteSiteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <ScheduleCrawlDialog
        site={scheduleDialogSite}
        open={!!scheduleDialogSite}
        onOpenChange={(open) => !open && setScheduleDialogSite(null)}
        onSave={(scheduleData) => {
          updateScheduleMutation.mutate({ 
            siteId: scheduleDialogSite.id, 
            scheduleData 
          });
        }}
      />
    </div>
  );
}