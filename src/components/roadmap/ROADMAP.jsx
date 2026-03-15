import { IDEAS } from "../ideas/IDEA_INDEX";

const PHASES = [
  { phase: 1, label: "Foundation", description: "Core features and infrastructure" },
  { phase: 2, label: "Growth", description: "Integrations and advanced analytics" },
  { phase: 3, label: "Scale", description: "AI features and enterprise tooling" },
];

export default function Roadmap() {
  return (
    <div className="p-4 bg-white border rounded-lg text-sm space-y-4">
      <h3 className="font-bold">Roadmap</h3>
      {PHASES.map((p) => {
        const items = IDEAS.filter((i) => i.phase === p.phase).sort((a, b) => b.score - a.score);
        return (
          <div key={p.phase} className="border rounded p-3">
            <div className="font-semibold text-slate-800">Phase {p.phase} — {p.label}</div>
            <div className="text-slate-500 text-xs mb-2">{p.description}</div>
            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span className="text-slate-700">{item.title}</span>
                  <span className={`text-xs px-1.5 rounded ${item.status === "active" ? "bg-green-100 text-green-700" : item.status === "planned" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}