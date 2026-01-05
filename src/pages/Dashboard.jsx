import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/useAuth";
import { useLanguage } from "@/components/LanguageContext";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Search, 
  AlertTriangle, 
  FileText, 
  Target,
  Palette,
  ArrowRight,
  BarChart3
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: () => base44.entities.Site.filter({ organization_id: user?.organization_id }),
    enabled: !!user?.organization_id,
  });

  const { data: allKeywords = [], isLoading: keywordsLoading } = useQuery({
    queryKey: ["allKeywords"],
    queryFn: () => base44.entities.Keyword.list(),
    enabled: !!user?.organization_id,
  });

  const { data: recentCrawls = [] } = useQuery({
    queryKey: ["recentCrawls"],
    queryFn: () => base44.entities.Crawl.list("-created_date", 10),
  });

  const { data: allIssues = [] } = useQuery({
    queryKey: ["allIssues"],
    queryFn: () => base44.entities.Issue.filter({ status: "open" }),
  });

  const { data: recentReports = [] } = useQuery({
    queryKey: ["recentReports"],
    queryFn: () => base44.entities.Report.list("-created_date", 5),
  });

  const { data: defaultTemplate } = useQuery({
    queryKey: ["defaultTemplate"],
    queryFn: async () => {
      const templates = await base44.entities.ReportTemplate.filter({ 
        organization_id: user?.organization_id,
        is_default: true 
      });
      return templates[0] || null;
    },
    enabled: !!user?.organization_id,
  });

  // Calculate keyword metrics
  const keywordsInTop10 = allKeywords.filter(k => k.current_position && k.current_position <= 10).length;
  const keywordsInTop3 = allKeywords.filter(k => k.current_position && k.current_position <= 3).length;
  const avgPosition = allKeywords.filter(k => k.current_position).length > 0
    ? Math.round(allKeywords.filter(k => k.current_position).reduce((sum, k) => sum + k.current_position, 0) / allKeywords.filter(k => k.current_position).length)
    : 0;
  
  const keywordsImproving = allKeywords.filter(k => 
    k.current_position && k.previous_position && k.current_position < k.previous_position
  ).length;
  
  const keywordsDeclining = allKeywords.filter(k => 
    k.current_position && k.previous_position && k.current_position > k.previous_position
  ).length;

  // Issue metrics
  const criticalIssues = allIssues.filter(i => i.severity === "critical").length;
  const highIssues = allIssues.filter(i => i.severity === "high").length;

  // Recent crawl metrics
  const successfulCrawls = recentCrawls.filter(c => c.status === "done").length;
  const totalPagesCrawled = recentCrawls.reduce((sum, c) => sum + (c.pages_crawled || 0), 0);

  if (sitesLoading || keywordsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your SEO performance</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Active Sites</p>
              <p className="text-3xl font-bold text-slate-900">{sites.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <Link to={createPageUrl("Sites")} className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-flex items-center">
            View sites <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Tracked Keywords</p>
              <p className="text-3xl font-bold text-slate-900">{allKeywords.length}</p>
              <p className="text-xs text-slate-500 mt-1">{keywordsInTop10} in top 10</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <Link to={createPageUrl("KeywordTracking")} className="text-sm text-purple-600 hover:text-purple-700 mt-4 inline-flex items-center">
            Manage keywords <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Open Issues</p>
              <p className="text-3xl font-bold text-slate-900">{allIssues.length}</p>
              <p className="text-xs text-red-600 mt-1">{criticalIssues} critical</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <Link to={createPageUrl("Sites")} className="text-sm text-red-600 hover:text-red-700 mt-4 inline-flex items-center">
            View issues <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Recent Reports</p>
              <p className="text-3xl font-bold text-slate-900">{recentReports.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <Link to={createPageUrl("Reports")} className="text-sm text-green-600 hover:text-green-700 mt-4 inline-flex items-center">
            View reports <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Card>
      </div>

      {/* Keyword Performance Section */}
      {allKeywords.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">Keyword Rankings</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Top 3 Rankings</span>
                <Badge className="bg-green-100 text-green-700 font-mono">{keywordsInTop3}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Top 10 Rankings</span>
                <Badge className="bg-blue-100 text-blue-700 font-mono">{keywordsInTop10}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Average Position</span>
                <Badge variant="outline" className="font-mono">
                  {avgPosition > 0 ? `#${avgPosition}` : '-'}
                </Badge>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Improving</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{keywordsImproving}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-600">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-sm font-medium">Declining</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{keywordsDeclining}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">Crawl Activity</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Recent Crawls</span>
                <Badge variant="outline">{recentCrawls.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Successful</span>
                <Badge className="bg-green-100 text-green-700">{successfulCrawls}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pages Crawled</span>
                <Badge variant="outline" className="font-mono">{totalPagesCrawled.toLocaleString()}</Badge>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Critical Issues</span>
                  <span className="text-lg font-bold text-red-600">{criticalIssues}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">High Priority</span>
                  <span className="text-lg font-bold text-orange-600">{highIssues}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Default Template Display */}
      {defaultTemplate && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Default Report Template</h2>
          </div>
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Template Name</p>
                <p className="font-medium text-slate-900">{defaultTemplate.name}</p>
              </div>
              {defaultTemplate.company_name && (
                <div>
                  <p className="text-sm text-slate-500">Company</p>
                  <p className="font-medium text-slate-900">{defaultTemplate.company_name}</p>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Brand Color</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: defaultTemplate.primary_color }}
                    />
                    <span className="text-sm text-slate-600 font-mono">{defaultTemplate.primary_color}</span>
                  </div>
                </div>
              </div>
              {defaultTemplate.logo_url && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Logo</p>
                  <img src={defaultTemplate.logo_url} alt="Logo" className="h-10 object-contain" />
                </div>
              )}
            </div>
            <Link to={createPageUrl("ReportTemplates")}>
              <Button variant="outline" size="sm">
                Manage Templates
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link to={createPageUrl("Sites")}>
            <Button variant="outline" className="w-full justify-start">
              <Globe className="w-4 h-4 mr-2" />
              Add New Site
            </Button>
          </Link>
          <Link to={createPageUrl("KeywordTracking")}>
            <Button variant="outline" className="w-full justify-start">
              <Search className="w-4 h-4 mr-2" />
              Track Keywords
            </Button>
          </Link>
          <Link to={createPageUrl("Reports")}>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </Link>
          <Link to={createPageUrl("Analytics")}>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}