import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import SeverityBadge from "@/components/ui/SeverityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { ArrowLeft, ExternalLink, FileText, Hash, Type, AlignLeft, Link as LinkIcon, Heading1 } from "lucide-react";

export default function PageDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get("siteId");
  const pageId = urlParams.get("pageId");

  const { data: site } = useQuery({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const sites = await base44.entities.Site.filter({ id: siteId });
      return sites[0];
    },
    enabled: !!siteId,
  });

  const { data: page, isLoading } = useQuery({
    queryKey: ["page", pageId],
    queryFn: async () => {
      const pages = await base44.entities.Page.filter({ id: pageId });
      return pages[0];
    },
    enabled: !!pageId,
  });

  const { data: issues = [] } = useQuery({
    queryKey: ["pageIssues", page?.url],
    queryFn: async () => {
      if (!page) return [];
      const allIssues = await base44.entities.Issue.filter({ crawl_id: page.crawl_id });
      return allIssues.filter(i => i.url === page.url);
    },
    enabled: !!page,
  });

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
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Page not found</p>
        <Link to={createPageUrl(`Pages?siteId=${siteId}`)}>
          <Button variant="outline" className="mt-4">Back to Pages</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link 
          to={createPageUrl(`Pages?siteId=${siteId}`)} 
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pages
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight break-all">
              {page.url}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className={getStatusColor(page.status_code)}>
                {page.status_code}
              </Badge>
              <a 
                href={page.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                Open page <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Page Details */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">Page Information</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Type className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-500">Title</p>
              <p className="text-slate-900 mt-1">
                {page.title || <span className="text-slate-400 italic">No title found</span>}
              </p>
            </div>
          </div>

          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlignLeft className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-500">Meta Description</p>
              <p className="text-slate-900 mt-1">
                {page.meta_description || <span className="text-slate-400 italic">No meta description found</span>}
              </p>
            </div>
          </div>

          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <LinkIcon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-500">Canonical URL</p>
              <p className="text-slate-900 mt-1 break-all">
                {page.canonical || <span className="text-slate-400 italic">No canonical URL set</span>}
              </p>
            </div>
          </div>

          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heading1 className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-500">H1 Tag</p>
              <p className="text-slate-900 mt-1">
                {page.h1 || <span className="text-slate-400 italic">No H1 found</span>}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {page.h1_count} H1 tag{page.h1_count !== 1 ? "s" : ""} on page
              </p>
            </div>
          </div>

          <div className="p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Hash className="w-5 h-5 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-500">Word Count</p>
              <p className="text-slate-900 mt-1">
                ~{page.word_count_estimate?.toLocaleString() || 0} words
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Page Issues */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-semibold text-slate-900">
            Issues on this page ({issues.length})
          </h2>
        </div>
        {issues.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-slate-600 font-medium">No issues found</p>
            <p className="text-sm text-slate-500 mt-1">This page looks good!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map((issue) => (
              <div key={issue.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <SeverityBadge severity={issue.severity} />
                      <StatusBadge status={issue.status} />
                      <span className="text-sm text-slate-500 capitalize">
                        {issue.type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-slate-900 font-medium">{issue.message}</p>
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">
                        <strong className="text-slate-700">How to fix:</strong> {issue.how_to_fix}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}