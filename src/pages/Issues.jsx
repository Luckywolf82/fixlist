import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/useAuth";
import { usePermissions } from "@/components/usePermissions";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SeverityBadge from "@/components/ui/SeverityBadge";
import StatusBadge from "@/components/ui/StatusBadge";
import { ArrowLeft, MoreHorizontal, CheckCircle, EyeOff, ExternalLink, Filter } from "lucide-react";

export default function Issues() {
  useAuth();
  const { canUpdateIssues } = usePermissions();
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get("siteId");
  const crawlId = urlParams.get("crawlId");

  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const queryClient = useQueryClient();

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

  const activeCrawlId = crawlId || crawls[0]?.id;

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["issues", activeCrawlId],
    queryFn: async () => {
      if (!activeCrawlId) return [];
      return base44.entities.Issue.filter({ crawl_id: activeCrawlId });
    },
    enabled: !!activeCrawlId,
  });

  const updateIssueMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Issue.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(["issues", activeCrawlId]);
    },
  });

  const issueTypes = [...new Set(issues.map(i => i.type))];

  const filteredIssues = issues.filter(issue => {
    if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
    if (statusFilter !== "all" && issue.status !== statusFilter) return false;
    if (typeFilter !== "all" && issue.type !== typeFilter) return false;
    return true;
  });

  const handleStatusChange = (issueId, newStatus) => {
    updateIssueMutation.mutate({ id: issueId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
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
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Issues</h1>
        <p className="text-slate-500 mt-1">{filteredIssues.length} issues found</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter className="w-4 h-4" />
          Filters:
        </div>
        
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="ignored">Ignored</SelectItem>
            <SelectItem value="fixed">Fixed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {issueTypes.map(type => (
              <SelectItem key={type} value={type}>{type.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(severityFilter !== "all" || statusFilter !== "all" || typeFilter !== "all") && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSeverityFilter("all");
              setStatusFilter("all");
              setTypeFilter("all");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Issues Table */}
      {filteredIssues.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No issues found</h3>
          <p className="text-slate-500">Try adjusting your filters</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="font-semibold text-slate-700 w-[100px]">Severity</TableHead>
                <TableHead className="font-semibold text-slate-700 w-[140px]">Type</TableHead>
                <TableHead className="font-semibold text-slate-700">URL</TableHead>
                <TableHead className="font-semibold text-slate-700">Message</TableHead>
                <TableHead className="font-semibold text-slate-700 w-[100px]">Status</TableHead>
                <TableHead className="font-semibold text-slate-700 w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => (
                <TableRow key={issue.id} className="group hover:bg-slate-50/50">
                  <TableCell>
                    <SeverityBadge severity={issue.severity} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 capitalize">
                      {issue.type.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <span className="text-sm text-slate-700 truncate" title={issue.url}>
                        {issue.url}
                      </span>
                      <a 
                        href={issue.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-slate-900 line-clamp-2">{issue.message}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={issue.status} />
                  </TableCell>
                  <TableCell>
                    {canUpdateIssues ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(issue.id, "fixed")}
                          disabled={issue.status === "fixed"}
                        >
                          <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                          Mark as Fixed
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleStatusChange(issue.id, "ignored")}
                          disabled={issue.status === "ignored"}
                        >
                          <EyeOff className="w-4 h-4 mr-2 text-slate-500" />
                          Mark as Ignored
                        </DropdownMenuItem>
                        {issue.status !== "open" && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(issue.id, "open")}
                          >
                            Reopen Issue
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    ) : (
                      <span className="text-xs text-slate-500">View only</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}