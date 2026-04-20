import { NextRequest } from "next/server";
import { subscribeCallLogEvents } from "@/lib/callLogEvents";
import { getAuthenticatedBusinessFromRequest } from "@/lib/sessionAuth";

function toSseBlock(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest) {
  const session = await getAuthenticatedBusinessFromRequest(request);

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(toSseBlock(event, data)));
      };

      send("connected", {
        ok: true,
        role: session.isAdmin ? "admin" : "customer",
        tenantId: session.isAdmin ? "__all__" : session.tenantId,
        timestamp: new Date().toISOString(),
      });

      const unsubscribe = subscribeCallLogEvents((payload) => {
        if (!session.isAdmin && payload.tenantId !== session.tenantId) {
          return;
        }

        send("call_log", payload);
      });

      const heartbeat = setInterval(() => {
        send("heartbeat", { t: Date.now() });
      }, 20000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Connection already closed by runtime.
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
