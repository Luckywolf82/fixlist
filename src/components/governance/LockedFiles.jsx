export const LOCKED_FILES = [
  "components/governance/AI_STATE.jsx",
  "components/governance/AI_PROJECT_INSTRUCTIONS.jsx",
  "components/governance/LockedFiles.jsx",
  "components/governance/PhaseExecutionLog.jsx",
];

export default function LockedFiles() {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm">
      <h3 className="font-bold mb-2 text-red-700">🔒 Locked Files</h3>
      <ul className="space-y-1 text-slate-700">
        {LOCKED_FILES.map((file) => (
          <li key={file} className="font-mono text-xs">{file}</li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mt-2">Do not modify without explicit approval.</p>
    </div>
  );
}