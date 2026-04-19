// Types for the AI Voice Call System MVP

export interface CallCase {
  id: string;
  issueType: string;
  description: string;
  location: string;
  timestamp: Date;
  postcode: string;
  dateOfBirth: string;
  status: "open" | "closed";
}

export interface TranscriptEntry {
  speaker: "user" | "agent";
  text: string;
  timestamp: Date;
}

export interface VoiceSession {
  sessionId: string;
  startTime: Date;
  transcript: TranscriptEntry[];
  caseData: Partial<CallCase>;
  status: "active" | "ended";
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}
