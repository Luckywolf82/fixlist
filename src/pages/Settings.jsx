import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Link as LinkIcon, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const [ahrefsKey, setAhrefsKey] = useState("");
  const [gscConnected, setGscConnected] = useState(false);
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

  // Check GSC connection status
  useEffect(() => {
    const checkGSC = async () => {
      try {
        const response = await base44.functions.invoke('checkGSCConnection', {});
        setGscConnected(response.data.connected);
      } catch (error) {
        setGscConnected(false);
      }
    };
    checkGSC();
  }, []);

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
    updateKeyMutation.mutate(ahrefsKey);
  };

  const handleConnectGSC = async () => {
    try {
      const response = await base44.functions.invoke('connectGSC', {});
      if (response.data.authUrl) {
        window.open(response.data.authUrl, '_blank');
        toast.success("Opening Google Search Console authorization...");
      }
    } catch (error) {
      toast.error("Failed to initiate Google Search Console connection");
    }
  };

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
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">Connect your SEO tools for enhanced reporting</p>
      </div>

      {/* Google Search Console */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Google Search Console</h3>
              <p className="text-sm text-slate-500 mt-1">
                Connect to fetch organic traffic, search queries, and rankings data
              </p>
              <div className="flex items-center gap-2 mt-3">
                {gscConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600 font-medium">Connected</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Not connected</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button
            onClick={handleConnectGSC}
            variant={gscConnected ? "outline" : "default"}
            className={!gscConnected ? "bg-slate-900 hover:bg-slate-800" : ""}
          >
            {gscConnected ? "Reconnect" : "Connect"}
          </Button>
        </div>
      </Card>

      {/* Ahrefs */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
            <Key className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Ahrefs</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Enter your Ahrefs API key to fetch backlinks, domain rating, and referring domains data
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="ahrefs-key">API Key</Label>
                <Input
                  id="ahrefs-key"
                  type="password"
                  placeholder="Enter your Ahrefs API key"
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
                {updateKeyMutation.isPending ? "Saving..." : "Save API Key"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Help Card */}
      <Card className="p-6 bg-slate-50 border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">Why connect these tools?</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Google Search Console:</strong> Track organic clicks, impressions, average position, and top-performing queries</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Ahrefs:</strong> Monitor backlink profile, domain rating, referring domains, and competitor analysis</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span>All data is securely stored and only accessible by you</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}