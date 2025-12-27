import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/usePermissions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Building2, Users, Globe, TrendingUp, DollarSign, Search, Package, Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function SuperAdmin() {
  const { user } = usePermissions();
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    plan_key: "starter",
    price: 0,
    stripe_price_id: "",
    max_sites: 10,
    max_crawls_per_month: 100,
    features: [],
    active: true
  });
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

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => base44.entities.Product.list(),
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

  const createProductMutation = useMutation({
    mutationFn: async (productData) => {
      return base44.entities.Product.create(productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
      setIsProductDialogOpen(false);
      resetProductForm();
    },
    onError: () => {
      toast.error("Failed to create product");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, data }) => {
      return base44.entities.Product.update(productId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      resetProductForm();
    },
    onError: () => {
      toast.error("Failed to update product");
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      return base44.entities.Product.delete(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: () => {
      toast.error("Failed to delete product");
    },
  });

  const resetProductForm = () => {
    setProductForm({
      name: "",
      plan_key: "starter",
      price: 0,
      stripe_price_id: "",
      max_sites: 10,
      max_crawls_per_month: 100,
      features: [],
      active: true
    });
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      plan_key: product.plan_key,
      price: product.price,
      stripe_price_id: product.stripe_price_id || "",
      max_sites: product.max_sites || 10,
      max_crawls_per_month: product.max_crawls_per_month || 100,
      features: product.features || [],
      active: product.active !== undefined ? product.active : true
    });
    setIsProductDialogOpen(true);
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      updateProductMutation.mutate({ productId: editingProduct.id, data: productForm });
    } else {
      createProductMutation.mutate(productForm);
    }
  };

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

  const isLoading = orgsLoading || usersLoading || sitesLoading || crawlsLoading || productsLoading;

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

      {/* Products Section */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600" />
              <h2 className="font-semibold text-slate-900">Products & Pricing</h2>
            </div>
            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { setEditingProduct(null); resetProductForm(); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Product Name</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="e.g., Professional Plan"
                    />
                  </div>
                  <div>
                    <Label>Plan Key</Label>
                    <Select value={productForm.plan_key} onValueChange={(value) => setProductForm({ ...productForm, plan_key: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price (Monthly)</Label>
                    <Input
                      type="number"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      placeholder="299"
                    />
                  </div>
                  <div>
                    <Label>Stripe Price ID</Label>
                    <Input
                      value={productForm.stripe_price_id}
                      onChange={(e) => setProductForm({ ...productForm, stripe_price_id: e.target.value })}
                      placeholder="price_..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Sites</Label>
                      <Input
                        type="number"
                        value={productForm.max_sites}
                        onChange={(e) => setProductForm({ ...productForm, max_sites: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <Label>Max Crawls/Month</Label>
                      <Input
                        type="number"
                        value={productForm.max_crawls_per_month}
                        onChange={(e) => setProductForm({ ...productForm, max_crawls_per_month: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsProductDialogOpen(false); setEditingProduct(null); resetProductForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProduct} disabled={!productForm.name || !productForm.price}>
                    {editingProduct ? "Update" : "Create"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="font-semibold text-slate-700">Product</TableHead>
              <TableHead className="font-semibold text-slate-700">Plan Key</TableHead>
              <TableHead className="font-semibold text-slate-700">Price</TableHead>
              <TableHead className="font-semibold text-slate-700">Limits</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium text-slate-900">{product.name}</TableCell>
                <TableCell>
                  <Badge className="bg-slate-100 text-slate-700 capitalize">
                    {product.plan_key}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-900 font-medium">${product.price}/mo</TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {product.max_sites} sites, {product.max_crawls_per_month} crawls
                </TableCell>
                <TableCell>
                  <Badge className={product.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}>
                    {product.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(`Delete ${product.name}?`)) {
                          deleteProductMutation.mutate(product.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                  No products yet. Create your first product.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

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