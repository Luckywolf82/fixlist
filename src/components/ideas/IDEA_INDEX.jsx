export const IDEAS = [
  { id: "idea-001", title: "Google Analytics integration", score: 90, status: "planned", phase: 2 },
  { id: "idea-002", title: "White-label PDF reports with custom branding", score: 85, status: "active", phase: 1 },
  { id: "idea-003", title: "Competitor backlink gap analysis", score: 75, status: "planned", phase: 2 },
  { id: "idea-004", title: "Slack/email alerts for critical issues", score: 80, status: "planned", phase: 2 },
  { id: "idea-005", title: "AI content suggestions based on crawl data", score: 70, status: "idea", phase: 3 },
  { id: "idea-006", title: "Multi-language support", score: 95, status: "active", phase: 1 },
];

export default function IdeaIndex() {
  const sorted = [...IDEAS].sort((a, b) => b.score - a.score);
  return (
    <div className="p-4 bg-white border rounded-lg text-sm">
      <h3 className="font-bold mb-3">Idea Bank (scored)</h3>
      <div className="space-y-2">
        {sorted.map((idea) => (
          <div key={idea.id} className="flex items-center justify-between border-b pb-1">
            <span className="text-slate-700">{idea.title}</span>
            <div className="flex gap-2 text-xs">
              <span className="font-bold text-slate-800">{idea.score}</span>
              <span className="text-slate-400">Phase {idea.phase}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}