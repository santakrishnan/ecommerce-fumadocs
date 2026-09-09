"use client";

import {
  type ActivityLogEntry,
  fetchActivityLogClient,
  recordActivityClient,
} from "@features/profile/activities/client";
import { PAGE_TYPE } from "@features/profile/activities/page-types";
import {
  fetchLifetimePreferencesClient,
  fetchSearchPreferencesClient,
} from "@features/profile/preferences/bff/services/preferences-client";
import { useVisitorIdentity } from "@shared/providers/visitor-provider";
import type { LifetimePreferences, SearchPreferences } from "@ucmp/sdk-visitor-profile-api";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

type WeightedMap = Record<string, number>;

/** Extends ActivityLogEntry with "pending" for optimistic UI during fire. */
interface ActivityLog extends Omit<ActivityLogEntry, "status"> {
  status: "success" | "error" | "pending" | "skipped";
}

// ─── Enum Values from SDK Spec ──────────────────────────────────────────────

const PAGE_SOURCES = [
  "LandingPage",
  "WelcomeBack",
  "ConversationalSearch",
  "Srp",
  "Vdp",
  "Comparison",
  "Recommendations",
  "Watchlist",
] as const;

const SORT_OPTIONS = [
  "Recommended",
  "LowestPrice",
  "HighestPrice",
  "LowestMileage",
  "NewestYear",
] as const;

const FILTER_TYPES = ["Enum", "MultiEnum", "Range", "Boolean"] as const;

const DIMENSION_IDS = [
  "make",
  "model",
  "trim",
  "bodyStyle",
  "fuelType",
  "drivetrain",
  "transmissionType",
  "exteriorColorFamily",
  "interiorColorFamily",
  "seatingCapacity",
  "price",
  "mileage",
  "year",
  "features",
  "certified",
  "condition",
  "vehicleStatus",
  "dealerId",
  "daysInStock",
  "powertrainType",
  "vehicleCategory",
  "dealRating",
  "fuelEfficient",
  "isLowMiles",
  "familyFriendly",
  "hasThirdRow",
  "offRoadCapable",
  "towingCapable",
  "isLuxury",
  "isSporty",
  "isCityFriendly",
  "availability",
] as const;

const BODY_STYLES = [
  "Sedan",
  "SUV",
  "Truck",
  "Coupe",
  "Convertible",
  "Hatchback",
  "Van",
  "Wagon",
  "Minivan",
] as const;

const SEARCH_FLOWS = ["Agentic", "Filtered", "Organic", "Direct"] as const;

const PAGE_TYPES = Object.values(PAGE_TYPE);

// ─── Dynamic Form Field Definitions ─────────────────────────────────────────

type FieldType = "text" | "number" | "select" | "group";

interface FieldDef {
  defaultValue?: string | number;
  fields?: FieldDef[];
  key: string;
  label: string;
  options?: readonly string[];
  placeholder?: string;
  required?: boolean;
  type: FieldType;
}

interface EventTypeConfig {
  fields: FieldDef[];
  label: string;
}

const VEHICLE_FIELDS: FieldDef[] = [
  { key: "vin", label: "VIN", type: "text", placeholder: "17-char VIN", required: true },
  {
    key: "title",
    label: "Title",
    type: "text",
    placeholder: "2023 Toyota Camry LE",
    required: true,
  },
  { key: "year", label: "Year", type: "number", placeholder: "2023" },
  { key: "make", label: "Make", type: "text", placeholder: "Toyota" },
  { key: "model", label: "Model", type: "text", placeholder: "Camry" },
  { key: "trim", label: "Trim", type: "text", placeholder: "LE" },
  { key: "bodyStyle", label: "Body Style", type: "select", options: BODY_STYLES },
  { key: "listPrice", label: "List Price", type: "number", placeholder: "24988" },
  { key: "mileage", label: "Mileage", type: "number", placeholder: "17784" },
];

const FILTER_FIELDS: FieldDef[] = [
  { key: "key", label: "Dimension", type: "select", options: DIMENSION_IDS, required: true },
  {
    key: "filterType",
    label: "Filter Type",
    type: "select",
    options: FILTER_TYPES,
    required: true,
  },
  { key: "value", label: "Value (Enum)", type: "text", placeholder: "toyota" },
  {
    key: "values",
    label: "Values (MultiEnum, comma-sep)",
    type: "text",
    placeholder: "suv,sedan",
  },
  { key: "min", label: "Min (Range)", type: "number", placeholder: "0" },
  { key: "max", label: "Max (Range)", type: "number", placeholder: "50000" },
];

const FILTER_FIELD: FieldDef = {
  key: "filters",
  label: "Filter",
  type: "group",
  fields: FILTER_FIELDS,
};

const EVENT_TYPE_CONFIGS: Record<string, EventTypeConfig> = {
  "visitorActivity.vehicle.viewed": {
    label: "👁 Vehicle Viewed",
    fields: [
      { key: "vehicle", label: "Vehicle Details", type: "group", fields: VEHICLE_FIELDS },
      { key: "source", label: "Source", type: "select", options: PAGE_SOURCES },
    ],
  },
  "visitorActivity.vehicle.clicked": {
    label: "👆 Vehicle Clicked",
    fields: [
      { key: "vehicle", label: "Vehicle Details", type: "group", fields: VEHICLE_FIELDS },
      { key: "source", label: "Source", type: "select", options: PAGE_SOURCES, required: true },
      { key: "position", label: "Position in list", type: "number", placeholder: "1" },
    ],
  },
  "visitorActivity.vehicle.bookmarked": {
    label: "💾 Vehicle Bookmarked",
    fields: [
      { key: "vehicle", label: "Vehicle Details", type: "group", fields: VEHICLE_FIELDS },
      { key: "source", label: "Source", type: "select", options: PAGE_SOURCES },
    ],
  },
  "visitorActivity.vehicle.unbookmarked": {
    label: "🗑 Vehicle Unbookmarked",
    fields: [
      {
        key: "vehicle",
        label: "Vehicle Details",
        type: "group",
        fields: [
          { key: "vin", label: "VIN", type: "text", placeholder: "17-char VIN", required: true },
          {
            key: "title",
            label: "Title",
            type: "text",
            placeholder: "2023 Toyota Camry LE",
            required: true,
          },
        ],
      },
    ],
  },
  "visitorActivity.recommendation.clicked": {
    label: "✨ Recommendation Clicked",
    fields: [
      { key: "vehicle", label: "Vehicle Details", type: "group", fields: VEHICLE_FIELDS },
      { key: "source", label: "Source", type: "select", options: PAGE_SOURCES, required: true },
      { key: "position", label: "Position", type: "number", placeholder: "1" },
    ],
  },
  "visitorActivity.search.executed": {
    label: "🔎 Search Executed",
    fields: [
      { key: "searchFlow", label: "Search Flow", type: "select", options: SEARCH_FLOWS },
      {
        key: "query",
        label: "Search Query",
        type: "text",
        placeholder: "fuel efficient SUV under $35k",
      },
      {
        key: "sort",
        label: "Sort",
        type: "select",
        options: SORT_OPTIONS,
        defaultValue: "Recommended",
      },
      { key: "resultCount", label: "Result Count", type: "number", placeholder: "42" },
      { key: "page", label: "Page", type: "number", defaultValue: 1 },
      FILTER_FIELD,
    ],
  },
  "visitorActivity.filter.added": {
    label: "➕ Filter Added",
    fields: [FILTER_FIELD],
  },
  "visitorActivity.filter.removed": {
    label: "➖ Filter Removed",
    fields: [FILTER_FIELD],
  },
  "visitorActivity.sort.executed": {
    label: "↕ Sort Executed",
    fields: [
      { key: "previousSort", label: "Previous Sort", type: "select", options: SORT_OPTIONS },
      { key: "newSort", label: "New Sort", type: "select", options: SORT_OPTIONS, required: true },
    ],
  },
  "visitorActivity.page.viewed": {
    label: "📄 Page Viewed",
    fields: [
      { key: "pageType", label: "Page Type", type: "select", options: PAGE_TYPES, required: true },
      { key: "pageUrl", label: "Page URL", type: "text", placeholder: "/used-cars/details/..." },
      { key: "referrerPageType", label: "Referrer Page Type", type: "select", options: PAGE_TYPES },
    ],
  },
  "visitorActivity.suggestion.clicked": {
    label: "💡 Suggestion Clicked",
    fields: [
      {
        key: "suggestionId",
        label: "Suggestion ID",
        type: "text",
        placeholder: "sugg-001",
        required: true,
      },
      { key: "suggestionType", label: "Suggestion Type", type: "text", placeholder: "trending" },
      {
        key: "suggestionTitle",
        label: "Suggestion Title",
        type: "text",
        placeholder: "Popular SUVs near you",
      },
      { key: "source", label: "Source", type: "select", options: PAGE_SOURCES },
    ],
  },
  "visitorActivity.smartFilter.removed": {
    label: "🏷 Smart Filter Removed",
    fields: [
      {
        key: "name",
        label: "Smart Filter Name",
        type: "text",
        placeholder: "Toyota SUVs under $35k",
        required: true,
      },
      FILTER_FIELD,
    ],
  },
  "visitorActivity.appointment.executed": {
    label: "📅 Appointment Executed",
    fields: [
      { key: "vehicle", label: "Vehicle Details", type: "group", fields: VEHICLE_FIELDS },
      { key: "dealerId", label: "Dealer ID", type: "number", placeholder: "12345", required: true },
      { key: "dealerName", label: "Dealer Name", type: "text", placeholder: "ABC Motors" },
      {
        key: "appointmentType",
        label: "Appointment Type",
        type: "text",
        placeholder: "test drive",
      },
      {
        key: "contactMethod",
        label: "Contact Method",
        type: "text",
        placeholder: "phone",
        required: true,
      },
    ],
  },
  "visitorActivity.session.started": {
    label: "🟢 Session Started",
    fields: [
      {
        key: "isNewVisitor",
        label: "Is New Visitor",
        type: "select",
        options: ["true", "false"] as unknown as readonly string[],
        required: true,
      },
      {
        key: "entryPageType",
        label: "Entry Page Type",
        type: "select",
        options: PAGE_TYPES,
        required: true,
      },
      { key: "referrer", label: "Referrer URL", type: "text", placeholder: "https://google.com" },
      {
        key: "deviceType",
        label: "Device Type",
        type: "select",
        options: ["desktop", "mobile", "tablet"] as unknown as readonly string[],
      },
    ],
  },
  "visitorActivity.session.expired": {
    label: "🔴 Session Expired",
    fields: [
      {
        key: "startedAt",
        label: "Started At (ISO)",
        type: "text",
        placeholder: "2026-07-26T10:00:00Z",
        required: true,
      },
      {
        key: "expiredAt",
        label: "Expired At (ISO)",
        type: "text",
        placeholder: "2026-07-26T10:30:00Z",
        required: true,
      },
    ],
  },
};

// ─── Sub-Components ─────────────────────────────────────────────────────────

function WeightBar({
  label,
  weight,
  maxWeight,
}: {
  label: string;
  maxWeight: number;
  weight: number;
}) {
  const pct = maxWeight > 0 ? (weight / maxWeight) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 truncate font-mono text-text-subtle">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right font-mono text-text-subtle">{weight.toFixed(1)}</span>
    </div>
  );
}

function DimensionCard({ dimension, weights }: { dimension: string; weights: WeightedMap }) {
  const entries = Object.entries(weights).sort(([, a], [, b]) => b - a);
  const maxWeight = entries[0]?.[1] ?? 0;

  return (
    <div className="rounded-xl border border-border-default bg-surface-primary p-3 shadow-sm transition-shadow hover:shadow-md">
      <h4 className="mb-2 font-semibold text-primary text-xs uppercase tracking-wide">
        {dimension}
      </h4>
      <div className="flex flex-col gap-1">
        {entries.slice(0, 5).map(([label, weight]) => (
          <WeightBar key={label} label={label} maxWeight={maxWeight} weight={weight} />
        ))}
        {entries.length > 5 && (
          <span className="mt-1 text-center text-[10px] text-text-subtle">
            +{entries.length - 5} more
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "success" | "error" | "pending" | "skipped" }) {
  const styles: Record<string, string> = {
    success: "bg-green-100 text-green-700 border-green-200",
    error: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse",
    skipped: "bg-gray-100 text-gray-500 border-gray-200",
  };
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 font-medium text-[10px] ${styles[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

// ─── Dynamic Form Fields ────────────────────────────────────────────────────

function FormField({
  field,
  prefix,
  value,
  onChange,
}: {
  field: FieldDef;
  onChange: (key: string, value: string) => void;
  prefix?: string;
  value: string;
}) {
  const fieldKey = prefix ? `${prefix}.${field.key}` : field.key;
  const inputId = `field-${fieldKey}`;

  if (field.type === "select" && field.options) {
    return (
      <div>
        <label className="mb-1 block text-[11px] text-text-subtle" htmlFor={inputId}>
          {field.label}
          {field.required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        <select
          className="w-full rounded-md border border-border-default bg-surface-secondary px-2.5 py-1.5 text-text-default text-xs focus:border-primary focus:outline-none"
          id={inputId}
          onChange={(e) => onChange(fieldKey, e.target.value)}
          value={value}
        >
          <option value="">— select —</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-[11px] text-text-subtle" htmlFor={inputId}>
        {field.label}
        {field.required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <input
        className="w-full rounded-md border border-border-default bg-surface-secondary px-2.5 py-1.5 text-text-default text-xs placeholder:text-text-subtle/50 focus:border-primary focus:outline-none"
        id={inputId}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder={field.placeholder ?? ""}
        type={field.type === "number" ? "number" : "text"}
        value={value}
      />
    </div>
  );
}

function DynamicFormFields({
  config,
  formValues,
  onChange,
}: {
  config: EventTypeConfig | undefined;
  formValues: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
}) {
  if (!config) {
    return <p className="text-text-subtle text-xs">No form config for this event type.</p>;
  }

  const handleChange = (key: string, value: string) => {
    onChange({ ...formValues, [key]: value });
  };

  return (
    <>
      {config.fields.map((field) => {
        if (field.type === "group" && field.fields) {
          return (
            <fieldset className="rounded-lg border border-border-default/60 p-3" key={field.key}>
              <legend className="px-1.5 font-medium text-primary text-xs">{field.label}</legend>
              <div className="grid grid-cols-2 gap-2">
                {field.fields.map((subField) => (
                  <FormField
                    field={subField}
                    key={`${field.key}.${subField.key}`}
                    onChange={handleChange}
                    prefix={field.key}
                    value={formValues[`${field.key}.${subField.key}`] ?? ""}
                  />
                ))}
              </div>
            </fieldset>
          );
        }
        return (
          <FormField
            field={field}
            key={field.key}
            onChange={handleChange}
            value={formValues[field.key] ?? ""}
          />
        );
      })}
    </>
  );
}

// ─── Payload Builder Helper ─────────────────────────────────────────────────

function buildGroupFields(
  fields: FieldDef[],
  formValues: Record<string, string>,
  groupKey: string
): Record<string, unknown> | null {
  const group: Record<string, unknown> = {};
  let hasValue = false;

  for (const subField of fields) {
    const val = formValues[`${groupKey}.${subField.key}`];
    if (val === undefined || val === "") {
      continue;
    }
    hasValue = true;
    if (subField.type === "number") {
      group[subField.key] = Number(val);
    } else if (subField.key === "values") {
      group[subField.key] = val.split(",").map((v) => v.trim());
    } else {
      group[subField.key] = val;
    }
  }

  return hasValue ? group : null;
}

function buildFieldValue(field: FieldDef, val: string): unknown {
  if (field.type === "number") {
    return Number(val);
  }
  if (field.key === "isNewVisitor") {
    return val === "true";
  }
  return val;
}

function eventNeedsSearchId(type: string): boolean {
  return (
    type.includes("search") ||
    type.includes("filter") ||
    type.includes("sort") ||
    type.includes("smartFilter")
  );
}

function isFilterEvent(eventType: string): boolean {
  return (
    eventType === "visitorActivity.filter.added" || eventType === "visitorActivity.filter.removed"
  );
}

function applyFormFields(
  payload: Record<string, unknown>,
  fields: FieldDef[],
  formValues: Record<string, string>
): void {
  for (const field of fields) {
    if (field.type === "group" && field.fields) {
      const group = buildGroupFields(field.fields, formValues, field.key);
      if (group) {
        if (field.key === "filters") {
          payload.filters = [group];
        } else {
          payload[field.key] = group;
        }
      }
    } else {
      const val = formValues[field.key];
      if (val !== undefined && val !== "") {
        payload[field.key] = buildFieldValue(field, val);
      }
    }
  }

  // filter.added / filter.removed need `filter` (singular object) alongside `filters` array
  if (isFilterEvent(payload.type as string) && Array.isArray(payload.filters)) {
    payload.filter = (payload.filters as unknown[])[0];
  }
}

function assemblePayload(
  selectedType: string,
  config: EventTypeConfig | undefined,
  formValues: Record<string, string>,
  visitorId: string | null,
  sessionId: string | null,
  searchId?: string
): Record<string, unknown> {
  const needsSearchId = eventNeedsSearchId(selectedType);

  const payload: Record<string, unknown> = {
    type: selectedType,
    visitorId: visitorId ?? crypto.randomUUID(),
    sessionId: sessionId ?? crypto.randomUUID(),
    ...(needsSearchId ? { searchId: searchId || crypto.randomUUID() } : {}),
  };

  if (!config) {
    return payload;
  }

  applyFormFields(payload, config.fields, formValues);
  return payload;
}

// ─── Preferences Panels ─────────────────────────────────────────────────────

function LifetimePreferencesBody({
  dimensions,
  error,
  isLoading,
  lifetime,
}: {
  dimensions: [string, WeightedMap][];
  error: string | null;
  isLoading: boolean;
  lifetime: LifetimePreferences | null;
}) {
  if (isLoading) {
    return (
      <div className="animate-pulse py-8 text-center text-sm text-text-subtle">Loading...</div>
    );
  }
  if (error) {
    return <div className="rounded-lg bg-red-50 p-3 text-red-700 text-xs">{error}</div>;
  }
  if (dimensions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-text-subtle">
        No preferences recorded yet. Fire some activities →
      </p>
    );
  }
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {dimensions.map(([dim, weights]) => (
          <DimensionCard dimension={dim} key={dim} weights={weights} />
        ))}
      </div>
      {lifetime && (
        <details className="mt-4 rounded-lg border border-border-default p-3">
          <summary className="cursor-pointer font-medium text-text-subtle text-xs hover:text-text-default">
            📄 Raw JSON
          </summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-surface-secondary p-3 font-mono text-[11px] text-text-default">
            {JSON.stringify(lifetime, null, 2)}
          </pre>
        </details>
      )}
    </>
  );
}

function SearchPreferencesResults({ searchPrefs }: { searchPrefs: SearchPreferences }) {
  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap gap-3 rounded-lg bg-surface-secondary p-2 text-[11px]">
        <span className="text-text-subtle">
          Events: <strong className="text-text-default">{searchPrefs.eventsCount ?? 0}</strong>
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries((searchPrefs.preferences ?? {}) as Record<string, WeightedMap>)
          .filter(([, w]) => Object.keys(w).length > 0)
          .map(([dim, weights]) => (
            <DimensionCard dimension={dim} key={dim} weights={weights} />
          ))}
      </div>
      <details className="mt-4 rounded-lg border border-border-default p-3">
        <summary className="cursor-pointer font-medium text-text-subtle text-xs hover:text-text-default">
          📄 Raw JSON
        </summary>
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-surface-secondary p-3 font-mono text-[11px] text-text-default">
          {JSON.stringify(searchPrefs, null, 2)}
        </pre>
      </details>
    </div>
  );
}

function ActivityLogPanel({
  logEndRef,
  logs,
  onClear,
  onRefresh,
}: {
  logEndRef: React.RefObject<HTMLDivElement | null>;
  logs: ActivityLog[];
  onClear: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border-default bg-surface-primary p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold text-base text-text-default">📋 Activity Log</h2>
        <div className="flex gap-2">
          <button
            className="rounded-md bg-surface-secondary px-2 py-1 text-[11px] text-text-subtle hover:text-text-default"
            onClick={onRefresh}
            type="button"
          >
            ↻ Refresh
          </button>
          {logs.length > 0 && (
            <button
              className="rounded-md bg-surface-secondary px-2 py-1 text-[11px] text-text-subtle hover:text-text-default"
              onClick={onClear}
              type="button"
            >
              Clear all
            </button>
          )}
        </div>
      </div>
      <p className="mb-3 text-[11px] text-text-subtle">
        Shows activities recorded by real app interactions (card clicks, VDP views, bookmarks) and
        events fired from this console. Auto-refreshes every 5 s.
      </p>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {logs.length === 0 ? (
          <p className="py-8 text-center text-text-subtle text-xs">
            No activities recorded yet.
            <br />
            Click a vehicle card or use the Activity Generator above.
          </p>
        ) : (
          logs.map((log) => (
            <div
              className="flex items-start gap-2 rounded-lg border border-border-default bg-surface-secondary px-3 py-2"
              key={log.id}
            >
              <StatusBadge status={log.status} />
              <div className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[11px] text-text-default">
                  {log.type.replace("visitorActivity.", "")}
                </span>
                {log.reason && (
                  <span className="block truncate text-[10px] text-text-subtle" title={log.reason}>
                    {log.reason}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-[10px] text-text-subtle">
                {new Date(log.recordedAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function VisitorDebugPage() {
  const { visitorId, sessionId: currentSessionId } = useVisitorIdentity();
  const [searchId, setSearchId] = useState("");
  const [lifetime, setLifetime] = useState<LifetimePreferences | null>(null);
  const [searchPrefs, setSearchPrefs] = useState<SearchPreferences | null>(null);
  const [lifetimeError, setLifetimeError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoadingLifetime, setIsLoadingLifetime] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);

  // Activity generator state
  const [selectedType, setSelectedType] = useState<string>("visitorActivity.vehicle.viewed");
  const [activityJson, setActivityJson] = useState("");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  // Cursor for incremental polling — tracks the last recordedAt we've seen.
  const lastSeenAtRef = useRef<string | undefined>(undefined);
  const [isSending, setIsSending] = useState(false);
  const [editorMode, setEditorMode] = useState<"form" | "json">("form");
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [activitySearchId, setActivitySearchId] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  const showSearchIdInput = eventNeedsSearchId(selectedType);

  // Reset form values when event type changes
  useEffect(() => {
    setFormValues({});
  }, [selectedType]);

  // Build payload from form values
  const buildPayloadFromForm = useCallback(
    (): Record<string, unknown> =>
      assemblePayload(
        selectedType,
        EVENT_TYPE_CONFIGS[selectedType],
        formValues,
        visitorId,
        currentSessionId,
        activitySearchId || undefined
      ),
    [selectedType, formValues, visitorId, currentSessionId, activitySearchId]
  );

  // Sync form → JSON when in form mode
  useEffect(() => {
    if (editorMode === "form") {
      const payload = buildPayloadFromForm();
      setActivityJson(JSON.stringify(payload, null, 2));
    }
  }, [editorMode, buildPayloadFromForm]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activityLogs]);

  const fetchLifetime = useCallback(async () => {
    setIsLoadingLifetime(true);
    setLifetimeError(null);
    try {
      const data = await fetchLifetimePreferencesClient();
      setLifetime(data);
    } catch (err) {
      setLifetimeError(err instanceof Error ? err.message : "Failed to fetch preferences");
      setLifetime(null);
    } finally {
      setIsLoadingLifetime(false);
    }
  }, []);

  const fetchSearch = useCallback(async () => {
    if (!searchId.trim()) {
      setSearchPrefs(null);
      setSearchError(null);
      return;
    }
    setIsLoadingSearch(true);
    setSearchError(null);
    try {
      const data = await fetchSearchPreferencesClient(searchId.trim());
      setSearchPrefs(data);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Failed to fetch search preferences");
      setSearchPrefs(null);
    } finally {
      setIsLoadingSearch(false);
    }
  }, [searchId]);

  /**
   * Poll the server ring buffer for new entries and merge them into local
   * state, deduplicating by id so optimistic pending entries are preserved.
   */
  const refreshActivityLog = useCallback(async () => {
    try {
      const entries = await fetchActivityLogClient(lastSeenAtRef.current);
      if (entries.length === 0) {
        return;
      }
      const latest = entries.at(-1)?.recordedAt;
      if (latest) {
        lastSeenAtRef.current = latest;
      }
      setActivityLogs((prev) => {
        const existingIds = new Set(prev.map((l) => l.id));
        const newEntries = entries
          .filter((e) => !existingIds.has(e.id))
          .map(
            (e): ActivityLog => ({
              id: e.id,
              type: e.type,
              status: e.status,
              recordedAt: e.recordedAt,
              reason: e.reason,
            })
          );
        return newEntries.length === 0 ? prev : [...prev, ...newEntries];
      });
    } catch {
      // Polling failure is silent — log just doesn't update.
    }
  }, []);

  const clearActivityLog = useCallback(async () => {
    setActivityLogs([]);
    lastSeenAtRef.current = undefined;
    try {
      await fetch("/api/v1/profile/activities?action=clear");
    } catch {
      // Best-effort.
    }
  }, []);

  const fireActivity = useCallback(async () => {
    const logId = crypto.randomUUID();
    const now = new Date().toISOString();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(activityJson);
    } catch {
      setActivityLogs((prev) => [
        ...prev,
        {
          id: logId,
          type: "parse-error",
          status: "error",
          recordedAt: now,
          reason: "Invalid JSON",
        },
      ]);
      return;
    }

    // Inject searchId from the input if the event needs one and the payload doesn't have it
    if (showSearchIdInput && activitySearchId && !parsed.searchId) {
      parsed.searchId = activitySearchId;
    }

    // Optimistic pending entry for instant visual feedback.
    setActivityLogs((prev) => [
      ...prev,
      {
        id: logId,
        type: String(parsed.type ?? "unknown"),
        status: "pending",
        recordedAt: now,
      },
    ]);
    setIsSending(true);

    try {
      await recordActivityClient(parsed as never);
      setActivityLogs((prev) =>
        prev.map((l) => (l.id === logId ? { ...l, status: "success" as const } : l))
      );
      // Immediate poll so the server-confirmed entry shows up quickly.
      refreshActivityLog();
    } catch (err) {
      setActivityLogs((prev) =>
        prev.map((l) =>
          l.id === logId
            ? {
                ...l,
                status: "error" as const,
                reason: err instanceof Error ? err.message : "Failed",
              }
            : l
        )
      );
    } finally {
      setIsSending(false);
    }
  }, [activityJson, activitySearchId, showSearchIdInput, refreshActivityLog]);

  // Initial load + 5-second polling interval.
  useEffect(() => {
    if (!visitorId) {
      return;
    }
    refreshActivityLog();
    const interval = setInterval(refreshActivityLog, 5000);
    return () => clearInterval(interval);
  }, [visitorId, refreshActivityLog]);

  useEffect(() => {
    if (visitorId) {
      fetchLifetime();
    }
  }, [visitorId, fetchLifetime]);

  if (!visitorId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-secondary p-8">
        <div className="rounded-2xl border border-border-default bg-surface-primary p-8 text-center shadow-lg">
          <h1 className="font-bold text-2xl text-text-default">Visitor Debug Console</h1>
          <p className="mt-4 text-sm text-text-subtle">
            No visitor session found. Browse the site to create a visitor profile.
          </p>
        </div>
      </div>
    );
  }

  const lifetimeDimensions = lifetime?.preferences
    ? Object.entries(lifetime.preferences as Record<string, WeightedMap>).filter(
        ([, w]) => Object.keys(w).length > 0
      )
    : [];

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 border-border-default border-b bg-surface-primary/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-green-500 shadow-green-500/50 shadow-sm" />
            <h1 className="font-bold text-sm text-text-default">Visitor Debug Console</h1>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[10px] text-text-subtle">Visitor:</span>
              <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-[11px] text-text-default">
                {visitorId}
              </code>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[10px] text-text-subtle">Session:</span>
              <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-[11px] text-text-default">
                {currentSessionId ?? "—"}
              </code>
            </div>
          </div>
          <button
            className="ml-auto rounded-lg bg-primary px-3 py-1.5 font-medium text-white text-xs shadow-sm hover:bg-primary/90"
            onClick={fetchLifetime}
            type="button"
          >
            ↻ Refresh Preferences
          </button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        {/* ─── LEFT: Preferences ─── */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border-default bg-surface-primary p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-base text-text-default">🎯 Lifetime Preferences</h2>
              {lifetime && (
                <div className="flex gap-3 text-[11px] text-text-subtle">
                  <span>
                    Sessions:{" "}
                    <strong className="text-text-default">{lifetime.totalSessions ?? 0}</strong>
                  </span>
                  <span>
                    Searches:{" "}
                    <strong className="text-text-default">{lifetime.totalSearches ?? 0}</strong>
                  </span>
                  <span>
                    Views:{" "}
                    <strong className="text-text-default">{lifetime.totalVehicleViews ?? 0}</strong>
                  </span>
                </div>
              )}
            </div>

            {isLoadingLifetime ? (
              <div className="animate-pulse py-8 text-center text-sm text-text-subtle">
                Loading...
              </div>
            ) : (
              <LifetimePreferencesBody
                dimensions={lifetimeDimensions}
                error={lifetimeError}
                isLoading={false}
                lifetime={lifetime}
              />
            )}
          </div>

          {/* Search Preferences */}
          <div className="rounded-2xl border border-border-default bg-surface-primary p-5 shadow-sm">
            <h2 className="mb-3 font-bold text-base text-text-default">🔍 Search Preferences</h2>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-lg border border-border-default bg-surface-secondary px-3 py-2 font-mono text-xs placeholder:text-text-subtle focus:border-primary focus:outline-none"
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter searchId (UUID)"
                type="text"
                value={searchId}
              />
              <button
                className="rounded-lg bg-primary px-4 py-2 font-medium text-white text-xs hover:bg-primary/90 disabled:opacity-50"
                disabled={!searchId.trim() || isLoadingSearch}
                onClick={fetchSearch}
                type="button"
              >
                {isLoadingSearch ? "..." : "Fetch"}
              </button>
            </div>

            {searchError && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-red-700 text-xs">
                {searchError}
              </div>
            )}

            {searchPrefs && <SearchPreferencesResults searchPrefs={searchPrefs} />}
          </div>
        </div>

        {/* ─── RIGHT: Activity Generator ─── */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border-default bg-surface-primary p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-base text-text-default">⚡ Activity Generator</h2>

            {/* Type selector */}
            <div className="mb-4">
              <label
                className="mb-1.5 block font-medium text-text-subtle text-xs"
                htmlFor="event-type-select"
              >
                Event Type
              </label>
              <select
                className="w-full rounded-lg border border-border-default bg-surface-secondary px-3 py-2.5 text-text-default text-xs focus:border-primary focus:outline-none"
                id="event-type-select"
                onChange={(e) => setSelectedType(e.target.value)}
                value={selectedType}
              >
                {Object.entries(EVENT_TYPE_CONFIGS).map(([type, { label }]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search ID (shown for search/filter/sort events) */}
            {showSearchIdInput && (
              <div className="mb-4">
                <label
                  className="mb-1.5 block font-medium text-text-subtle text-xs"
                  htmlFor="activity-search-id"
                >
                  Search ID
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-border-default bg-surface-secondary px-3 py-2 font-mono text-xs placeholder:text-text-subtle focus:border-primary focus:outline-none"
                    id="activity-search-id"
                    onChange={(e) => setActivitySearchId(e.target.value)}
                    placeholder="UUID — leave empty to auto-generate"
                    type="text"
                    value={activitySearchId}
                  />
                  <button
                    className="rounded-lg bg-surface-secondary px-3 py-2 font-medium text-text-default text-xs hover:bg-surface-secondary/80"
                    onClick={() => setActivitySearchId(crypto.randomUUID())}
                    title="Generate new UUID"
                    type="button"
                  >
                    🎲
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-text-subtle">
                  Reuse the same ID across related search events (search → filter → sort) to group
                  them.
                </p>
              </div>
            )}

            {/* Mode toggle: Form / JSON */}
            <div className="mb-4 flex gap-1 rounded-lg bg-surface-secondary p-1">
              <button
                className={`flex-1 rounded-md px-3 py-1.5 font-medium text-xs transition-colors ${
                  editorMode === "form"
                    ? "bg-surface-primary text-text-default shadow-sm"
                    : "text-text-subtle hover:text-text-default"
                }`}
                onClick={() => setEditorMode("form")}
                type="button"
              >
                📝 Form Builder
              </button>
              <button
                className={`flex-1 rounded-md px-3 py-1.5 font-medium text-xs transition-colors ${
                  editorMode === "json"
                    ? "bg-surface-primary text-text-default shadow-sm"
                    : "text-text-subtle hover:text-text-default"
                }`}
                onClick={() => setEditorMode("json")}
                type="button"
              >
                {"{ }"} Raw JSON
              </button>
            </div>

            {/* Form Builder */}
            {editorMode === "form" && (
              <div className="mb-4 space-y-3">
                <DynamicFormFields
                  config={EVENT_TYPE_CONFIGS[selectedType]}
                  formValues={formValues}
                  onChange={setFormValues}
                />
              </div>
            )}

            {/* JSON Editor */}
            {editorMode === "json" && (
              <div className="mb-4">
                <label
                  className="mb-1.5 block font-medium text-text-subtle text-xs"
                  htmlFor="json-editor"
                >
                  Event Payload (editable JSON)
                </label>
                <textarea
                  className="h-72 w-full resize-y rounded-lg border border-border-default bg-surface-secondary p-3 font-mono text-[11px] text-text-default leading-relaxed focus:border-primary focus:outline-none"
                  id="json-editor"
                  onChange={(e) => setActivityJson(e.target.value)}
                  spellCheck={false}
                  value={activityJson}
                />
              </div>
            )}

            {/* Generated payload preview (form mode) */}
            {editorMode === "form" && (
              <details className="mb-4 rounded-lg border border-border-default p-3">
                <summary className="cursor-pointer font-medium text-text-subtle text-xs hover:text-text-default">
                  👀 Preview generated payload
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-surface-secondary p-3 font-mono text-[11px] text-text-default">
                  {activityJson}
                </pre>
              </details>
            )}

            {/* Fire button */}
            <button
              className="w-full rounded-lg bg-gradient-to-r from-primary to-primary/80 py-3 font-semibold text-sm text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
              disabled={isSending}
              onClick={fireActivity}
              type="button"
            >
              {isSending ? "Sending..." : "🚀 Fire Activity"}
            </button>
          </div>

          {/* Activity Log */}
          <ActivityLogPanel
            logEndRef={logEndRef}
            logs={activityLogs}
            onClear={clearActivityLog}
            onRefresh={refreshActivityLog}
          />

          {/* Quick Tips */}
          <div className="rounded-2xl border border-primary/30 border-dashed bg-primary/5 p-4">
            <h3 className="mb-2 font-semibold text-text-default text-xs">💡 Quick Tips</h3>
            <ul className="space-y-1.5 text-[11px] text-text-subtle">
              <li>
                • Fire activities then click <strong>"↻ Refresh Preferences"</strong> to see weight
                changes
              </li>
              <li>
                • Copy a <code className="rounded bg-surface-secondary px-1">searchId</code> from
                the JSON editor → paste in Search Preferences
              </li>
              <li>• Edit the JSON payload to test different vehicle attributes, filters, etc.</li>
              <li>
                • <code className="rounded bg-surface-secondary px-1">visitorId</code> and{" "}
                <code className="rounded bg-surface-secondary px-1">sessionId</code> are injected
                server-side from cookies
              </li>
              <li>• The preference aggregator runs async — weights may take a moment to update</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
