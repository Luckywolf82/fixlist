export const PHASE_LOG = [
  {
    date: "2026-03-15",
    phase: "bootstrap",
    action: "Initialized GovernanceHub scaffold for Fixlist",
    status: "verified",
  },
];

export default function PhaseExecutionLog() {
  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm">
      <h3 className="font-bold mb-2">Phase Execution Log</h3>
      <div className="space-y-2">
        {PHASE_LOG.map((entry, i) => (
          <div key={i} className="border-l-2 border-green-400 pl-3">
            <div className="font-mono text-xs text-slate-500">{entry.date} — {entry.phase}</div>
            <div className="text-slate-700">{entry.action}</div>
            <div className="text-xs text-green-600 font-medium">{entry.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}