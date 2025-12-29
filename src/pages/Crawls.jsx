import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/useAuth";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import { ArrowLeft, Clock, FileText, Bug, ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function Crawls() {
  useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get("siteId");

  const { data: site } = useQuery({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const sites = await base44.entities.Site.filter({ id: siteId });
      return sites[0];
    },
    enabled: !!siteId,
  });

  const { data: crawls = [], isLoading } = useQuery({
    queryKey: ["crawls", siteId],
    queryFn: async () => {
      return base44.entities.Crawl.filter({ site_id: siteId }, "-started_at");
    },
    enabled: !!siteId,
  });

  const { data: allIssues = [] } = useQuery({
    queryKey: ["allIssues"],
    queryFn: () => base44.entities.Issue.list(),
  });

  const getIssuesForCrawl = (crawlId) => {
    return allIssues.filter(i => i.crawl_id === crawlId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
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
      {/* Header */}
      <div>
        <Link 
          to={createPageUrl(`SiteOverview?siteId=${siteId}`)} 
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {site?.domain || "Site"}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Crawl History</h1>
        <p className="text-slate-500 mt-1">View all crawls for {site?.domain}</p>
      </div>

      {crawls.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No crawls yet</h3>
          <p className="text-slate-500">Start your first crawl to see results here</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-700">Started</TableHead>
                <TableHead className="font-semibold text-slate-700">Finished</TableHead>
                <TableHead className="font-semibold text-slate-700">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Pages</TableHead>
                <TableHead className="font-semibold text-slate-700">Issues</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crawls.map((crawl, index) => {
                const crawlIssues = getIssuesForCrawl(crawl.id);
                const openIssues = crawlIssues.filter(i => i.status === "open");
                
                return (
                  <TableRow key={crawl.id} className="group hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">
                          {format(new Date(crawl.started_at), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(crawl.started_at), "h:mm a")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {crawl.finished_at ? (
                        <div>
                          <p className="text-slate-600">
                            {format(new Date(crawl.finished_at), "h:mm a")}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(crawl.finished_at), { addSuffix: true })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={crawl.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <FileText className="w-4 h-4 text-slate-400" />
                        {crawl.pages_crawled}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Bug className="w-4 h-4 text-slate-400" />
                        {openIssues.length} open / {crawlIssues.length} total
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={createPageUrl(`CrawlReport?crawlId=${crawl.id}&siteId=${siteId}`)}>
                          <Button variant="outline" size="sm" className="h-8">
                            View Report
                          </Button>
                        </Link>
                        <Link to={createPageUrl(`Issues?siteId=${siteId}&crawlId=${crawl.id}`)}>
                          <Button size="sm" className="h-8 bg-slate-900 hover:bg-slate-800">
                            View Issues
                          </Button>
                        </Link>
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