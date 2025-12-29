import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/components/usePermissions";
import { useLanguage } from "@/components/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, CheckCircle, Shield } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { t } = useLanguage();
  const { canAccessSettings } = usePermissions();
  const [ahrefsKey, setAhrefsKey] = useState("");
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setAhrefsKey(user.ahrefs_api_key || "");
    }
  }, [user]);

  const updateKeyMutation = useMutation({
    mutationFn: async (key) => {
      return base44.auth.updateMe({ ahrefs_api_key: key });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast.success("Ahrefs API key saved");
    },
    onError: () => {
      toast.error("Failed to save API key");
    }
  });

  const handleSaveAhrefs = () => {
    updateKeyMutation.mutate(ahrefsKey.trim());
  };

  if (!canAccessSettings) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">{t('settingsAccessDenied')}</h1>
        <Card className="p-12 text-center">
          <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">{t('settingsNoPermission')}</p>
          <p className="text-sm text-slate-500 mt-2">{t('settingsContactAdmin') || 'Contact an administrator for access.'}</p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{t('settingsTitle')}</h1>
        <p className="text-slate-500 mt-1">{t('settingsSubtitle') || 'Connect your SEO tools for enhanced reporting'}</p>
      </div>

      {/* Ahrefs */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
            <Key className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">{t('settingsAhrefsTitle')}</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              {t('settingsAhrefsDesc') || 'Enter your Ahrefs API key to fetch backlinks, domain rating, and referring domains data'}
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="ahrefs-key">{t('settingsAhrefsApiKey')}</Label>
                <Input
                  id="ahrefs-key"
                  type="password"
                  placeholder={t('settingsAhrefsPlaceholder')}
                  value={ahrefsKey}
                  onChange={(e) => setAhrefsKey(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Get your API key from <a href="https://ahrefs.com/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ahrefs.com/api</a>
                </p>
              </div>
              <Button
                onClick={handleSaveAhrefs}
                disabled={updateKeyMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800"
              >
                {updateKeyMutation.isPending ? t('settingsSaving') : t('settingsSave')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Help Card */}
      <Card className="p-6 bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">{t('settingsWhyAhrefs')}</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Monitor your backlink profile, domain rating, and referring domains</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Track organic keywords and estimated organic traffic</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>See top-performing pages and their keyword rankings</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>Your API key is securely stored and only accessible by you</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}