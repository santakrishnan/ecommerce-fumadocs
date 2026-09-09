import type { AgentErrorCode } from "../errors/agent.errors";
import { agentErrorSseFrame } from "../errors/agent-error-response";

export function createAgentSseResponse(body: ReadableStream<Uint8Array>, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      // Stop proxies from buffering the stream and flushing only at close.
      "X-Accel-Buffering": "no",
    },
  });
}

export function createAgentErrorStream(
  code: AgentErrorCode,
  message: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(agentErrorSseFrame(code, message)));
      controller.close();
    },
  });
}
