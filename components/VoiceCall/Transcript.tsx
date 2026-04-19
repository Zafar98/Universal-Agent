// Transcript display component
"use client";

interface TranscriptProps {
  entries: Array<{
    speaker: "user" | "agent";
    text: string;
    timestamp: Date;
  }>;
}

export function Transcript({ entries }: TranscriptProps) {
  return (
    <div className="border rounded-lg bg-gray-50 p-4 h-96 overflow-y-auto space-y-3">
      <div className="font-semibold text-gray-700 text-sm">Live Transcript</div>

      {entries.length === 0 ? (
        <div className="text-gray-400 text-sm italic">Waiting for conversation...</div>
      ) : (
        entries.map((entry, idx) => (
          <div key={idx} className="space-y-1">
            <div
              className={`text-xs font-semibold ${
                entry.speaker === "agent" ? "text-blue-600" : "text-green-600"
              }`}
            >
              {entry.speaker === "agent" ? "🤖 Agent" : "👤 You"}
              <span className="text-gray-400 ml-2 font-normal text-xs">
                {entry.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <div className="text-sm text-gray-800 bg-white p-2 rounded border-l-2 border-gray-200">
              {entry.text}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
