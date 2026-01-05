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
import { Plus, TrendingUp, TrendingDown, Minus, Search, RefreshCw, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function KeywordTracking() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [checkingKeywordId, setCheckingKeywordId] = useState(null);
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
                  <TableHead>Best</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.map((keyword) => {
                  const change = getRankingChange(keyword.current_position, keyword.previous_position);
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
                        <Badge variant="outline" className="capitalize">
                          {keyword.check_frequency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
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