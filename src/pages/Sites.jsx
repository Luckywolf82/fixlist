import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
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
import { Globe, ExternalLink, Play, AlertCircle, Clock, FileText, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function Sites() {
  const [crawlingIds, setCrawlingIds] = useState(new Set());
  const [renderJsMap, setRenderJsMap] = useState({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState("");
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

  const crawlMutation = useMutation({
    mutationFn: async ({ siteId, renderJs }) => {
      const response = await base44.functions.invoke('crawlSite', { site_id: siteId, render_js: renderJs });
      return { ...response.data, siteId };
    },
    onSuccess: (data) => {
      toast.success('Crawl started! This may take a few minutes.', { duration: 5000 });
      // Poll for crawl completion
      const pollInterval = setInterval(async () => {
        const crawls = await base44.entities.Crawl.filter({ id: data.crawl_id });
        if (crawls[0]?.status === 'done' || crawls[0]?.status === 'failed') {
          clearInterval(pollInterval);
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
    setCrawlingIds(prev => new Set(prev).add(siteId));
    const renderJs = renderJsMap[siteId] || false;
    crawlMutation.mutate({ siteId, renderJs });
  };

  const handleAddSite = () => {
    if (newDomain.trim()) {
      const cleanDomain = newDomain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
      addSiteMutation.mutate(cleanDomain);
    }
  };

  const handleDeleteSite = (siteId) => {
    if (confirm('Are you sure you want to delete this site? All crawls, pages, and issues will be lost.')) {
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

  if (sitesLoading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Sites</h1>
          <p className="text-slate-500 mt-1">Manage and monitor your websites</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <Plus className="w-4 h-4 mr-2" />
              Add Site
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Site</DialogTitle>
              <DialogDescription>
                Enter the domain of the website you want to monitor
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="example.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddSite}
                disabled={!newDomain.trim() || addSiteMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {addSiteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Site'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sites.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No sites yet</h3>
          <p className="text-slate-500 mb-6">Add your first website to start monitoring</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-700">Domain</TableHead>
                <TableHead className="font-semibold text-slate-700">Crawls</TableHead>
                <TableHead className="font-semibold text-slate-700">Last Crawl</TableHead>
                <TableHead className="font-semibold text-slate-700">Open Issues</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
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
                            Visit site <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {stats.crawlCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      {stats.lastCrawl ? (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {format(new Date(stats.lastCrawl.started_at), "MMM d, yyyy")}
                        </div>
                      ) : (
                        <span className="text-slate-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {stats.criticalCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            {stats.criticalCount} critical
                          </span>
                        )}
                        <span className="text-slate-600">{stats.openIssues} total</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            id={`renderJs-${site.id}`}
                            checked={renderJsMap[site.id] || false}
                            onCheckedChange={(checked) => setRenderJsMap(prev => ({ ...prev, [site.id]: checked }))}
                            disabled={crawlingIds.has(site.id)}
                          />
                          <Label htmlFor={`renderJs-${site.id}`} className="text-xs text-slate-500 cursor-pointer whitespace-nowrap">
                            Render JS
                          </Label>
                        </div>
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
                          {crawlingIds.has(site.id) ? 'Crawling...' : 'Start Crawl'}
                        </Button>
                        <Link to={createPageUrl(`SiteOverview?siteId=${site.id}`)}>
                          <Button size="sm" className="h-8 bg-slate-900 hover:bg-slate-800">
                            View Site
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteSite(site.id)}
                          disabled={deleteSiteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}