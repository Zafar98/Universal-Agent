// Main test panel component
"use client";

import { useVoiceCall } from "@/lib/useVoiceCall";
import { Transcript } from "./Transcript";
import { CaseLogger } from "./CaseLogger";
import { useState, useEffect } from "react";

type TranscriptEntry = {
  speaker: "user" | "agent";
  text: string;
  timestamp: Date;
};

type CaseData = {
  id: string;
  issueType: string;
  description: string;
  location: string;
  postcode: string;
  dateOfBirth: string;
  timestamp: Date;
  status: string;
};

export function TestPanel() {
  const { callState, startCall, startListening, stopListening, endCall } = useVoiceCall();
  const [isClient, setIsClient] = useState(false);
  const transcriptEntries = Array.isArray(callState.transcript)
    ? (callState.transcript as TranscriptEntry[])
    : [];
  const caseData = (callState.caseData ?? null) as CaseData | null;

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Agent Voice Call Test Panel</h1>
        <p className="text-blue-100">
          Test the voice call system with real-time transcript and case logging
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Control Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border rounded-lg p-4 bg-white shadow">
            <div className="font-semibold mb-4 text-gray-800">Call Controls</div>

            {!callState.isActive ? (
              <button
                onClick={() => void startCall()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <span>📞</span> Start Test Call
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="text-sm text-red-700 font-semibold mb-1">
                    ● Call Active
                  </div>
                  <div className="text-xs text-red-600">Session: {callState.sessionId}</div>
                </div>

                {!callState.isListening ? (
                  <button
                    onClick={startListening}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <span>🎤</span> Start Speaking
                  </button>
                ) : (
                  <button
                    onClick={stopListening}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2 animate-pulse"
                  >
                    <span>⏹️</span> Stop Speaking
                  </button>
                )}

                <button
                  onClick={endCall}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition text-sm"
                >
                  End Call
                </button>
              </div>
            )}
          </div>

          {/* Status Panel */}
          <div className="border rounded-lg p-4 bg-white shadow">
            <div className="font-semibold mb-3 text-gray-800">Status</div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Call Status:</span>
                <span
                  className={`font-semibold ${
                    callState.isActive ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {callState.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Listening:</span>
                <span
                  className={`font-semibold ${
                    callState.isListening ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {callState.isListening ? "Yes" : "No"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Messages:</span>
                <span className="font-semibold text-gray-800">
                  {transcriptEntries.length}
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <div className="font-semibold text-blue-900 mb-2 text-sm">How to Test:</div>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Click "Start Test Call"</li>
              <li>The agent will greet you</li>
              <li>Click "Start Speaking" to record</li>
              <li>Say your postcode and date of birth</li>
              <li>Describe your issue</li>
              <li>Answer follow-up questions</li>
              <li>See your case logged</li>
            </ol>
          </div>
        </div>

        {/* Right Column: Call Display */}
        <div className="lg:col-span-2 space-y-4">
          {/* Transcript */}
          <Transcript entries={transcriptEntries} />

          {/* Case Logger */}
          {caseData && <CaseLogger caseData={caseData} />}

          {/* Empty State */}
          {!callState.isActive && transcriptEntries.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 bg-gray-50">
              <div className="text-4xl mb-2">🎧</div>
              <p className="font-semibold">No active call</p>
              <p className="text-sm">Click "Start Test Call" to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
