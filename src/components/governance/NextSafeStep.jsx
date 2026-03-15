export const NEXT_SAFE_STEP = {
  step: 1,
  title: "Seed IDEA_INDEX and run scoring",
  description: "Populate the idea bank with initial ideas and assign priority scores before building the roadmap.",
  blockers: [],
};

export default function NextSafeStep() {
  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
      <h3 className="font-bold mb-1">Next Safe Step</h3>
      <div className="font-medium text-slate-800">Step {NEXT_SAFE_STEP.step}: {NEXT_SAFE_STEP.title}</div>
      <p className="text-slate-600 mt-1">{NEXT_SAFE_STEP.description}</p>
      {NEXT_SAFE_STEP.blockers.length > 0 && (
        <div className="mt-2 text-red-600 text-xs">Blockers: {NEXT_SAFE_STEP.blockers.join(", ")}</div>
      )}
    </div>
  );
}