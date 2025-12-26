import React from "react";
import { Badge } from "@/components/ui/badge";

const severityConfig = {
  critical: {
    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-50",
    dot: "bg-red-500"
  },
  high: {
    className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50",
    dot: "bg-orange-500"
  },
  medium: {
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
    dot: "bg-amber-500"
  }
};

export default function SeverityBadge({ severity }) {
  const config = severityConfig[severity] || severityConfig.medium;
  
  return (
    <Badge variant="outline" className={`${config.className} font-medium capitalize gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {severity}
    </Badge>
  );
}