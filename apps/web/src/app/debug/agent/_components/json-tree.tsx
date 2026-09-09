/**
 * Zero-dependency collapsible JSON viewer built on native <details>/<summary>.
 *
 * Objects and arrays render as expandable nodes; primitives render inline. The
 * top two levels open by default (enough to see the frame shape and drill into
 * the Complete payload) while deep/large branches stay collapsed. No client
 * JS, no state — the browser handles expand/collapse.
 */

const DEFAULT_OPEN_DEPTH = 2;
const KEY_PREVIEW_LIMIT = 4;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Short one-line preview shown on a collapsed node's summary. */
function summarize(value: unknown): string {
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }
  const keys = Object.keys(value as Record<string, unknown>);
  const shown = keys.slice(0, KEY_PREVIEW_LIMIT).join(", ");
  const overflow = keys.length > KEY_PREVIEW_LIMIT ? ", …" : "";
  return `{ ${shown}${overflow} }`;
}

function formatPrimitive(value: unknown): string {
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (value === null) {
    return "null";
  }
  if (value === undefined) {
    return "undefined";
  }
  return String(value);
}

function JsonNode({ name, value, depth }: { depth: number; name?: string; value: unknown }) {
  const keyLabel =
    name === undefined ? null : <span className="text-text-secondary">{name}: </span>;

  if (Array.isArray(value) || isPlainObject(value)) {
    const entries: [string, unknown][] = Array.isArray(value)
      ? value.map((item, index) => [String(index), item])
      : Object.entries(value);

    if (entries.length === 0) {
      return (
        <div className="whitespace-pre-wrap py-0.5">
          {keyLabel}
          <span className="text-text-secondary">{Array.isArray(value) ? "[]" : "{}"}</span>
        </div>
      );
    }

    return (
      <details className="py-0.5" open={depth < DEFAULT_OPEN_DEPTH}>
        <summary className="cursor-pointer select-none rounded px-1 hover:bg-surface-secondary">
          {keyLabel}
          <span className="text-text-secondary">{summarize(value)}</span>
        </summary>
        <div className="ml-4 border-divider border-l pl-3">
          {entries.map(([childKey, childValue]) => (
            <JsonNode depth={depth + 1} key={childKey} name={childKey} value={childValue} />
          ))}
        </div>
      </details>
    );
  }

  return (
    <div className="whitespace-pre-wrap py-0.5">
      {keyLabel}
      <span className="text-text-primary">{formatPrimitive(value)}</span>
    </div>
  );
}

export function JsonTree({ data }: { data: unknown }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-divider bg-surface-secondary p-4 font-mono text-sm">
      <JsonNode depth={0} value={data} />
    </div>
  );
}
