import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Calendar, Loader2, Plus, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function Reports() {
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
      const response = await base44.functions.invoke('generateReport', { 
        site_id: siteId,
        period_days: parseInt(days)
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setGeneratingForSite(null);
    },
    onError: () => {
      setGeneratingForSite(null);
    }
  });

  const handleGenerateReport = (siteId) => {
    setGeneratingForSite(siteId);
    generateReportMutation.mutate({ siteId, days: periodDays });
  };

  const getSiteName = (siteId) => {
    const site = sites.find(s => s.id === siteId);
    return site?.domain || "Unknown Site";
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
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Reports</h1>
          <p className="text-slate-500 mt-1">Generate and download SEO reports</p>
        </div>
      </div>

      {/* Generate New Report Card */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-white border-slate-200">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">Generate New Report</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Create a comprehensive SEO report including issue analysis, trends, and recommendations.
            </p>
            <div className="flex items-center gap-3">
              <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sites</SelectItem>
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
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
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
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Reports List */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-4">Previous Reports</h2>
        
        {reports.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No reports yet</h3>
            <p className="text-slate-500">Generate your first report to get started</p>
          </Card>
        ) : (
          <Card className="overflow-hidden border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="font-semibold text-slate-700">Report</TableHead>
                  <TableHead className="font-semibold text-slate-700">Site</TableHead>
                  <TableHead className="font-semibold text-slate-700">Period</TableHead>
                  <TableHead className="font-semibold text-slate-700">Summary</TableHead>
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
                        Generated {format(parseISO(report.created_date), "MMM d, yyyy 'at' h:mm a")}
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
                          <span>{report.summary?.total_pages || 0} pages</span>
                          <span>•</span>
                          <span>{report.summary?.total_issues || 0} issues</span>
                        </div>
                        {report.summary?.critical_issues > 0 && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span className="font-medium">{report.summary.critical_issues} critical</span>
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
                          Download
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