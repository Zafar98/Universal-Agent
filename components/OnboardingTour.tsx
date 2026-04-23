import React, { useEffect, useState } from "react";

const TOUR_STEPS = [
  {
    title: "Welcome to the AI Voice Demo!",
    content: "Try a real AI agent for calls and emails. You get a free 60-second demo window to sample any business agent.",
  },
  {
    title: "Choose a Business Agent",
    content: "Select a business type to see how the AI agent handles real-world calls for hotels, housing, restaurants, and more.",
  },
  {
    title: "Start Your Demo Call",
    content: "Click 'Start Demo' to begin. You can talk to the agent and see live transcripts as it responds.",
  },
  {
    title: "Upgrade for Unlimited Access",
    content: "After your demo, subscribe for unlimited calls, transcripts, and advanced features.",
  },
];

export function OnboardingTour() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Optionally, only show for first-time users (localStorage, etc.)
    // For demo, always show
  }, []);

  if (!open) return null;

  const { title, content } = TOUR_STEPS[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl max-w-xs w-full p-6 text-center relative">
        <button
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 text-xl"
          aria-label="Close tour"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
        <h3 className="font-bold text-lg mb-2 text-indigo-700">{title}</h3>
        <p className="text-slate-700 mb-4 text-sm">{content}</p>
        <div className="flex justify-center gap-2 mt-2">
          {step > 0 && (
            <button
              className="px-3 py-1 rounded bg-slate-200 text-slate-700 text-xs font-semibold"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
          {step < TOUR_STEPS.length - 1 ? (
            <button
              className="px-4 py-1 rounded bg-indigo-600 text-white text-xs font-semibold"
              onClick={() => setStep(step + 1)}
            >
              Next
            </button>
          ) : (
            <button
              className="px-4 py-1 rounded bg-green-600 text-white text-xs font-semibold"
              onClick={() => setOpen(false)}
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
