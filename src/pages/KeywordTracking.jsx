import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/components/useAuth";
import { useLanguage } from "@/components/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, TrendingUp, TrendingDown, Minus, Search, RefreshCw, Trash2, Eye, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function KeywordTracking() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [checkingKeywordId, setCheckingKeywordId] = useState(null);
  const [viewingHistoryId, setViewingHistoryId] = useState(null);
  const [formData, setFormData] = useState({
    keyword: "",
    target_url: "",
    check_frequency: "weekly"
  });

  const queryClient = useQueryClient();

  const { data: sites = [] } = useQuery({
    queryKey: ["sites"],
    queryFn: () => base44.entities.Site.filter({ organization_id: user?.organization_id }),
    enabled: !!user?.organization_id,
  });

  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ["keywords", selectedSiteId],
    queryFn: async () => {
      if (!selectedSiteId) return [];
      return base44.entities.Keyword.filter({ site_id: selectedSiteId }, "-created_date");
    },
    enabled: !!selectedSiteId,
  });

  const { data: keywordHistory = [] } = useQuery({
    queryKey: ["keywordHistory", viewingHistoryId],
    queryFn: async () => {
      if (!viewingHistoryId) return [];
      return base44.entities.KeywordHistory.filter({ keyword_id: viewingHistoryId }, "checked_at");
    },
    enabled: !!viewingHistoryId,
  });

  const addKeywordMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.Keyword.create({
        ...data,
        site_id: selectedSiteId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast.success("Keyword added");
      setIsDialogOpen(false);
      setFormData({ keyword: "", target_url: "", check_frequency: "weekly" });
    },
  });

  const deleteKeywordMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.Keyword.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      toast.success("Keyword deleted");
    },
  });

  const checkRankingMutation = useMutation({
    mutationFn: async ({ keywordId, keyword, target_url }) => {
      const site = sites.find(s => s.id === selectedSiteId);
      const response = await base44.functions.invoke('checkSerpRankings', {
        keyword_id: keywordId,
        keyword: keyword,
        site_domain: site.domain,
        target_url: target_url
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keywords"] });
      setCheckingKeywordId(null);
      toast.success("Ranking checked");
    },
    onError: () => {
      setCheckingKeywordId(null);
      toast.error("Failed to check ranking");
    }
  });

  const handleAddKeyword = () => {
    if (!formData.keyword) {
      toast.error("Please enter a keyword");
      return;
    }
    addKeywordMutation.mutate(formData);
  };

  const handleCheckRanking = (keyword) => {
    setCheckingKeywordId(keyword.id);
    checkRankingMutation.mutate({
      keywordId: keyword.id,
      keyword: keyword.keyword,
      target_url: keyword.target_url
    });
  };

  const getRankingChange = (current, previous) => {
    if (!current || !previous) return null;
    const change = previous - current; // Lower position = better
    if (change > 0) return { direction: "up", value: Math.abs(change) };
    if (change < 0) return { direction: "down", value: Math.abs(change) };
    return { direction: "same", value: 0 };
  };

  const getTrend = (keywordId) => {
    const history = keywordHistory.filter(h => h.keyword_id === keywordId).slice(-5);
    if (history.length < 3) return "insufficient";
    
    const positions = history.map(h => h.position).filter(p => p !== null);
    if (positions.length < 3) return "unstable";
    
    const recentAvg = positions.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const olderAvg = positions.slice(0, -3).reduce((a, b) => a + b, 0) / (positions.length - 3);
    
    const diff = olderAvg - recentAvg; // Lower is better
    if (diff > 2) return "up";
    if (diff < -2) return "down";
    return "stable";
  };

  const formatChartData = (history) => {
    return history
      .filter(h => h.position !== null)
      .map(h => ({
        date: format(new Date(h.checked_at), "MMM d"),
        position: h.position,
        fullDate: format(new Date(h.checked_at), "MMM d, yyyy HH:mm")
      }));
  };

  if (sites.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Keyword Tracking</h1>
        <Card className="p-12 text-center">
          <p className="text-slate-600">Add a site first to start tracking keywords</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Keyword Tracking</h1>
          <p className="text-slate-500 mt-1">Monitor your search engine rankings</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} disabled={!selectedSiteId}>
          <Plus className="w-4 h-4 mr-2" />
          Add Keyword
        </Button>
      </div>

      <Card className="p-4">
        <Label>Select Site</Label>
        <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Choose a site..." />
          </SelectTrigger>
          <SelectContent>
            {sites.map(site => (
              <SelectItem key={site.id} value={site.id}>{site.domain}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      {selectedSiteId && (
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : keywords.length === 0 ? (
            <div className="p-12 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No keywords yet</h3>
              <p className="text-slate-500">Add keywords to start tracking rankings</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead>Keyword</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Best</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.map((keyword) => {
                  const change = getRankingChange(keyword.current_position, keyword.previous_position);
                  const trend = getTrend(keyword.id);
                  return (
                    <TableRow key={keyword.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{keyword.keyword}</div>
                          {keyword.target_url && (
                            <div className="text-xs text-slate-500 mt-1">{keyword.target_url}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {keyword.current_position ? (
                          <Badge variant="outline" className="font-mono">
                            #{keyword.current_position}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">Not ranked</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {change && change.direction !== "same" && (
                          <div className={`flex items-center gap-1 ${
                            change.direction === "up" ? "text-green-600" : "text-red-600"
                          }`}>
                            {change.direction === "up" ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">{change.value}</span>
                          </div>
                        )}
                        {change && change.direction === "same" && (
                          <Minus className="w-4 h-4 text-slate-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        {trend === "up" && (
                          <Badge className="bg-green-100 text-green-700">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Up
                          </Badge>
                        )}
                        {trend === "down" && (
                          <Badge className="bg-red-100 text-red-700">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Down
                          </Badge>
                        )}
                        {trend === "stable" && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <Minus className="w-3 h-3 mr-1" />
                            Stable
                          </Badge>
                        )}
                        {trend === "insufficient" && (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.search_volume ? (
                          <span className="text-sm text-slate-600 font-mono">
                            {keyword.search_volume.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.best_position ? (
                          <span className="text-sm text-slate-600">#{keyword.best_position}</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {keyword.last_checked ? (
                          <span className="text-sm text-slate-600">
                            {format(new Date(keyword.last_checked), "MMM d, HH:mm")}
                          </span>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingHistoryId(viewingHistoryId === keyword.id ? null : keyword.id)}
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckRanking(keyword)}
                            disabled={checkingKeywordId === keyword.id}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${checkingKeywordId === keyword.id ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => {
                              if (confirm("Delete this keyword?")) {
                                deleteKeywordMutation.mutate(keyword.id);
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
          )}
        </Card>
      )}

      {viewingHistoryId && keywordHistory.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Ranking History: {keywords.find(k => k.id === viewingHistoryId)?.keyword}
            </h3>
            <Button variant="outline" size="sm" onClick={() => setViewingHistoryId(null)}>
              Close
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formatChartData(keywordHistory)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis 
                reversed 
                domain={[1, 100]} 
                label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="text-sm font-medium">Position: #{payload[0].value}</p>
                        <p className="text-xs text-slate-500">{payload[0].payload.fullDate}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="position" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {keywordHistory.filter(h => h.position !== null).length}
              </div>
              <div className="text-sm text-slate-500">Checks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {Math.min(...keywordHistory.filter(h => h.position !== null).map(h => h.position)) || '-'}
              </div>
              <div className="text-sm text-slate-500">Best Position</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {keywordHistory[keywordHistory.length - 1]?.position || '-'}
              </div>
              <div className="text-sm text-slate-500">Latest Position</div>
            </div>
          </div>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Keyword to Track</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Keyword</Label>
              <Input
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                placeholder="e.g., seo audit tool"
              />
            </div>
            <div>
              <Label>Target URL (optional)</Label>
              <Input
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                placeholder="e.g., /blog/seo-guide"
              />
              <p className="text-xs text-slate-500 mt-1">Track a specific page, leave empty to track any page from your domain</p>
            </div>
            <div>
              <Label>Check Frequency</Label>
              <Select value={formData.check_frequency} onValueChange={(value) => setFormData({ ...formData, check_frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddKeyword} disabled={!formData.keyword}>
              Add Keyword
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}