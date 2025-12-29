import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/components/LanguageContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Calendar, Loader2, Plus, AlertCircle, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";

export default function Reports() {
  const { t } = useLanguage();
  const [selectedSiteId, setSelectedSiteId] = useState("all");
  const [generatingForSite, setGeneratingForSite] = useState(null);
  const [periodDays, setPeriodDays] = useState("30");

  const queryClient = useQueryClient();

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: () => base44.entities.Site.list("-created_date"),
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["reports", selectedSiteId],
    queryFn: async () => {
      if (selectedSiteId === "all") {
        return base44.entities.Report.list("-created_date");
      }
      return base44.entities.Report.filter({ site_id: selectedSiteId }, "-created_date");
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async ({ siteId, days }) => {
      // Get default template
      const templates = await base44.entities.ReportTemplate.filter({ is_default: true });
      const defaultTemplate = templates[0];
      
      const response = await base44.functions.invoke('generateEnhancedReport', { 
        site_id: siteId,
        period_days: parseInt(days),
        template_id: defaultTemplate?.id
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setGeneratingForSite(null);
      if (data.ai_summary) {
        toast.success("Report generated with AI insights!");
      }
    },
    onError: () => {
      setGeneratingForSite(null);
      toast.error("Failed to generate report");
    }
  });

  const handleGenerateReport = (siteId) => {
    setGeneratingForSite(siteId);
    generateReportMutation.mutate({ siteId, days: periodDays });
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.domain || t('reportsUnknownSite');
  };

  if (sitesLoading || reportsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{t('reportsTitle')}</h1>
          <p className="text-slate-500 mt-1">{t('reportsSubtitle') || 'Generate and download SEO reports'}</p>
        </div>
      </div>

      {/* Generate New Report Card */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-white border-slate-200">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">{t('reportsGenerate')}</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {t('reportsGenerateDesc') || 'Create a comprehensive SEO report including issue analysis, trends, and recommendations.'}
            </p>
            <div className="flex items-center gap-3">
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={t('reportsSelectSite')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reportsAllSites')}</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={periodDays} onValueChange={setPeriodDays}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">{t('reportsLast7Days') || 'Last 7 days'}</SelectItem>
                  <SelectItem value="30">{t('reportsLast30Days') || 'Last 30 days'}</SelectItem>
                  <SelectItem value="90">{t('reportsLast90Days') || 'Last 90 days'}</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => handleGenerateReport(selectedSiteId !== "all" ? selectedSiteId : sites[0]?.id)}
                disabled={generatingForSite !== null || sites.length === 0}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {generatingForSite ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('reportsGenerating')}
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    {t('reportsGenerate')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reports List */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-4">{t('reportsPreviousReports') || 'Previous Reports'}</h2>
        
        {reports.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">{t('reportsNoReports')}</h3>
            <p className="text-slate-500">{t('reportsNoReportsDesc')}</p>
          </Card>
        ) : (
          <Card className="overflow-hidden border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700">{t('reportsReport') || 'Report'}</TableHead>
                  <TableHead className="font-semibold text-slate-700">{t('reportsSite')}</TableHead>
                  <TableHead className="font-semibold text-slate-700">{t('reportsPeriod')}</TableHead>
                  <TableHead className="font-semibold text-slate-700">{t('reportsSummary')}</TableHead>
                  <TableHead className="font-semibold text-slate-700 w-[120px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="group hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-900">{report.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {t('reportsGenerated') || 'Generated'} {format(parseISO(report.created_date), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={createPageUrl(`SiteOverview?siteId=${report.site_id}`)}
                        className="text-slate-600 hover:text-slate-900 hover:underline"
                      >
                        {getSiteName(report.site_id)}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {format(parseISO(report.period_start), "MMM d")} - {format(parseISO(report.period_end), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <span>{report.summary?.total_pages || 0} {t('reportsPages')}</span>
                          <span>•</span>
                          <span>{report.summary?.total_issues || 0} {t('reportsTotalIssues').replace('total ', '') || 'issues'}</span>
                        </div>
                        {report.summary?.critical_issues > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="font-medium">{report.summary.critical_issues} {t('issuesCritical').toLowerCase()}</span>
                          </div>
                        )}
                        {report.ai_summary && (
                          <div className="flex items-center gap-1 text-purple-600">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="text-xs">{t('reportsAiInsights')}</span>
                          </div>
                        )}
                        {report.comparison_data && (
                          <div className="flex items-center gap-1">
                            {report.comparison_data.improvements?.length > report.comparison_data.regressions?.length ? (
                              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                            ) : report.comparison_data.regressions?.length > 0 ? (
                              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                            ) : null}
                            <span className="text-xs text-slate-500">{t('reportsVsPrevious')}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={report.pdf_url} 
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          {t('reportsDownload')}
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}