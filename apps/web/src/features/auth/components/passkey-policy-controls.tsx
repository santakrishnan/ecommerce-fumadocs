"use client";

import { Button, Checkbox, RadioGroup, RadioGroupItem } from "@ucmp/ui";
import { cn } from "utils";
import {
  DEFAULT_REGISTRATION_POLICY,
  type PasskeyAttachment,
  type PasskeyHint,
  type PasskeyRegistrationPolicy,
  type PasskeyRequirement,
} from "../passkey";

type Policy = Required<PasskeyRegistrationPolicy>;

const ATTACHMENTS: { description: string; label: string; value: PasskeyAttachment }[] = [
  {
    value: "any",
    label: "Any authenticator",
    description: "Device keychain, security keys and other devices all offered.",
  },
  {
    value: "platform",
    label: "This device only",
    description: "Face ID / Touch ID / Windows Hello. Hides security keys and QR.",
  },
  {
    value: "cross-platform",
    label: "Security key or phone only",
    description: "External authenticators only; hides the device keychain.",
  },
];

const HINTS: { label: string; value: PasskeyHint }[] = [
  { value: "client-device", label: "client-device (built-in first)" },
  { value: "security-key", label: "security-key" },
  { value: "hybrid", label: "hybrid (phone via QR)" },
];

const REQUIREMENTS: PasskeyRequirement[] = ["required", "preferred", "discouraged"];

/** Named starting points a relying party typically picks between. */
export const POLICY_PRESETS: { label: string; policy: Policy }[] = [
  { label: "Consumer default", policy: DEFAULT_REGISTRATION_POLICY },
  {
    label: "This device only",
    policy: { ...DEFAULT_REGISTRATION_POLICY, attachment: "platform", hints: ["client-device"] },
  },
  {
    label: "Security key only",
    policy: {
      ...DEFAULT_REGISTRATION_POLICY,
      attachment: "cross-platform",
      hints: ["security-key"],
    },
  },
  {
    label: "Everything, no preference",
    policy: { ...DEFAULT_REGISTRATION_POLICY, attachment: "any", hints: [] },
  },
];

export interface PasskeyPolicyControlsProps {
  className?: string;
  onChange: (policy: Policy) => void;
  policy: Policy;
}

/**
 * Demo controls for the registration policy that drives the browser's
 * "Choose where to save your passkey" sheet. In production these values are
 * fixed on the relying party; here they are sent with `register/options` so
 * the effect of each setting can be seen on a real device.
 */
export function PasskeyPolicyControls({ className, onChange, policy }: PasskeyPolicyControlsProps) {
  const set = <K extends keyof Policy>(key: K, value: Policy[K]) =>
    onChange({ ...policy, [key]: value });

  const toggleHint = (hint: PasskeyHint, on: boolean) => {
    const rest = policy.hints.filter((h) => h !== hint);
    set("hints", on ? [...rest, hint] : rest);
  };

  return (
    <fieldset
      className={cn("flex flex-col gap-5 rounded-lg border border-border p-4 text-left", className)}
      data-slot="passkey-policy-controls"
    >
      <legend className="body-sm px-1 font-medium">Registration policy (RP-controlled)</legend>

      <div className="flex flex-wrap gap-2">
        {POLICY_PRESETS.map((preset) => (
          <Button
            key={preset.label}
            onClick={() => onChange(preset.policy)}
            size="sm"
            type="button"
            variant={isSamePolicy(preset.policy, policy) ? "secondary" : "tertiary"}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="body-sm font-medium">authenticatorAttachment</p>
        <RadioGroup
          onValueChange={(value) => set("attachment", value as PasskeyAttachment)}
          value={policy.attachment}
        >
          {ATTACHMENTS.map((option) => (
            <div className="flex items-start gap-3" key={option.value}>
              <RadioGroupItem
                aria-describedby={`policy-attachment-${option.value}-hint`}
                id={`policy-attachment-${option.value}`}
                value={option.value}
              />
              <span className="flex flex-col">
                <label className="body-sm" htmlFor={`policy-attachment-${option.value}`}>
                  {option.label}
                </label>
                <span
                  className="text-muted-foreground text-xs"
                  id={`policy-attachment-${option.value}-hint`}
                >
                  {option.description}
                </span>
              </span>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex flex-col gap-2">
        <p className="body-sm font-medium">hints (preference order, L3)</p>
        {HINTS.map((hint) => (
          <div className="flex items-center gap-3" key={hint.value}>
            <Checkbox
              checked={policy.hints.includes(hint.value)}
              id={`policy-hint-${hint.value}`}
              onCheckedChange={(checked) => toggleHint(hint.value, checked)}
            />
            <label className="body-sm" htmlFor={`policy-hint-${hint.value}`}>
              {hint.label}
            </label>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <RequirementSelect
          id="policy-resident-key"
          label="residentKey"
          onChange={(v) => set("residentKey", v)}
          value={policy.residentKey}
        />
        <RequirementSelect
          id="policy-user-verification"
          label="userVerification"
          onChange={(v) => set("userVerification", v)}
          value={policy.userVerification}
        />
      </div>
    </fieldset>
  );
}

function RequirementSelect({
  id,
  label,
  onChange,
  value,
}: {
  id: string;
  label: string;
  onChange: (value: PasskeyRequirement) => void;
  value: PasskeyRequirement;
}) {
  return (
    <label className="flex flex-col gap-1" htmlFor={id}>
      <span className="body-sm font-medium">{label}</span>
      <select
        className="h-10 rounded-md border border-border bg-background px-2 text-sm"
        id={id}
        onChange={(e) => onChange(e.target.value as PasskeyRequirement)}
        value={value}
      >
        {REQUIREMENTS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </label>
  );
}

function isSamePolicy(a: Policy, b: Policy): boolean {
  return (
    a.attachment === b.attachment &&
    a.residentKey === b.residentKey &&
    a.userVerification === b.userVerification &&
    a.hints.length === b.hints.length &&
    a.hints.every((h, i) => b.hints[i] === h)
  );
}
