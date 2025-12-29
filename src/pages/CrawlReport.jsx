import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import SeverityBadge from "@/components/ui/SeverityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { ArrowLeft, ExternalLink, AlertCircle, CheckCircle, Clock, FileText, Bug, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

export default function CrawlReport() {
  const { t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const crawlId = urlParams.get("crawlId");
  const siteId = urlParams.get("siteId");

  const { data: site } = useQuery({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const sites = await base44.entities.Site.filter({ id: siteId });
      return sites[0];
    },
    enabled: !!siteId,
  });

  const { data: crawl, isLoading: crawlLoading } = useQuery({
    queryKey: ["crawl", crawlId],
    queryFn: async () => {
      const crawls = await base44.entities.Crawl.filter({ id: crawlId });
      return crawls[0];
    },
    enabled: !!crawlId,
  });

  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["crawl-pages", crawlId],
    queryFn: async () => {
      return base44.entities.Page.filter({ crawl_id: crawlId });
    },
    enabled: !!crawlId,
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ["crawl-issues", crawlId],
    queryFn: async () => {
      return base44.entities.Issue.filter({ crawl_id: crawlId });
    },
    enabled: !!crawlId,
  });

  const isLoading = crawlLoading || pagesLoading || issuesLoading;

  // Calculate statistics
  const stats = {
    totalPages: pages.length,
    successfulPages: pages.filter(p => p.status_code === 200).length,
    errorPages: pages.filter(p => p.status_code === 0 || p.status_code >= 400).length,
    totalIssues: issues.length,
    openIssues: issues.filter(i => i.status === "open").length,
    criticalIssues: issues.filter(i => i.severity === "critical" && i.status === "open").length,
    highIssues: issues.filter(i => i.severity === "high" && i.status === "open").length,
    mediumIssues: issues.filter(i => i.severity === "medium" && i.status === "open").length,
  };

  // Group issues by type
  const issuesByType = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) {
      acc[issue.type] = [];
    }
    acc[issue.type].push(issue);
    return acc;
  }, {});

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
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

  if (!crawl) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">{t("crawlReportNotFound")}</p>
        <Link to={createPageUrl(`Crawls?siteId=${siteId}`)}>
          <Button variant="outline" className="mt-4">{t("crawlReportBackToCrawls")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link 
          to={createPageUrl(`Crawls?siteId=${siteId}`)} 
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("crawlReportBackTo")}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{t("crawlReportTitle")}</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-slate-600">{site?.domain || "Unknown Site"}</p>
              <span className="text-slate-300">•</span>
              <p className="text-slate-500">
                {format(new Date(crawl.started_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
              <StatusBadge status={crawl.status} />
            </div>
          </div>
          {crawl.status === "done" && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              {t("crawlReportDuration")}: {crawl.finished_at 
                ? Math.round((new Date(crawl.finished_at) - new Date(crawl.started_at)) / 1000) + "s"
                : "N/A"}
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">{t("crawlReportTotalPages")}</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.totalPages}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-600">{stats.successfulPages} {t("crawlReportSuccessful")}</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">{t("crawlReportTotalIssues")}</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.totalIssues}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
              <Bug className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-amber-600">{stats.openIssues} {t("crawlReportOpen")}</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">{t("crawlReportCriticalIssues")}</p>
              <p className="text-2xl font-semibold text-red-600">{stats.criticalIssues}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
            {t("crawlReportRequiresAttention")}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">{t("crawlReportErrorPages")}</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.errorPages}</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
            {t("crawlReportFailedCrawl")}
          </div>
        </Card>
      </div>

      {/* Issues by Type */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{t("crawlReportIssuesByType")}</h2>
          <p className="text-sm text-slate-500 mt-1">{t("crawlReportBreakdown")}</p>
        </div>
        <div className="divide-y divide-slate-100">
          {Object.keys(issuesByType).length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">{t("crawlReportNoIssues")}</h3>
              <p className="text-slate-500">{t("crawlReportAllPassed")}</p>
            </div>
          ) : (
            Object.entries(issuesByType).map(([type, typeIssues]) => {
              const openCount = typeIssues.filter(i => i.status === "open").length;
              const criticalCount = typeIssues.filter(i => i.severity === "critical" && i.status === "open").length;
              
              return (
                <div key={type} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-slate-900 capitalize">
                        {type.replace(/_/g, " ")}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        {openCount} {openCount !== 1 ? t("crawlReportOpenIssues") : t("crawlReportOpenIssue")}
                        {criticalCount > 0 && (
                          <span className="text-red-600 ml-2">
                            ({criticalCount} {t("crawlReportCritical")})
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-slate-50">
                      {typeIssues.length} {t("crawlReportTotal")}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {typeIssues.slice(0, 3).map((issue) => (
                      <div key={issue.id} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <SeverityBadge severity={issue.severity} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-900 font-medium truncate">{issue.url}</p>
                            <p className="text-sm text-slate-600 mt-1">{issue.message}</p>
                            <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
                              <span className="font-medium">{t("crawlReportFix")}</span>
                              <span>{issue.how_to_fix}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {typeIssues.length > 3 && (
                      <p className="text-sm text-slate-500 text-center pt-2">
                        +{typeIssues.length - 3} {typeIssues.length - 3 !== 1 ? t("crawlReportMoreIssues") : t("crawlReportMoreIssue")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Crawled Pages */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{t("crawlReportCrawledPages")}</h2>
          <p className="text-sm text-slate-500 mt-1">{pages.length} {t("crawlReportPagesDiscovered")}</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="font-semibold text-slate-700">{t("crawlReportURL")}</TableHead>
              <TableHead className="font-semibold text-slate-700 w-[100px]">{t("crawlReportStatus")}</TableHead>
              <TableHead className="font-semibold text-slate-700">{t("crawlReportTitle")}</TableHead>
              <TableHead className="font-semibold text-slate-700 w-[100px]">{t("crawlReportIssues")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => {
              const pageIssues = issues.filter(i => i.url === page.url && i.status === "open");
              
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
                      {page.status_code || "ERR"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-600 truncate max-w-[250px]" title={page.title}>
                      {page.title || <span className="text-slate-400 italic">{t("crawlReportNoTitle")}</span>}
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
                        <span className="text-sm text-emerald-600">{t("crawlReportOK")}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}