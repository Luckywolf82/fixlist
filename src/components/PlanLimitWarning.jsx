import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Crown } from "lucide-react";

export default function PlanLimitWarning({ message, ctaText = "Upgrade Now" }) {
  return (
    <Card className="p-6 border-2 border-amber-200 bg-amber-50/50">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900 mb-1">Plan Limit Reached</h3>
          <p className="text-sm text-slate-600 mb-3">{message}</p>
          <Link to={createPageUrl("Billing")}>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
              <Crown className="w-4 h-4 mr-2" />
              {ctaText}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}