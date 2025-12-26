import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Building2 } from "lucide-react";
import toast from "react-hot-toast";

export default function UserNotRegisteredError({ user }) {
  const [orgName, setOrgName] = useState("");
  const queryClient = useQueryClient();

  const createOrgMutation = useMutation({
    mutationFn: async (name) => {
      // Create organization
      const org = await base44.entities.Organization.create({
        name,
        plan: "free",
        subscription_status: "trialing",
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        max_sites: 3,
        max_crawls_per_month: 30,
        crawls_this_month: 0,
      });

      // Update user with organization_id
      await base44.auth.updateMe({
        organization_id: org.id,
        custom_role: "administrator",
      });

      return org;
    },
    onSuccess: () => {
      toast.success("Welcome! Your organization has been created.");
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      window.location.reload();
    },
    onError: () => {
      toast.error("Failed to create organization. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orgName.trim()) {
      createOrgMutation.mutate(orgName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-slate-900 text-center mb-2">
          Welcome to Fixlist!
        </h2>
        <p className="text-slate-600 text-center mb-6">
          Let's set up your organization to get started
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              placeholder="My Company"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>14-day free trial included:</strong>
              <br />
              • Up to 3 websites
              <br />
              • 30 crawls per month
              <br />
              • All essential features
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800"
            disabled={createOrgMutation.isPending || !orgName.trim()}
          >
            {createOrgMutation.isPending ? "Creating..." : "Create Organization & Start Trial"}
          </Button>
        </form>
      </Card>
    </div>
  );
}