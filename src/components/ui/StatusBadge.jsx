import React from "react";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  open: {
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
  ignored: {
    className: "bg-slate-100 text-slate-500 border-slate-200",
  },
  fixed: {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  running: {
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  done: {
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failed: {
    className: "bg-red-50 text-red-700 border-red-200",
  }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.open;
  
  return (
    <Badge variant="outline" className={`${config.className} font-medium capitalize`}>
      {status}
    </Badge>
  );
}