import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, RefreshCw, TrendingUp, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function CompetitorAnalysis() {
  const urlParams = new URLSearchParams(window.location.search);
  const siteId = urlParams.get("siteId");
  const [newDomain, setNewDomain] = useState("");
  const [analyzingId, setAnalyzingId] = useState(null);

  const queryClient = useQueryClient();

  const { data: site } = useQuery({
    queryKey: ["site", siteId],
    queryFn: async () => {
      const sites = await base44.entities.Site.filter({ id: siteId });
      return sites[0];
    },
    enabled: !!siteId,
  });

  const { data: competitors = [], isLoading } = useQuery({
    queryKey: ["competitors", siteId],
    queryFn: () => base44.entities.Competitor.filter({ site_id: siteId }, "-created_date"),
    enabled: !!siteId,
  });

  const { data: siteMetrics } = useQuery({
    queryKey: ["siteAhrefsData", site?.domain],
    queryFn: async () => {
      const response = await base44.functions.invoke('fetchAhrefsData', { domain: site.domain });
      return response.data;
    },
    enabled: !!site?.domain,
  });

  const addCompetitorMutation = useMutation({
    mutationFn: async (domain) => {
      return base44.entities.Competitor.create({ 
        site_id: siteId, 
        domain: domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors", siteId] });
      setNewDomain("");
      toast.success("Competitor added");
    },
  });

  const deleteCompetitorMutation = useMutation({
    mutationFn: (id) => base44.entities.Competitor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors", siteId] });
      toast.success("Competitor removed");
    },
  });

  const analyzeCompetitorMutation = useMutation({
    mutationFn: async (competitor) => {
      const response = await base44.functions.invoke('fetchAhrefsData', { domain: competitor.domain });
      if (response.data.success) {
        await base44.entities.Competitor.update(competitor.id, {
          metrics: {
            domain_rating: response.data.domainRating,
            backlinks: response.data.backlinks,
            referring_domains: response.data.referringDomains,
            organic_keywords: response.data.organicKeywords,
            organic_traffic: response.data.organicTraffic,
          },
          last_analyzed_at: new Date().toISOString()
        });
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competitors", siteId] });
      setAnalyzingId(null);
      toast.success("Competitor analyzed");
    },
    onError: () => {
      setAnalyzingId(null);
      toast.error("Failed to analyze competitor");
    }
  });

  const handleAddCompetitor = () => {
    if (newDomain.trim()) {
      addCompetitorMutation.mutate(newDomain);
    }
  };

  const handleAnalyze = (competitor) => {
    setAnalyzingId(competitor.id);
    analyzeCompetitorMutation.mutate(competitor);
  };

  const getComparison = (competitorValue, siteValue) => {
    if (!siteValue || !competitorValue) return null;
    const diff = competitorValue - siteValue;
    const percent = ((diff / siteValue) * 100).toFixed(0);
    return { diff, percent, isHigher: diff > 0 };
  };

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
      <div>
        <Link 
          to={createPageUrl(`SiteOverview?siteId=${siteId}`)} 
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {site.domain}
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Competitor Analysis</h1>
        <p className="text-slate-500 mt-1">Benchmark your SEO performance against competitors</p>
      </div>

      {/* Your Site Metrics */}
      {siteMetrics?.success && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Your Site: {site.domain}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">Domain Rating</p>
              <p className="text-2xl font-bold text-blue-600">{siteMetrics.domainRating}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Backlinks</p>
              <p className="text-2xl font-bold text-slate-900">{siteMetrics.backlinks.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Referring Domains</p>
              <p className="text-2xl font-bold text-slate-900">{siteMetrics.referringDomains.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Organic Keywords</p>
              <p className="text-2xl font-bold text-slate-900">{siteMetrics.organicKeywords.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Organic Traffic</p>
              <p className="text-2xl font-bold text-slate-900">{siteMetrics.organicTraffic.toLocaleString()}/mo</p>
            </div>
          </div>
        </Card>
      )}

      {/* Add Competitor */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Add Competitor</h3>
        <div className="flex gap-3">
          <Input
            placeholder="competitor.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
            className="flex-1"
          />
          <Button 
            onClick={handleAddCompetitor}
            disabled={!newDomain.trim() || addCompetitorMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </Card>

      {/* Competitors Table */}
      {competitors.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Competitor</TableHead>
                <TableHead>Domain Rating</TableHead>
                <TableHead>Backlinks</TableHead>
                <TableHead>Referring Domains</TableHead>
                <TableHead>Organic Keywords</TableHead>
                <TableHead>Last Analyzed</TableHead>
                <TableHead className="w-[150px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {competitors.map((competitor) => {
                const drComp = getComparison(competitor.metrics?.domain_rating, siteMetrics?.domainRating);
                const blComp = getComparison(competitor.metrics?.backlinks, siteMetrics?.backlinks);
                const rdComp = getComparison(competitor.metrics?.referring_domains, siteMetrics?.referringDomains);
                const kwComp = getComparison(competitor.metrics?.organic_keywords, siteMetrics?.organicKeywords);

                return (
                  <TableRow key={competitor.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{competitor.domain}</span>
                        <a 
                          href={`https://${competitor.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      {competitor.metrics?.domain_rating ? (
                        <div>
                          <span className="font-semibold">{competitor.metrics.domain_rating}</span>
                          {drComp && (
                            <Badge 
                              variant="outline" 
                              className={`ml-2 ${drComp.isHigher ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}
                            >
                              {drComp.isHigher ? '+' : ''}{drComp.diff}
                            </Badge>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {competitor.metrics?.backlinks ? (
                        <div>
                          <span>{competitor.metrics.backlinks.toLocaleString()}</span>
                          {blComp && (
                            <Badge 
                              variant="outline" 
                              className={`ml-2 text-xs ${blComp.isHigher ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}
                            >
                              {blComp.percent > 0 ? '+' : ''}{blComp.percent}%
                            </Badge>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {competitor.metrics?.referring_domains ? (
                        <div>
                          <span>{competitor.metrics.referring_domains.toLocaleString()}</span>
                          {rdComp && (
                            <Badge 
                              variant="outline" 
                              className={`ml-2 text-xs ${rdComp.isHigher ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}
                            >
                              {rdComp.percent > 0 ? '+' : ''}{rdComp.percent}%
                            </Badge>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {competitor.metrics?.organic_keywords ? (
                        <div>
                          <span>{competitor.metrics.organic_keywords.toLocaleString()}</span>
                          {kwComp && (
                            <Badge 
                              variant="outline" 
                              className={`ml-2 text-xs ${kwComp.isHigher ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}`}
                            >
                              {kwComp.percent > 0 ? '+' : ''}{kwComp.percent}%
                            </Badge>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {competitor.last_analyzed_at ? (
                        <span className="text-sm text-slate-600">
                          {format(new Date(competitor.last_analyzed_at), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAnalyze(competitor)}
                          disabled={analyzingId === competitor.id}
                        >
                          {analyzingId === competitor.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => {
                            if (confirm(`Remove ${competitor.domain}?`)) {
                              deleteCompetitorMutation.mutate(competitor.id);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No competitors added yet</h3>
          <p className="text-slate-500">Add competitor domains to benchmark your SEO performance</p>
        </Card>
      )}
    </div>
  );
}