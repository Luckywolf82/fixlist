import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Zap, AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react";

export default function AIPrioritizedIssues({ siteId }) {
  const [expanded, setExpanded] = useState(true);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["aiPrioritization", siteId],
    queryFn: async () => {
      const response = await base44.functions.invoke('prioritizeIssues', { site_id: siteId });
      return response.data;
    },
    enabled: !!siteId,
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <Info className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getEffortColor = (effort) => {
    if (effort?.toLowerCase().includes('low') || effort?.toLowerCase().includes('easy')) {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (effort?.toLowerCase().includes('medium')) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
    return 'bg-red-50 text-red-700 border-red-200';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Card>
    );
  }

  if (error || !data?.success) {
    return null;
  }

  if (data.prioritized_issues?.length === 0) {
    return (
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-green-900">Great Work!</h3>
            <p className="text-sm text-green-700 mt-1">{data.summary}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-purple-200">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 border-b border-purple-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                AI-Powered Issue Prioritization
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  Beta
                </Badge>
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Smart recommendations based on SEO impact and effort
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="text-slate-600"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="p-5 space-y-6">
          {/* Strategy Summary */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="font-medium text-slate-900 mb-2">Strategy Overview</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{data.summary}</p>
            {data.trend !== null && data.trend !== 0 && (
              <div className="flex items-center gap-2 mt-3">
                <TrendingUp className={`w-4 h-4 ${data.trend > 0 ? 'text-red-600' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${data.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {data.trend > 0 ? `+${data.trend}` : data.trend} issues since last crawl
                </span>
              </div>
            )}
          </div>

          {/* Quick Wins */}
          {data.quick_wins?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-yellow-600" />
                <h4 className="font-semibold text-slate-900">Quick Wins</h4>
              </div>
              <div className="grid gap-2">
                {data.quick_wins.map((win, idx) => (
                  <div key={idx} className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <p className="font-medium text-yellow-900 text-sm">
                      {win.issue_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">{win.why_quick_win}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prioritized Issues */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-3">Priority List</h4>
            <div className="space-y-3">
              {data.prioritized_issues.slice(0, 7).map((priority, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getSeverityIcon(priority.severity)}
                          <h5 className="font-medium text-slate-900">
                            {priority.issue_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h5>
                          <Badge variant="outline" className="text-xs">
                            {priority.affected_count} pages
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 mb-2">{priority.reason}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="font-medium">SEO Impact:</span>
                          <span>{priority.seo_impact}</span>
                        </div>
                      </div>
                    </div>
                    <Badge className={`${getEffortColor(priority.estimated_effort)} text-xs flex-shrink-0`}>
                      {priority.estimated_effort}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="w-full"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Refresh Analysis
          </Button>
        </div>
      )}
    </Card>
  );
}