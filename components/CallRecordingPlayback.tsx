import React, { useRef, useState } from "react";

export function CallRecordingPlayback({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-slate-800/80 border border-slate-600 rounded-lg px-4 py-3 mt-4">
      <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} />
      <button
        onClick={playing ? handlePause : handlePlay}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label={playing ? "Pause recording" : "Play recording"}
      >
        {playing ? (
          <span role="img" aria-label="Pause">⏸️</span>
        ) : (
          <span role="img" aria-label="Play">▶️</span>
        )}
      </button>
      <span className="text-xs text-slate-200">Demo Call Recording</span>
    </div>
  );
}
