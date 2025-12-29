import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { usePermissions } from "@/components/usePermissions";
import { useLanguage } from "@/components/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Palette, Plus, Edit, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

export default function ReportTemplates() {
  const { user, canAccessSettings } = usePermissions();
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    primary_color: "#1e293b",
    company_name: "",
    company_website: "",
    footer_text: "",
    include_sections: {
      executive_summary: true,
      ai_insights: true,
      issue_details: true,
      trend_comparison: true,
      recommendations: true
    },
    is_default: false
  });

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["reportTemplates"],
    queryFn: () => base44.entities.ReportTemplate.filter({ organization_id: user?.organization_id }),
    enabled: !!user?.organization_id,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.ReportTemplate.create({
        ...data,
        organization_id: user.organization_id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportTemplates"] });
      toast.success(t("templatesCreated"));
      setIsDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return base44.entities.ReportTemplate.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportTemplates"] });
      toast.success(t("templatesUpdated"));
      setIsDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return base44.entities.ReportTemplate.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reportTemplates"] });
      toast.success(t("templatesDeleted"));
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file) => {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    },
    onSuccess: (url) => {
      setFormData({ ...formData, logo_url: url });
      toast.success(t("templatesLogoUploaded"));
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      primary_color: "#1e293b",
      company_name: "",
      company_website: "",
      footer_text: "",
      include_sections: {
        executive_summary: true,
        ai_insights: true,
        issue_details: true,
        trend_comparison: true,
        recommendations: true
      },
      is_default: false
    });
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      logo_url: template.logo_url || "",
      primary_color: template.primary_color || "#1e293b",
      company_name: template.company_name || "",
      company_website: template.company_website || "",
      footer_text: template.footer_text || "",
      include_sections: template.include_sections || {
        executive_summary: true,
        ai_insights: true,
        issue_details: true,
        trend_comparison: true,
        recommendations: true
      },
      is_default: template.is_default || false
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadLogoMutation.mutate(file);
    }
  };

  if (!canAccessSettings) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">{t("settingsAccessDenied")}</h1>
        <Card className="p-12 text-center">
          <p className="text-slate-600">{t("templatesNoPermission")}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{t("templatesTitle")}</h1>
          <p className="text-slate-500 mt-1">{t("templatesSubtitle")}</p>
        </div>
        <Button onClick={() => { setEditingTemplate(null); resetForm(); setIsDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          {t("templatesNew")}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>{t("templatesName")}</TableHead>
              <TableHead>{t("templatesCompany")}</TableHead>
              <TableHead>{t("templatesColor")}</TableHead>
              <TableHead>{t("templatesStatus")}</TableHead>
              <TableHead className="w-[120px]">{t("usersActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.company_name || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: template.primary_color }}
                    />
                    <span className="text-sm text-slate-600">{template.primary_color}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {template.is_default && (
                    <Badge className="bg-blue-100 text-blue-700">{t("templatesDefault")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        if (confirm(t("templatesDeleteConfirm"))) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  {t("templatesNoTemplates")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? t("templatesEdit") : t("templatesCreate")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label>{t("templatesTemplateName")}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Standard Report"
              />
            </div>

            <div>
              <Label>{t("templatesCompanyLogo")}</Label>
              <div className="flex items-center gap-3 mt-2">
                {formData.logo_url && (
                  <img src={formData.logo_url} alt="Logo" className="h-12 object-contain" />
                )}
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    {t("templatesUploadLogo")}
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("templatesCompanyName")}</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Your Company"
                />
              </div>
              <div>
                <Label>{t("templatesCompanyWebsite")}</Label>
                <Input
                  value={formData.company_website}
                  onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
                  placeholder="yourcompany.com"
                />
              </div>
            </div>

            <div>
              <Label>{t("templatesPrimaryColor")}</Label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-16 h-10 rounded cursor-pointer"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  placeholder="#1e293b"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label>{t("templatesFooterText")}</Label>
              <Input
                value={formData.footer_text}
                onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
                placeholder="Confidential - SEO Audit Report"
              />
            </div>

            <div>
              <Label className="mb-3 block">{t("templatesIncludeSections")}</Label>
              <div className="space-y-3">
                {Object.entries(formData.include_sections).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{key.replace(/_/g, ' ')}</span>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        include_sections: { ...formData.include_sections, [key]: checked }
                      })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>{t("templatesSetDefault")}</Label>
              <Switch
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditingTemplate(null); resetForm(); }}>
              {t("commonCancel")}
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              {editingTemplate ? t("templatesUpdate") : t("commonSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}