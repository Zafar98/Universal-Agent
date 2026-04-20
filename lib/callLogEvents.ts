type Listener = (payload: CallLogEventPayload) => void;

export type CallLogEventType = "call_log_created" | "call_log_updated";

export type CallLogEventPayload = {
  id: string;
  type: CallLogEventType;
  tenantId: string;
  timestamp: string;
};

const listeners = new Set<Listener>();

export function subscribeCallLogEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function publishCallLogEvent(payload: CallLogEventPayload) {
  for (const listener of listeners) {
    try {
      listener(payload);
    } catch (error) {
      console.error("Call log event listener failed:", error);
    }
  }
}
