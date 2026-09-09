/**
 * Async generator that reads an SSE byte stream and yields parsed JSON objects.
 *
 * - Buffers chunks and splits on newlines
 * - Extracts `data:` payloads (ignores `event:`, comments starting with `:`, empty lines)
 * - Parses JSON from data payloads
 * - Yields parsed objects; skips malformed JSON silently
 * - Handles partial lines across chunk boundaries
 */
export async function* parseSseStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");

      // Last element is the incomplete line — keep it in the buffer
      buffer = lines.pop() ?? "";

      for (const raw of lines) {
        const parsed = processLine(raw);

        if (parsed !== undefined) {
          yield parsed;
        }
      }
    }

    // Flush remaining buffer after stream ends
    buffer += decoder.decode();

    if (buffer) {
      const parsed = processLine(buffer);

      if (parsed !== undefined) {
        yield parsed;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function processLine(raw: string): unknown {
  const line = raw.trim();

  if (!line) {
    return;
  }

  // SSE comments
  if (line.startsWith(":")) {
    return;
  }

  // Event type lines — we only care about data
  if (line.startsWith("event:")) {
    return;
  }

  if (!line.startsWith("data:")) {
    return;
  }

  const payload = line.slice(5).trim();

  if (!payload) {
    return;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return;
  }
}
