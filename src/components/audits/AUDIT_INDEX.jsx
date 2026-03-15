export const AUDIT_SCOPE = [
  { id: "audit-001", area: "SEO Crawling", status: "active", priority: "high" },
  { id: "audit-002", area: "Keyword Tracking", status: "active", priority: "high" },
  { id: "audit-003", area: "Google Search Console Integration", status: "in-progress", priority: "high" },
  { id: "audit-004", area: "Billing & Subscription", status: "active", priority: "medium" },
  { id: "audit-005", area: "Report Generation", status: "active", priority: "medium" },
  { id: "audit-006", area: "Google Analytics Integration", status: "planned", priority: "medium" },
];

export default function AuditIndex() {
  const statusColor = { active: "text-green-600", "in-progress": "text-blue-600", planned: "text-slate-400" };
  return (
    <div className="p-4 bg-white border rounded-lg text-sm">
      <h3 className="font-bold mb-3">Audit Index</h3>
      <div className="space-y-2">
        {AUDIT_SCOPE.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b pb-1">
            <span className="text-slate-700">{item.area}</span>
            <div className="flex gap-2 text-xs">
              <span className="text-slate-400">{item.priority}</span>
              <span className={statusColor[item.status]}>{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}