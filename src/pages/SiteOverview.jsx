import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import StatCard from "@/components/dashboard/StatCard";
import { AlertCircle, AlertTriangle, Info, ArrowLeft, Clock, FileText, Bug, ExternalLink, Play, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function SiteOverview() {
  const [isCrawling, setIsCrawling] = useState(false);
  const [renderJs, setRenderJs] = useState(false);
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get("siteId");

  const { data: site, isLoading: siteLoading } = useQuery({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const sites = await base44.entities.Site.filter({ id: siteId });
      return sites[0];
    },
    enabled: !!siteId,
  });

  const { data: crawls = [] } = useQuery({
    queryKey: ["crawls", siteId],
    queryFn: async () => {
      const allCrawls = await base44.entities.Crawl.filter({ site_id: siteId }, "-started_at");
      return allCrawls;
    },
    enabled: !!siteId,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["issues", siteId],
    queryFn: async () => {
      if (crawls.length === 0) return [];
      const latestCrawl = crawls[0];
      return base44.entities.Issue.filter({ crawl_id: latestCrawl.id });
    },
    enabled: crawls.length > 0,
  });

  const { data: previousIssues = [] } = useQuery({
    queryKey: ["previousIssues", siteId],
    queryFn: async () => {
      if (crawls.length < 2) return [];
      const previousCrawl = crawls[1];
      return base44.entities.Issue.filter({ crawl_id: previousCrawl.id });
    },
    enabled: crawls.length > 1,
  });

  const crawlMutation = useMutation({
    mutationFn: async ({ siteId, renderJs }) => {
      const response = await base44.functions.invoke('crawlSite', { site_id: siteId, render_js: renderJs });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Crawl started! This may take a few minutes.', { duration: 5000 });
      // Poll for crawl completion
      const pollInterval = setInterval(async () => {
        const crawls = await base44.entities.Crawl.filter({ id: data.crawl_id });
        if (crawls[0]?.status === 'done' || crawls[0]?.status === 'failed') {
          clearInterval(pollInterval);
          queryClient.invalidateQueries({ queryKey: ["crawls", siteId] });
          queryClient.invalidateQueries({ queryKey: ["issues", siteId] });
          setIsCrawling(false);
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
        setIsCrawling(false);
      }, 300000);
    },
    onError: () => {
      toast.error('Failed to start crawl. Please try again.');
      setIsCrawling(false);
    }
  });

  const handleStartCrawl = () => {
    setIsCrawling(true);
    crawlMutation.mutate({ siteId, renderJs });
  };

  const latestCrawl = crawls[0];
  const openIssues = issues.filter(i => i.status === "open");
  const previousOpenIssues = previousIssues.filter(i => i.status === "open");

  const criticalCount = openIssues.filter(i => i.severity === "critical").length;
  const highCount = openIssues.filter(i => i.severity === "high").length;
  const mediumCount = openIssues.filter(i => i.severity === "medium").length;

  const prevCriticalCount = previousOpenIssues.filter(i => i.severity === "critical").length;
  const prevHighCount = previousOpenIssues.filter(i => i.severity === "high").length;
  const prevMediumCount = previousOpenIssues.filter(i => i.severity === "medium").length;

  const getChange = (current, previous) => {
    if (crawls.length < 2) return null;
    return current - previous;
  };

  if (siteLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Site not found</p>
        <Link to={createPageUrl("Sites")}>
          <Button variant="outline" className="mt-4">Back to Sites</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link 
            to={createPageUrl("Sites")} 
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sites
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{site.domain}</h1>
            <a 
              href={`https://${site.domain}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-600"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
          {latestCrawl && (
            <p className="text-slate-500 mt-1">
              Last crawled {format(new Date(latestCrawl.started_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-2">
            <Checkbox 
              id="renderJs" 
              checked={renderJs} 
              onCheckedChange={setRenderJs}
              disabled={isCrawling}
            />
            <Label htmlFor="renderJs" className="text-sm text-slate-600 cursor-pointer">
              Render JavaScript (langsommere, men bedre for SPA-er)
            </Label>
          </div>
          <Button 
            onClick={handleStartCrawl}
            disabled={isCrawling}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {isCrawling ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isCrawling ? 'Starting Crawl...' : 'Start New Crawl'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Critical Issues"
          value={criticalCount}
          change={getChange(criticalCount, prevCriticalCount)}
          icon={AlertCircle}
          variant="critical"
        />
        <StatCard
          label="High Priority"
          value={highCount}
          change={getChange(highCount, prevHighCount)}
          icon={AlertTriangle}
          variant="high"
        />
        <StatCard
          label="Medium Priority"
          value={mediumCount}
          change={getChange(mediumCount, prevMediumCount)}
          icon={Info}
          variant="medium"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={createPageUrl(`Crawls?siteId=${siteId}`)}>
          <Card className="p-5 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Crawl History</p>
                  <p className="text-sm text-slate-500">{crawls.length} crawls</p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-slate-300 rotate-180 group-hover:text-slate-500 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to={createPageUrl(`Issues?siteId=${siteId}`)}>
          <Card className="p-5 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <Bug className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">All Issues</p>
                  <p className="text-sm text-slate-500">{openIssues.length} open issues</p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-slate-300 rotate-180 group-hover:text-slate-500 transition-colors" />
            </div>
          </Card>
        </Link>

        <Link to={createPageUrl(`Pages?siteId=${siteId}`)}>
          <Card className="p-5 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Pages</p>
                  <p className="text-sm text-slate-500">{latestCrawl?.pages_crawled || 0} pages crawled</p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-slate-300 rotate-180 group-hover:text-slate-500 transition-colors" />
            </div>
          </Card>
        </Link>
        </div>

        {/* Health Report Link */}
        {latestCrawl && (
        <Link to={createPageUrl(`HealthReport?siteId=${siteId}`)}>
          <Card className="p-5 hover:border-slate-300 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Health Report</p>
                  <p className="text-sm text-slate-500">View performance trends</p>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-slate-300 rotate-180 group-hover:text-slate-500 transition-colors" />
            </div>
          </Card>
        </Link>
        )}
        </div>

      {/* Recent Critical Issues */}
      {criticalCount > 0 && (
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Critical Issues Requiring Attention</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {openIssues.filter(i => i.severity === "critical").slice(0, 5).map((issue) => (
              <div key={issue.id} className="p-5 hover:bg-slate-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{issue.message}</p>
                    <p className="text-sm text-slate-500 truncate mt-1">{issue.url}</p>
                  </div>
                  <Link to={createPageUrl(`Issues?siteId=${siteId}`)}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}