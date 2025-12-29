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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, FileText, Bug, AlertCircle, CheckCircle } from "lucide-react";

export default function Pages() {
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

  const { data: crawls = [] } = useQuery({
    queryKey: ["crawls", siteId],
    queryFn: async () => {
      return base44.entities.Crawl.filter({ site_id: siteId }, "-started_at");
    },
    enabled: !!siteId,
  });

  const latestCrawl = crawls[0];

  const { data: pages = [], isLoading } = useQuery({
    queryKey: ["pages", latestCrawl?.id],
    queryFn: async () => {
      if (!latestCrawl) return [];
      return base44.entities.Page.filter({ crawl_id: latestCrawl.id });
    },
    enabled: !!latestCrawl,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["issues", latestCrawl?.id],
    queryFn: async () => {
      if (!latestCrawl) return [];
      return base44.entities.Issue.filter({ crawl_id: latestCrawl.id });
    },
    enabled: !!latestCrawl,
  });

  const getIssuesForPage = (pageUrl) => {
    return issues.filter(i => i.url === pageUrl && i.status === "open");
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (statusCode >= 300 && statusCode < 400) return "bg-blue-50 text-blue-700 border-blue-200";
    if (statusCode >= 400 && statusCode < 500) return "bg-amber-50 text-amber-700 border-amber-200";
    if (statusCode >= 500) return "bg-red-50 text-red-700 border-red-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card className="overflow-hidden">
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
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
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Pages</h1>
        <p className="text-slate-500 mt-1">{pages.length} pages crawled</p>
      </div>

      {pages.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No pages found</h3>
          <p className="text-slate-500">Run a crawl to see pages here</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-700">URL</TableHead>
                <TableHead className="font-semibold text-slate-700 w-[100px]">Status</TableHead>
                <TableHead className="font-semibold text-slate-700">Title</TableHead>
                <TableHead className="font-semibold text-slate-700 w-[100px]">Issues</TableHead>
                <TableHead className="font-semibold text-slate-700 w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((page) => {
                const pageIssues = getIssuesForPage(page.url);
                
                return (
                  <TableRow key={page.id} className="group hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2 max-w-[300px]">
                        <span className="text-sm text-slate-700 truncate" title={page.url}>
                          {page.url}
                        </span>
                        <a 
                          href={page.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(page.status_code)}>
                        {page.status_code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600 truncate max-w-[250px]" title={page.title}>
                        {page.title || <span className="text-slate-400 italic">No title</span>}
                      </p>
                    </TableCell>
                    <TableCell>
                      {pageIssues.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Bug className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-600">{pageIssues.length}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-sm text-emerald-600">OK</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link to={createPageUrl(`PageDetail?siteId=${siteId}&pageId=${page.id}`)}>
                        <Button variant="outline" size="sm" className="h-8">
                          View
                        </Button>
                      </Link>
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