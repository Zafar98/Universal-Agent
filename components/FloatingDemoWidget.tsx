import React, { useState } from "react";
import { useRouter } from "next/navigation";

export function FloatingDemoWidget() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        aria-label="Open AI Voice Demo"
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg p-4 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        onClick={() => router.push("/demo")}
        style={{ boxShadow: "0 4px 24px rgba(99,102,241,0.18)" }}
      >
        <span role="img" aria-label="microphone">🎙️</span>
        <span className="font-bold hidden sm:inline">Try Voice Demo</span>
      </button>
    </div>
  );
}
