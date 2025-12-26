import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { ArrowLeft, TrendingUp, AlertCircle, Clock, Zap } from "lucide-react";

export default function HealthReport() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get("siteId");
  const [dateRange, setDateRange] = useState("30");

  const { data: site } = useQuery({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const sites = await base44.entities.Site.filter({ id: siteId });
      return sites[0];
    },
    enabled: !!siteId,
  });

  const { data: crawls = [], isLoading: crawlsLoading } = useQuery({
    queryKey: ["crawls", siteId],
    queryFn: () => base44.entities.Crawl.filter({ site_id: siteId }, "-started_at"),
    enabled: !!siteId,
  });

  const { data: allPages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ["allPages", siteId],
    queryFn: async () => {
      if (crawls.length === 0) return [];
      const crawlIds = crawls.map(c => c.id);
      const pages = await Promise.all(
        crawlIds.map(id => base44.entities.Page.filter({ crawl_id: id }))
      );
      return pages.flat();
    },
    enabled: crawls.length > 0,
  });

  const { data: allIssues = [] } = useQuery({
    queryKey: ["allIssues", siteId],
    queryFn: async () => {
      if (crawls.length === 0) return [];
      const crawlIds = crawls.map(c => c.id);
      const issues = await Promise.all(
        crawlIds.map(id => base44.entities.Issue.filter({ crawl_id: id }))
      );
      return issues.flat();
    },
    enabled: crawls.length > 0,
  });

  // Filter by date range
  const filteredCrawls = useMemo(() => {
    const daysAgo = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), daysAgo);
    return crawls.filter(c => new Date(c.started_at) >= cutoffDate);
  }, [crawls, dateRange]);

  // Crawl history over time (pages per day)
  const crawlHistoryData = useMemo(() => {
    return filteredCrawls.map(crawl => {
      const pages = allPages.filter(p => p.crawl_id === crawl.id);
      return {
        date: format(new Date(crawl.started_at), "MMM d"),
        fullDate: crawl.started_at,
        pages: pages.length,
        errors: pages.filter(p => p.status_code >= 400).length,
        success: pages.filter(p => p.status_code >= 200 && p.status_code < 300).length
      };
    }).reverse();
  }, [filteredCrawls, allPages]);

  // Error rate over time
  const errorRateData = useMemo(() => {
    return filteredCrawls.map(crawl => {
      const pages = allPages.filter(p => p.crawl_id === crawl.id);
      const total = pages.length;
      const errors = pages.filter(p => p.status_code >= 400).length;
      const errorRate = total > 0 ? (errors / total) * 100 : 0;
      
      return {
        date: format(new Date(crawl.started_at), "MMM d"),
        errorRate: parseFloat(errorRate.toFixed(2)),
        errors,
        total
      };
    }).reverse();
  }, [filteredCrawls, allPages]);

  // Average load time over time
  const loadTimeData = useMemo(() => {
    return filteredCrawls.map(crawl => {
      const pages = allPages.filter(p => p.crawl_id === crawl.id && p.load_time_ms);
      const avgLoadTime = pages.length > 0
        ? pages.reduce((sum, p) => sum + p.load_time_ms, 0) / pages.length
        : 0;
      
      return {
        date: format(new Date(crawl.started_at), "MMM d"),
        avgLoadTime: parseFloat(avgLoadTime.toFixed(0)),
        pages: pages.length
      };
    }).reverse();
  }, [filteredCrawls, allPages]);

  // Issue trends over time
  const issueTrendsData = useMemo(() => {
    return filteredCrawls.map(crawl => {
      const issues = allIssues.filter(i => i.crawl_id === crawl.id);
      return {
        date: format(new Date(crawl.started_at), "MMM d"),
        critical: issues.filter(i => i.severity === "critical").length,
        high: issues.filter(i => i.severity === "high").length,
        medium: issues.filter(i => i.severity === "medium").length,
        total: issues.length
      };
    }).reverse();
  }, [filteredCrawls, allIssues]);

  // Current stats
  const currentStats = useMemo(() => {
    if (filteredCrawls.length === 0) return null;
    
    const latestCrawl = filteredCrawls[0];
    const pages = allPages.filter(p => p.crawl_id === latestCrawl.id);
    const issues = allIssues.filter(i => i.crawl_id === latestCrawl.id);
    
    const errorPages = pages.filter(p => p.status_code >= 400).length;
    const errorRate = pages.length > 0 ? (errorPages / pages.length) * 100 : 0;
    
    const pagesWithLoadTime = pages.filter(p => p.load_time_ms);
    const avgLoadTime = pagesWithLoadTime.length > 0
      ? pagesWithLoadTime.reduce((sum, p) => sum + p.load_time_ms, 0) / pagesWithLoadTime.length
      : 0;
    
    return {
      totalPages: pages.length,
      errorRate: errorRate.toFixed(1),
      avgLoadTime: avgLoadTime.toFixed(0),
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === "critical").length
    };
  }, [filteredCrawls, allPages, allIssues]);

  const isLoading = crawlsLoading || pagesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link 
            to={createPageUrl(`SiteOverview?siteId=${siteId}`)} 
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {site.domain}
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Health Report</h1>
          <p className="text-slate-500 mt-1">Performance and health trends for {site.domain}</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      {currentStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Pages</p>
                <p className="text-2xl font-semibold text-slate-900">{currentStats.totalPages}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Error Rate</p>
                <p className="text-2xl font-semibold text-slate-900">{currentStats.errorRate}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg Load Time</p>
                <p className="text-2xl font-semibold text-slate-900">{currentStats.avgLoadTime}ms</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Critical Issues</p>
                <p className="text-2xl font-semibold text-slate-900">{currentStats.criticalIssues}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Crawl History Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Pages Crawled Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={crawlHistoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pages" stroke="#3b82f6" strokeWidth={2} name="Total Pages" />
            <Line type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} name="Successful" />
            <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Errors" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Error Rate Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Error Rate Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={errorRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" label={{ value: 'Error Rate (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="errorRate" stroke="#ef4444" strokeWidth={2} name="Error Rate %" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Load Time Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Average Page Load Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={loadTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" label={{ value: 'Load Time (ms)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgLoadTime" stroke="#10b981" strokeWidth={2} name="Avg Load Time (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Issue Trends Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Issue Trends by Severity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={issueTrendsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Legend />
            <Bar dataKey="critical" fill="#ef4444" name="Critical" />
            <Bar dataKey="high" fill="#f59e0b" name="High" />
            <Bar dataKey="medium" fill="#3b82f6" name="Medium" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}