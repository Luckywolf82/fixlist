import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar } from "lucide-react";
import { format, parseISO, subDays, isAfter } from "date-fns";

export default function Analytics() {
  const [selectedSiteId, setSelectedSiteId] = useState("all");
  const [dateRange, setDateRange] = useState("30");

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: () => base44.entities.Site.list(),
  });

  const { data: crawls = [], isLoading: crawlsLoading } = useQuery({
    queryKey: ["crawls"],
    queryFn: () => base44.entities.Crawl.list("-started_at"),
  });

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ["issues"],
    queryFn: () => base44.entities.Issue.list(),
  });

  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["pages"],
    queryFn: () => base44.entities.Page.list(),
  });

  const filteredCrawls = useMemo(() => {
    let filtered = crawls;
    
    if (selectedSiteId !== "all") {
      filtered = filtered.filter(c => c.site_id === selectedSiteId);
    }
    
    if (dateRange !== "all") {
      const cutoffDate = subDays(new Date(), parseInt(dateRange));
      filtered = filtered.filter(c => isAfter(parseISO(c.started_at), cutoffDate));
    }
    
    return filtered;
  }, [crawls, selectedSiteId, dateRange]);

  // Crawls over time data
  const crawlsOverTime = useMemo(() => {
    const grouped = {};
    
    filteredCrawls.forEach(crawl => {
      const date = format(parseISO(crawl.started_at), "MMM d");
      if (!grouped[date]) {
        grouped[date] = { date, crawls: 0, pages: 0 };
      }
      grouped[date].crawls += 1;
      grouped[date].pages += crawl.pages_crawled || 0;
    });
    
    return Object.values(grouped).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }, [filteredCrawls]);

  // Issue severity distribution
  const issueDistribution = useMemo(() => {
    const crawlIds = new Set(filteredCrawls.map(c => c.id));
    const filtered = issues.filter(i => crawlIds.has(i.crawl_id) && i.status === "open");
    
    const distribution = [
      { name: "Critical", value: filtered.filter(i => i.severity === "critical").length, color: "#ef4444" },
      { name: "High", value: filtered.filter(i => i.severity === "high").length, color: "#f97316" },
      { name: "Medium", value: filtered.filter(i => i.severity === "medium").length, color: "#eab308" },
    ];
    
    return distribution.filter(d => d.value > 0);
  }, [issues, filteredCrawls]);

  // Issue types distribution
  const issueTypes = useMemo(() => {
    const crawlIds = new Set(filteredCrawls.map(c => c.id));
    const filtered = issues.filter(i => crawlIds.has(i.crawl_id) && i.status === "open");
    
    const types = {};
    filtered.forEach(issue => {
      const type = issue.type.replace(/_/g, " ");
      types[type] = (types[type] || 0) + 1;
    });
    
    return Object.entries(types)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [issues, filteredCrawls]);

  // Status code distribution
  const statusCodes = useMemo(() => {
    const crawlIds = new Set(filteredCrawls.map(c => c.id));
    const filtered = pages.filter(p => crawlIds.has(p.crawl_id));
    
    const codes = {};
    filtered.forEach(page => {
      const code = Math.floor(page.status_code / 100) * 100;
      const label = code === 200 ? "2xx Success" : code === 300 ? "3xx Redirect" : code === 400 ? "4xx Client Error" : code === 500 ? "5xx Server Error" : "Other";
      codes[label] = (codes[label] || 0) + 1;
    });
    
    return Object.entries(codes).map(([name, value]) => ({ name, value }));
  }, [pages, filteredCrawls]);

  // Site comparison
  const siteComparison = useMemo(() => {
    if (selectedSiteId !== "all") return [];
    
    return sites.map(site => {
      const siteCrawls = crawls.filter(c => c.site_id === site.id);
      const latestCrawl = siteCrawls[0];
      const siteIssues = latestCrawl 
        ? issues.filter(i => i.crawl_id === latestCrawl.id && i.status === "open")
        : [];
      
      return {
        name: site.domain.length > 20 ? site.domain.slice(0, 20) + "..." : site.domain,
        issues: siteIssues.length,
        critical: siteIssues.filter(i => i.severity === "critical").length,
        pages: latestCrawl?.pages_crawled || 0
      };
    }).filter(s => s.issues > 0 || s.pages > 0);
  }, [sites, crawls, issues, selectedSiteId]);

  const isLoading = sitesLoading || crawlsLoading || issuesLoading || pagesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Analytics</h1>
          <p className="text-slate-500 mt-1">Visualize crawl data and issue trends</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sites</SelectItem>
              {sites.map(site => (
                <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Crawl Activity Over Time */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-900">Crawl Activity Over Time</h2>
        </div>
        {crawlsOverTime.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            No crawl data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={crawlsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
              />
              <Legend />
              <Line type="monotone" dataKey="crawls" stroke="#3b82f6" strokeWidth={2} name="Crawls" />
              <Line type="monotone" dataKey="pages" stroke="#10b981" strokeWidth={2} name="Pages Crawled" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issue Severity Distribution */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Issue Severity Distribution</h2>
          </div>
          {issueDistribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No issues found
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {issueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Top Issue Types */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">Top Issue Types</h2>
          </div>
          {issueTypes.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No issues found
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={issueTypes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={12} width={120} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                />
                <Bar dataKey="value" fill="#f59e0b" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Status Code Distribution */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-slate-600" />
            <h2 className="font-semibold text-slate-900">HTTP Status Codes</h2>
          </div>
          {statusCodes.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">
              No page data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusCodes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                />
                <Bar dataKey="value" fill="#6366f1" name="Pages" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Site Comparison */}
        {selectedSiteId === "all" && siteComparison.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-600" />
              <h2 className="font-semibold text-slate-900">Site Comparison</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={siteComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                />
                <Legend />
                <Bar dataKey="issues" fill="#ef4444" name="Total Issues" />
                <Bar dataKey="critical" fill="#991b1b" name="Critical Issues" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}