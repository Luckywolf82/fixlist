export const AI_STATE = {
  project: "Fixlist",
  phase: "bootstrap",
  version: "1.0.0",
  lastUpdated: "2026-03-15",
  status: "active",
};

export default function AIState() {
  return (
    <div className="p-4 bg-slate-50 border rounded-lg text-sm font-mono">
      <h3 className="font-bold mb-2">AI_STATE</h3>
      <pre>{JSON.stringify(AI_STATE, null, 2)}</pre>
    </div>
  );
}