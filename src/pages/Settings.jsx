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
import { Key, CheckCircle, Shield, Sparkles, Link as LinkIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { t } = useLanguage();
  const { canAccessSettings } = usePermissions();
  const [ahrefsKey, setAhrefsKey] = useState("");
  const [ahrefsUrl, setAhrefsUrl] = useState("");
  const [extractingInfo, setExtractingInfo] = useState(false);
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

  const handleExtractInfo = async () => {
    if (!ahrefsUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setExtractingInfo(true);
    try {
      const response = await base44.functions.invoke('extractIntegrationInfo', {
        url: ahrefsUrl.trim(),
        integration_type: 'ahrefs'
      });

      const data = response.data.data;
      
      toast.success(
        <div>
          <p className="font-semibold">Information extracted!</p>
          <p className="text-xs mt-1">{data.instructions}</p>
        </div>,
        { duration: 6000 }
      );

      if (data.api_key_url) {
        window.open(data.api_key_url, '_blank');
      }
    } catch (error) {
      toast.error("Failed to extract information");
    } finally {
      setExtractingInfo(false);
    }
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
            <div className="space-y-4">
              {/* AI Auto-fill */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-900">AI Auto-fill</span>
                </div>
                <p className="text-xs text-purple-700 mb-3">
                  Paste a link to the API documentation or settings page, and AI will guide you
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://ahrefs.com/api/documentation"
                    value={ahrefsUrl}
                    onChange={(e) => setAhrefsUrl(e.target.value)}
                    className="flex-1 bg-white"
                  />
                  <Button
                    onClick={handleExtractInfo}
                    disabled={extractingInfo || !ahrefsUrl.trim()}
                    variant="outline"
                    className="bg-white"
                  >
                    {extractingInfo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LinkIcon className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

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
                  {t('settingsGetApiKey')} <a href="https://ahrefs.com/api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ahrefs.com/api</a>
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
            <span>{t('settingsAhrefsBenefit1')}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>{t('settingsAhrefsBenefit2')}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>{t('settingsAhrefsBenefit3')}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>{t('settingsAhrefsBenefit4')}</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}