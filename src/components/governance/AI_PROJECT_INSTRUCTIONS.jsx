export const GOVERNANCE_RULES = [
  "Read actual files before making or proposing changes — do not guess structure.",
  "Make minimal, additive changes only. Do not rewrite working code.",
  "Do not modify locked governance files without explicit approval.",
  "Do not broaden scope beyond what is specified.",
  "Update PhaseExecutionLog only after verified changes — not as drafts.",
  "One structural change at a time.",
  "Verify the repository before and after structural work.",
];

export default function AIProjectInstructions() {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
      <h3 className="font-bold mb-2">Governance Rules</h3>
      <ul className="space-y-1 list-decimal list-inside text-slate-700">
        {GOVERNANCE_RULES.map((rule, i) => (
          <li key={i}>{rule}</li>
        ))}
      </ul>
    </div>
  );
}