"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCallClosingLineForTenant,
  getCallHangupPolicyForTenant,
  TenantConfig,
} from "@/lib/tenantConfig";
import { RoutingSource } from "@/lib/callRouting";
import {
  extractCaseDataFromTranscript,
  getCollectionCompleteness,
  buildMissingDetailsPrompt,
  buildConfirmationSummary,
} from "@/lib/callDataExtraction";

type Speaker = "user" | "agent";

interface TranscriptEntry {
  id: string;
  speaker: Speaker;
  text: string;
  timestamp: Date;
}

interface CallState {
  sessionId: string;
  isActive: boolean;
  isListening: boolean;
  isAgentSpeaking: boolean;
  isMuted: boolean;
  connectionStatus: "idle" | "connecting" | "connected" | "ending" | "error";
  tenantName: string;
  activeDepartmentName: string;
  routingSource: RoutingSource;
  routingRationale: string;
  callerName: string;
  verificationStatus: "pending" | "in_progress" | "verified";
  isTransferring: boolean;
  transcript: TranscriptEntry[];
  caseData: Record<string, string | string[] | undefined> | null;
  confirmationPending: boolean;
}

interface RealtimeEventPayload {
  type?: string;
  item_id?: string;
  delta?: string;
  transcript?: string;
  error?: unknown;
}

export interface CallStartOptions {
  tenantId?: string;
  callerName?: string;
  callerPhone?: string;
  callReason?: string;
  dialedDepartmentHint?: string;
  isDemoCall?: boolean;
  /** Browser fingerprint collected client-side. Sent to the server for IP+fingerprint identity tracking on demo calls. */
  fingerprint?: string;
}

export function extractVerificationFactors(text: string): string[] {
  const factors = new Set<string>();

  if (/my name is\s+[a-z]+(?:\s+[a-z]+)?/i.test(text) || /this is\s+[a-z]+/i.test(text)) {
    factors.add("name");
  }

  if (/\b(?:surname|last name)\b\s*(?:is\s+)?[a-z][a-z'\-]+/i.test(text)) {
    factors.add("surname");
  }

  if (/(\+?\d[\d\s\-]{7,}\d)/.test(text)) {
    factors.add("phone");
  }

  if (/[a-z]{1,2}\d[a-z\d]?\s*\d[a-z]{2}/i.test(text)) {
    factors.add("postcode");
  }

  if (/\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/.test(text)) {
    factors.add("date");
  }

  if (/\bdob\b|date of birth/i.test(text) || /\b\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}\b/.test(text)) {
    factors.add("dob");
  }

  if (/(account|booking|reservation|tenant|customer)\s*(number|no|id|reference|ref)?\s*[:#-]?\s*[a-z0-9\-]{4,}/i.test(text)) {
    factors.add("reference");
  }

  return Array.from(factors);
}

export function hasSatisfiedVerification(tenant: TenantConfig | null, factors: Set<string>): boolean {
  if (!tenant) {
    return factors.size >= 2;
  }

  if (tenant.businessModelId === "housing-association") {
    return factors.has("postcode") && (factors.has("dob") || factors.has("date"));
  }

  if (tenant.businessModelId === "hotel") {
    const hasReferenceAndSurname = factors.has("reference") && (factors.has("surname") || factors.has("name"));
    const hasPhoneAndCheckInDate = factors.has("phone") && factors.has("date");
    return hasReferenceAndSurname || hasPhoneAndCheckInDate;
  }

  return factors.size >= 2;
}

export function indicatesResolution(text: string): boolean {
  const lower = text.toLowerCase();
  // Must be a clear, standalone statement of completion — not incidental phrasing
  return (
    /\bthat'?s all\b/.test(lower) ||
    /\bnothing else\b/.test(lower) ||
    /\ball (done|sorted|good|fixed)\b/.test(lower) ||
    /\bfully (resolved|sorted|fixed)\b/.test(lower) ||
    /\b(issue|problem|fault) (is )?(now )?(resolved|fixed|sorted)\b/.test(lower)
  );
}

function indicatesConfirmationAcknowledgement(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("yes") ||
    lower.includes("correct") ||
    lower.includes("that's right") ||
    lower.includes("thats right") ||
    lower.includes("confirmed") ||
    lower.includes("all correct") ||
    lower.includes("looks good")
  );
}

function getBusinessOpeningPrompt(tenant: TenantConfig | null): string {
  if (!tenant) {
    return "Start with a short business greeting, verify identity quickly, ask why they are calling, complete the task, then close.";
  }

  if (tenant.businessModelId === "housing-association") {
    return "Your first sentence must be exactly: 'Developers Housing repairs and tenancy desk, how can I help today?' Then verify identity, capture repair/tenancy/complaint reason, log the case, confirm reference, and close.";
  }

  if (tenant.businessModelId === "hotel") {
    return "Your first sentence must be exactly: 'Grand Harbor Hotel reservations, guest services, and concierge desk, how may I assist you?' Then verify booking/stay details, complete booking or in-stay/concierge request, confirm details and ETA where needed, and close.";
  }

  if (tenant.businessModelId === "concierge") {
    return "Your first sentence must be exactly: 'Grand Harbor Concierge desk, what can I arrange for you now?' Then capture the concierge need, arrange it immediately, confirm ETA, and close.";
  }

  if (tenant.businessModelId === "restaurant") {
    return "Your first sentence must be exactly: 'Sunset Bistro bookings and orders, what can I prepare for you today?' Then capture reservation/order details, confirm final summary, and close.";
  }

  if (tenant.businessModelId === "utilities") {
    return "Your first sentence must be exactly: 'City Energy support desk, how can I help with your supply or account today?' Then classify the request as outage, billing, or account support, collect minimum details, confirm case reference, and close.";
  }

  if (tenant.businessModelId === "borough-council") {
    return "Your first sentence must be exactly: 'Borough Council support line, how can I help with your council service today?' Then route to the correct council service, capture required facts, provide timeline and reference, avoid legal advice, and close.";
  }

  return "Open briefly, complete the caller's operational request quickly, confirm outcome, then close.";
}

function createTranscriptEntry(id: string, speaker: Speaker, text = "") {
  return {
    id,
    speaker,
    text,
    timestamp: new Date(),
  };
}

export function useVoiceCall() {
  const [callState, setCallState] = useState<CallState>({
    sessionId: "",
    isActive: false,
    isListening: false,
    isAgentSpeaking: false,
    isMuted: false,
    connectionStatus: "idle",
    tenantName: "",
    activeDepartmentName: "",
    routingSource: "front-door",
    routingRationale: "",
    callerName: "",
    verificationStatus: "pending",
    isTransferring: false,
    transcript: [],
    caseData: null,
    confirmationPending: false,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptIndexRef = useRef<Map<string, number>>(new Map());
  const callStateRef = useRef<CallState | null>(null);
  const callStartedAtRef = useRef<string | null>(null);
  const callStartedAtMsRef = useRef<number | null>(null);
  const logSentRef = useRef(false);
  const shouldAutoEndRef = useRef(false);
  const autoEndTimerRef = useRef<number | null>(null);
  const activeEmotionRef = useRef<"neutral" | "frustrated" | "anxious" | "distressed">(
    "neutral"
  );
  const tenantProfileRef = useRef<TenantConfig | null>(null);
  const routingSourceRef = useRef<RoutingSource>("front-door");
  const routingRationaleRef = useRef("");
  const callerProfileRef = useRef<CallStartOptions>({});
  const verificationPassedRef = useRef(false);
  const verificationFactorsRef = useRef<Set<string>>(new Set());
  const closureRequestedRef = useRef(false);
  const confirmationCompletedRef = useRef(false);
  const endingInProgressRef = useRef(false);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const resetTranscriptIndex = useCallback(() => {
    transcriptIndexRef.current = new Map();
  }, []);

  const upsertTranscript = useCallback((entry: TranscriptEntry) => {
    setCallState((prev) => {
      const nextTranscript = [...prev.transcript];
      const existingIndex = transcriptIndexRef.current.get(entry.id);
      const existingEntry =
        existingIndex !== undefined ? nextTranscript[existingIndex] : undefined;

      if (existingIndex === undefined || !existingEntry) {
        transcriptIndexRef.current.set(entry.id, nextTranscript.length);
        nextTranscript.push(entry);
      } else {
        nextTranscript[existingIndex] = { ...existingEntry, ...entry };
      }

      return {
        ...prev,
        transcript: nextTranscript,
      };
    });
  }, []);

  const appendTranscriptDelta = useCallback((id: string, speaker: Speaker, delta: string) => {
    const transcriptId = id || `${speaker}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setCallState((prev) => {
      const nextTranscript = [...prev.transcript];
      const existingIndex = transcriptIndexRef.current.get(transcriptId);
      const existingEntry =
        existingIndex !== undefined ? nextTranscript[existingIndex] : undefined;

      if (existingIndex === undefined || !existingEntry) {
        transcriptIndexRef.current.set(transcriptId, nextTranscript.length);
        nextTranscript.push(createTranscriptEntry(transcriptId, speaker, delta));
      } else {
        nextTranscript[existingIndex] = {
          ...existingEntry,
          text: `${existingEntry.text || ""}${delta}`,
        };
      }

      return {
        ...prev,
        transcript: nextTranscript,
      };
    });
  }, []);

  const cleanupCallResources = useCallback(() => {
    if (autoEndTimerRef.current !== null) {
      window.clearTimeout(autoEndTimerRef.current);
      autoEndTimerRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.onmessage = null;
      dataChannelRef.current.onopen = null;
      dataChannelRef.current.onclose = null;
      dataChannelRef.current.onerror = null;
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.remove();
      remoteAudioRef.current = null;
    }
  }, []);

  const persistCallLog = useCallback(async () => {
    const snapshot = callStateRef.current;

    if (!snapshot || !snapshot.sessionId || logSentRef.current) {
      return;
    }

    if (snapshot.transcript.length === 0) {
      return;
    }

    logSentRef.current = true;

    try {
      await fetch("/api/call-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: snapshot.sessionId,
          startedAt: callStartedAtRef.current || new Date().toISOString(),
          endedAt: new Date().toISOString(),
          tenantId: tenantProfileRef.current?.id,
          callerName: callerProfileRef.current.callerName,
          callerPhone: callerProfileRef.current.callerPhone,
          routingSource: routingSourceRef.current,
          routingConfidence: routingSourceRef.current === "front-door" ? 0.32 : 0.88,
          transcript: snapshot.transcript.map((item) => ({
            id: item.id,
            speaker: item.speaker,
            text: item.text,
            timestamp:
              item.timestamp instanceof Date
                ? item.timestamp.toISOString()
                : String(item.timestamp),
          })),
          caseData: snapshot.caseData,
          isDemoCall: callerProfileRef.current.isDemoCall || false,
        }),
      });
    } catch (error) {
      console.error("Failed to persist call log:", error);
      logSentRef.current = false;
    }
  }, []);

  const hasMetHangupGuardrails = useCallback(() => {
    const tenant = tenantProfileRef.current;
    const policy = getCallHangupPolicyForTenant(tenant);
    const startedAtMs = callStartedAtMsRef.current || 0;
    const callAgeMs = startedAtMs > 0 ? Date.now() - startedAtMs : 0;
    const userTurns = (callStateRef.current?.transcript || []).filter(
      (entry) => entry.speaker === "user" && entry.text.trim().length > 0
    ).length;

    return (
      verificationPassedRef.current &&
      callAgeMs >= policy.minimumCallMs &&
      userTurns >= policy.minimumUserTurns
    );
  }, []);

  const endCall = useCallback(() => {
    if (endingInProgressRef.current) {
      return;
    }
    endingInProgressRef.current = true;

    const finalizeToIdle = () => {
      callStartedAtRef.current = null;
      callStartedAtMsRef.current = null;
      logSentRef.current = false;
      tenantProfileRef.current = null;
      routingSourceRef.current = "front-door";
      routingRationaleRef.current = "";
      callerProfileRef.current = {};
      verificationPassedRef.current = false;
      verificationFactorsRef.current = new Set();
      closureRequestedRef.current = false;
      confirmationCompletedRef.current = false;
      endingInProgressRef.current = false;

      setCallState({
        sessionId: "",
        isActive: false,
        isListening: false,
        isAgentSpeaking: false,
        isMuted: false,
        connectionStatus: "idle",
        tenantName: "",
        activeDepartmentName: "",
        routingSource: "front-door",
        routingRationale: "",
        callerName: "",
        verificationStatus: "pending",
        isTransferring: false,
        transcript: [],
        caseData: null,
        confirmationPending: false,
      });
    };

    setCallState((prev) => ({
      ...prev,
      connectionStatus: prev.isActive ? "ending" : "idle",
    }));

    void persistCallLog();

    try {
      cleanupCallResources();
      resetTranscriptIndex();
    } catch (error) {
      console.error("Error while cleaning up call resources:", error);
    } finally {
      finalizeToIdle();
    }
  }, [cleanupCallResources, persistCallLog, resetTranscriptIndex]);

  const sendDataChannelEvent = useCallback((payload: Record<string, unknown>) => {
    const channel = dataChannelRef.current;

    if (!channel || channel.readyState !== "open") {
      return;
    }

    channel.send(JSON.stringify(payload));
  }, []);

  const handleRealtimeEvent = useCallback(
    (event: MessageEvent<string>) => {
      let message: RealtimeEventPayload;

      try {
        message = JSON.parse(event.data);
      } catch (error) {
        console.error("Failed to parse realtime event:", error);
        return;
      }

      if (!message?.type) {
        return;
      }

      switch (message.type) {
        case "input_audio_buffer.speech_started":
          setCallState((prev) => ({
            ...prev,
            isListening: true,
            isAgentSpeaking: false,
          }));
          break;
        case "input_audio_buffer.speech_stopped":
          setCallState((prev) => ({
            ...prev,
            isListening: false,
          }));
          break;
        case "conversation.item.input_audio_transcription.delta":
          appendTranscriptDelta(String(message.item_id || ""), "user", String(message.delta || ""));
          break;
        case "conversation.item.input_audio_transcription.completed":
          {
            const callerText = String(message.transcript ?? "");
            const aggregateCallerText = [
              ...(callStateRef.current?.transcript || [])
                .filter((entry) => entry.speaker === "user")
                .map((entry) => entry.text),
              callerText,
            ]
              .join(" ")
              .trim();

            for (const factor of extractVerificationFactors(aggregateCallerText)) {
              verificationFactorsRef.current.add(factor);
            }

            if (
              !verificationPassedRef.current &&
              hasSatisfiedVerification(tenantProfileRef.current, verificationFactorsRef.current)
            ) {
              verificationPassedRef.current = true;
              setCallState((prev) => ({
                ...prev,
                verificationStatus: "verified",
              }));
            }

            const resolutionIntent = indicatesResolution(aggregateCallerText);

            if (callStateRef.current?.confirmationPending && indicatesConfirmationAcknowledgement(callerText)) {
              confirmationCompletedRef.current = true;
              closureRequestedRef.current = false;
              setCallState((prev) => ({
                ...prev,
                confirmationPending: false,
              }));

              const closingLine = tenantProfileRef.current
                ? getCallClosingLineForTenant(tenantProfileRef.current)
                : "Your request is complete. Thanks for calling. Take care. Goodbye.";

              sendDataChannelEvent({
                type: "response.create",
                response: {
                  instructions: `The customer has explicitly confirmed all details. End the call now with this exact ending line: '${closingLine}'`
                },
              });
            }

            let detectedEmotion: "neutral" | "frustrated" | "anxious" | "distressed" =
              "neutral";

            const lower = callerText.toLowerCase();
            if (
              lower.includes("angry") ||
              lower.includes("frustrated") ||
              lower.includes("upset") ||
              lower.includes("fed up")
            ) {
              detectedEmotion = "frustrated";
            } else if (
              lower.includes("worried") ||
              lower.includes("anxious") ||
              lower.includes("concerned")
            ) {
              detectedEmotion = "anxious";
            } else if (
              lower.includes("panic") ||
              lower.includes("distressed") ||
              lower.includes("can't cope")
            ) {
              detectedEmotion = "distressed";
            }

            if (detectedEmotion !== activeEmotionRef.current) {
              activeEmotionRef.current = detectedEmotion;
              sendDataChannelEvent({
                type: "session.update",
                session: {
                  instructions:
                    detectedEmotion === "neutral"
                      ? "Keep a natural, warm, calm phone-call tone."
                      : `The caller currently sounds ${detectedEmotion}. Mirror that emotion with empathy, but stay calm, clear, and reassuring.`,
                },
              });
            }

            const userTurns = (callStateRef.current?.transcript || []).filter((entry) => entry.speaker === "user").length;
            if (
              !verificationPassedRef.current &&
              !resolutionIntent &&
              !callStateRef.current?.confirmationPending &&
              !closureRequestedRef.current &&
              userTurns <= 4
            ) {
              setCallState((prev) => ({
                ...prev,
                verificationStatus: "in_progress",
                routingRationale: "Collecting missing verification details before proceeding.",
              }));

              sendDataChannelEvent({
                type: "response.create",
                response: {
                  instructions:
                    "Before continuing, verify identity now using the required factors for this business. Ask only for missing details and keep it brief."
                },
              });
            }

            if (resolutionIntent) {
              closureRequestedRef.current = true;
              const closingLine = tenantProfileRef.current
                ? getCallClosingLineForTenant(tenantProfileRef.current)
                : "Your request is complete. Thanks for calling. Take care. Goodbye.";
              sendDataChannelEvent({
                type: "response.create",
                response: {
                  instructions: `The caller indicates the issue is resolved. Close the call now with this exact ending line: '${closingLine}'`
                },
              });
            }
          }

          upsertTranscript({
            ...createTranscriptEntry(
              String(message.item_id || `user-${Date.now()}`),
              "user",
              String(message.transcript || "")
            ),
            text: String(message.transcript || ""),
          });
          break;
        case "response.created":
          setCallState((prev) => ({
            ...prev,
            isAgentSpeaking: true,
            isListening: false,
          }));
          break;
        case "response.output_audio_transcript.delta":
          appendTranscriptDelta(String(message.item_id || ""), "agent", String(message.delta || ""));
          break;
        case "response.output_audio_transcript.done":
          {
            const transcript = String(message.transcript ?? "").toLowerCase();

            if (
              transcript.includes("verified") ||
              transcript.includes("verification complete") ||
              transcript.includes("details are confirmed") ||
              transcript.includes("thanks for confirming")
            ) {
              verificationPassedRef.current = true;
              setCallState((prev) => ({
                ...prev,
                verificationStatus: "verified",
              }));

              setCallState((prev) => ({
                ...prev,
                routingSource: "front-door",
                routingRationale: "Verification complete. Continuing with the same business agent.",
                isTransferring: false,
              }));
            }

            // Only arm auto-end when we are actually in a closure phase to avoid
            // mid-call phrases like "take care" or "have a good day" triggering hangup.
            const inClosurePhase = closureRequestedRef.current || confirmationCompletedRef.current;

            const closingPhraseDetected =
              transcript.includes("thank you for calling") ||
              transcript.includes("thanks for calling") ||
              transcript.includes("goodbye") ||
              /\bbye\b/.test(transcript);

            shouldAutoEndRef.current =
              inClosurePhase && closingPhraseDetected && hasMetHangupGuardrails();

            if (shouldAutoEndRef.current) {
              closureRequestedRef.current = false;
            }
          }

          upsertTranscript({
            ...createTranscriptEntry(
              String(message.item_id || `agent-${Date.now()}`),
              "agent",
              String(message.transcript || "")
            ),
            text: String(message.transcript || ""),
          });
          break;
        case "response.done":
          setCallState((prev) => ({
            ...prev,
            isAgentSpeaking: false,
            isListening: !prev.isMuted,
          }));

          // If the agent already delivered a closing phrase, end immediately like a real phone call.
          if (shouldAutoEndRef.current) {
            shouldAutoEndRef.current = false;
            closureRequestedRef.current = false;
            const policy = getCallHangupPolicyForTenant(tenantProfileRef.current);

            autoEndTimerRef.current = window.setTimeout(() => {
              endCall();
            }, policy.autoEndDelayMs);
            break;
          }

          if (closureRequestedRef.current) {
            closureRequestedRef.current = false;

            // Extract and validate case data before allowing termination
            const fullTranscript = callState.transcript.map((t) => t.text).join(" ");

            const caseData = extractCaseDataFromTranscript(
              fullTranscript,
              tenantProfileRef.current,
              callState.activeDepartmentName
            );

            const { complete, missing } = getCollectionCompleteness(
              caseData,
              tenantProfileRef.current,
              callState.activeDepartmentName
            );

            if (!complete) {
              confirmationCompletedRef.current = false;
            }

            // If required data is incomplete, ask for it instead of ending
            if (!complete && missing.length > 0) {
              const missingPrompt = buildMissingDetailsPrompt(missing, tenantProfileRef.current);

              sendDataChannelEvent({
                type: "response.create",
                response: {
                  instructions: `The call is not yet ready to close. ${missingPrompt} Ask for these specific details, then confirm with the customer before closing.`
                },
              });

              setCallState((prev) => ({
                ...prev,
                caseData,
                confirmationPending: true,
              }));

              break;
            }

            // Data is complete - ask for explicit confirmation
            const summary = buildConfirmationSummary(caseData, tenantProfileRef.current);


            if (summary && !confirmationCompletedRef.current) {
              sendDataChannelEvent({
                type: "response.create",
                response: {
                  instructions: `Before closing, confirm these details with the customer. Say: "Let me confirm: ${summary} Is that all correct?" Listen for confirmation. If they confirm, ask: 'Is there anything else I can help you with today?' Only if they say no, then say: 'Thank you for calling, enjoy your day!' and end the call.`
                },
              });

              setCallState((prev) => ({
                ...prev,
                caseData,
                confirmationPending: true,
              }));

              break;
            }

            setCallState((prev) => ({
              ...prev,
              caseData,
              confirmationPending: false,
            }));

            sendDataChannelEvent({
              type: "response.create",
              response: {
                instructions: `All required details are confirmed. Ask: 'Is there anything else I can help you with today?' If the caller says no, end with: 'Thank you for calling, enjoy your day!' and then end the call.`
              },
            });

            break;
          }
          break;
        case "error":
          console.error("Realtime session error:", message.error);
          setCallState((prev) => ({
            ...prev,
            connectionStatus: "error",
            isAgentSpeaking: false,
            isListening: false,
          }));
          break;
        default:
          break;
      }
    },
    [appendTranscriptDelta, endCall, hasMetHangupGuardrails, sendDataChannelEvent, upsertTranscript]
  );

  const startCall = useCallback(async (options?: CallStartOptions) => {
    try {
      cleanupCallResources();
      resetTranscriptIndex();
      callerProfileRef.current = options || {};

      setCallState({
        sessionId: "",
        isActive: false,
        isListening: false,
        isAgentSpeaking: false,
        isMuted: false,
        connectionStatus: "connecting",
        tenantName: "",
        activeDepartmentName: "",
        routingSource: "front-door",
        routingRationale: "",
        callerName: options?.callerName || "",
        verificationStatus: "pending",
        isTransferring: false,
        transcript: [],
        caseData: null,
        confirmationPending: false,
      });
      callStartedAtRef.current = new Date().toISOString();
      callStartedAtMsRef.current = Date.now();
      logSentRef.current = false;
      verificationPassedRef.current = false;
      verificationFactorsRef.current = new Set();
      closureRequestedRef.current = false;
      confirmationCompletedRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      localStreamRef.current = stream;

      const audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.setAttribute("playsinline", "true");
      audioElement.muted = false;
      audioElement.volume = 1;
      audioElement.style.display = "none";
      document.body.appendChild(audioElement);
      remoteAudioRef.current = audioElement;
      // Prime playback in the user-gesture call stack to avoid browser autoplay blocking.
      audioElement.play().catch(() => {
        // The actual remote stream is played again on track attach.
      });

      routingSourceRef.current = "front-door";
      routingRationaleRef.current =
        "Single-agent mode is active. The same business agent will handle the full call end-to-end.";

      const tokenResponse = await fetch("/api/realtime/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(options || {}),
          tenantId: options?.tenantId,
          routingSource: "front-door",
          routingRationale: routingRationaleRef.current,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(tokenData.error || "Failed to create realtime session");
      }

      const ephemeralKey = tokenData.value ?? tokenData.client_secret?.value;
      const sessionId = tokenData.session?.id ?? `realtime-${Date.now()}`;
      tenantProfileRef.current = tokenData.tenant || null;

      if (!ephemeralKey) {
        throw new Error("Realtime session token was missing from the server response");
      }

      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      peerConnection.ontrack = (event) => {
        if (!remoteAudioRef.current) {
          return;
        }

        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.play().catch((error) => {
          console.error("Remote audio playback error:", error);
        });
      };

      peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;

        if (state === "connected") {
          setCallState((prev) => ({
            ...prev,
            isActive: true,
            connectionStatus: "connected",
            isListening: !prev.isMuted,
          }));
          return;
        }

        if (state === "failed" || state === "closed" || state === "disconnected") {
          endCall();
        }
      };

      stream.getAudioTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      const dataChannel = peerConnection.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;

      dataChannel.onmessage = handleRealtimeEvent;
      dataChannel.onopen = () => {
        setCallState((prev) => ({
          ...prev,
          sessionId,
          isActive: true,
          connectionStatus: "connected",
          tenantName: tenantProfileRef.current?.name || "",
          activeDepartmentName: `${tenantProfileRef.current?.businessModelName || "Business"} Agent`,
          routingSource: routingSourceRef.current,
          routingRationale: routingRationaleRef.current,
          callerName: options?.callerName || "",
          isListening: !prev.isMuted,
        }));

        sendDataChannelEvent({
          type: "response.create",
          response: {
            instructions: `The caller has just connected to ${tenantProfileRef.current?.name || "the business"}. ${getBusinessOpeningPrompt(
              tenantProfileRef.current
            )} Stay as one continuous business agent for the full call, handle the request directly in one script, and do not mention transfers or other agents. Completion target: finish standard requests within 4 agent turns after verification, then close with the exact line '${
              tenantProfileRef.current
                ? getCallClosingLineForTenant(tenantProfileRef.current)
                : "Your request is complete. Thanks for calling. Take care. Goodbye."
            }'. Begin with fast verification first. Collect two identity factors, confirm verification once, classify intent, collect minimum details, complete the task, and end without filler. After verification is complete, never ask for verification again during this same request.`
          },
        });
      };
      dataChannel.onerror = (event) => {
        console.error("Realtime data channel error:", event);
      };

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      const sdpResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!sdpResponse.ok) {
        throw new Error(await sdpResponse.text());
      }

      const answer = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };

      await peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error("Failed to start realtime call:", error);
      cleanupCallResources();
      resetTranscriptIndex();
      setCallState((prev) => ({
        ...prev,
        isActive: false,
        isListening: false,
        isAgentSpeaking: false,
        connectionStatus: "error",
      }));
      alert("Could not start the live voice call. Check your API key, browser permissions, and try again.");
    }
  }, [
    cleanupCallResources,
    endCall,
    handleRealtimeEvent,
    resetTranscriptIndex,
    sendDataChannelEvent,
  ]);

  const setMuted = useCallback((muted: boolean) => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }

    setCallState((prev) => ({
      ...prev,
      isMuted: muted,
      isListening: muted ? false : !prev.isAgentSpeaking && prev.isActive,
    }));
  }, []);

  const startListening = useCallback(() => {
    setMuted(false);
  }, [setMuted]);

  const stopListening = useCallback(() => {
    setMuted(true);
  }, [setMuted]);

  useEffect(() => {
    return () => {
      cleanupCallResources();
    };
  }, [cleanupCallResources]);

  return {
    callState,
    startCall,
    startListening,
    stopListening,
    endCall,
  };
}
