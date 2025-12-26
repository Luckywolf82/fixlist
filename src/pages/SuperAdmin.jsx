import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/usePermissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Building2, Users, Globe, TrendingUp, DollarSign, Search } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function SuperAdmin() {
  const { user } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const isSuperAdmin = user?.custom_role === "superadmin";

  const { data: organizations = [], isLoading: orgsLoading } = useQuery({
    queryKey: ["allOrganizations"],
    queryFn: () => base44.entities.Organization.list("-created_date"),
    enabled: isSuperAdmin,
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
    enabled: isSuperAdmin,
  });

  const { data: sites = [], isLoading: sitesLoading } = useQuery({
    queryKey: ["allSites"],
    queryFn: () => base44.entities.Site.list(),
    enabled: isSuperAdmin,
  });

  const { data: crawls = [], isLoading: crawlsLoading } = useQuery({
    queryKey: ["allCrawls"],
    queryFn: () => base44.entities.Crawl.list("-started_at", 100),
    enabled: isSuperAdmin,
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ orgId, data }) => {
      return base44.entities.Organization.update(orgId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allOrganizations"] });
      toast.success("Organization updated");
    },
    onError: () => {
      toast.error("Failed to update organization");
    },
  });

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Access Denied</h1>
        <Card className="p-12 text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Only superadmins can access this panel.</p>
        </Card>
      </div>
    );
  }

  const isLoading = orgsLoading || usersLoading || sitesLoading || crawlsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const totalRevenue = organizations.reduce((sum, org) => {
    const prices = { free: 0, starter: 29, professional: 99, enterprise: 299 };
    return sum + (prices[org.plan] || 0);
  }, 0);

  const activeSubscriptions = organizations.filter(o => o.subscription_status === "active").length;
  const trialUsers = organizations.filter(o => o.subscription_status === "trialing").length;

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            SuperAdmin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Platform-wide analytics and management</p>
        </div>
        <Badge className="bg-purple-100 text-purple-700 border-purple-300">
          SuperAdmin Access
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Organizations</p>
              <p className="text-2xl font-bold text-slate-900">{organizations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Users</p>
              <p className="text-2xl font-bold text-slate-900">{allUsers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Sites</p>
              <p className="text-2xl font-bold text-slate-900">{sites.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">MRR</p>
              <p className="text-2xl font-bold text-slate-900">${totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscription Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Subscriptions</p>
              <p className="text-xl font-bold text-green-600">{activeSubscriptions}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Trial Users</p>
              <p className="text-xl font-bold text-blue-600">{trialUsers}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Crawls</p>
              <p className="text-xl font-bold text-slate-900">{crawls.length}</p>
            </div>
            <Globe className="w-8 h-8 text-slate-600" />
          </div>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Organizations</h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="font-semibold text-slate-700">Organization</TableHead>
              <TableHead className="font-semibold text-slate-700">Plan</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Sites</TableHead>
              <TableHead className="font-semibold text-slate-700">Users</TableHead>
              <TableHead className="font-semibold text-slate-700">Crawls This Month</TableHead>
              <TableHead className="font-semibold text-slate-700">Created</TableHead>
              <TableHead className="font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs.map((org) => {
              const orgSites = sites.filter(s => s.organization_id === org.id);
              const orgUsers = allUsers.filter(u => u.organization_id === org.id);

              return (
                <TableRow key={org.id}>
                  <TableCell className="font-medium text-slate-900">{org.name}</TableCell>
                  <TableCell>
                    <Select
                      value={org.plan}
                      onValueChange={(newPlan) => updateOrgMutation.mutate({ orgId: org.id, data: { plan: newPlan } })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      org.subscription_status === "active" ? "bg-green-100 text-green-700" :
                      org.subscription_status === "trialing" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-700"
                    }>
                      {org.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">{orgSites.length}</TableCell>
                  <TableCell className="text-slate-600">{orgUsers.length}</TableCell>
                  <TableCell className="text-slate-600">
                    {org.crawls_this_month} / {org.max_crawls_per_month === -1 ? '∞' : org.max_crawls_per_month}
                  </TableCell>
                  <TableCell className="text-slate-600 text-sm">
                    {format(new Date(org.created_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}