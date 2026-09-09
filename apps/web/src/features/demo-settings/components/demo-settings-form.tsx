"use client";

import { AGENT_BACKEND_OPTIONS, type AgentBackend } from "@config/agent-backend";
import { APPOINTMENT_VARIANT_OPTIONS, type AppointmentVariant } from "@config/appointment-variant";
import { PROFILE_TIER_OPTIONS, type ProfileTier } from "@config/profile-tier";
import type { SkipAuth } from "@config/skip-auth";
import {
  TRADE_IN_VEHICLE_COUNT_OPTIONS,
  type TradeInVehicleCount,
} from "@config/trade-in-vehicle-count";
import { VDP_BOOKING_STATE_OPTIONS, type VdpBookingState } from "@config/vdp-booking-state";
import { VERCEL_TOOLBAR_OPTIONS, type VercelToolbarState } from "@config/vercel-toolbar";
import {
  WATCHLIST_VEHICLE_COUNT_OPTIONS,
  type WatchlistVehicleCount,
} from "@config/watchlist-vehicle-count";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  RadioGroup,
  RadioGroupItem,
} from "@ucmp/ui";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resetAgentBackend, setAgentBackend } from "../actions/set-agent-backend";
import { resetAppointmentVariant, setAppointmentVariant } from "../actions/set-appointment-variant";
import { resetProfileTier, setProfileTier } from "../actions/set-profile-tier";
import { resetSkipAuth, setSkipAuth } from "../actions/set-skip-auth";
import {
  resetTradeInVehicleCount,
  setTradeInVehicleCount,
} from "../actions/set-trade-in-vehicle-count";
import { resetVdpBookingState, setVdpBookingState } from "../actions/set-vdp-booking-state";
import { resetVercelToolbar, setVercelToolbar } from "../actions/set-vercel-toolbar";
import {
  resetWatchlistVehicleCount,
  setWatchlistVehicleCount,
} from "../actions/set-watchlist-vehicle-count";

interface DemoSettingsFormProps {
  /** The appointment variant currently in effect. */
  currentAppointmentVariant: AppointmentVariant;
  /** The backend currently in effect (resolved cookie, else env, else default). */
  currentBackend: AgentBackend;
  /** Whether auth gating is currently skipped (resolved cookie, else default "false"). */
  currentSkipAuth: SkipAuth;
  /** The profile tier currently in effect (resolved cookie, else default t0). */
  currentTier: ProfileTier;
  /** The trade-in vehicle count currently in effect (resolved cookie, else full fixture). */
  currentTradeInVehicleCount: TradeInVehicleCount;
  /** The VDP booking state currently in effect. */
  currentVdpBookingState: VdpBookingState;
  /** The Vercel Toolbar state currently in effect (resolved cookie, else off). */
  currentVercelToolbarState: VercelToolbarState;
  /** The watchlist vehicle count currently in effect (resolved cookie, else full fixture). */
  currentWatchlistVehicleCount: WatchlistVehicleCount;
}
function titleFor<T extends string>(
  options: readonly { value: T; title: string }[],
  value: T
): string {
  return options.find((option) => option.value === value)?.title ?? value;
}

/**
 * Client picker for demo settings. Contains two independent cards:
 * 1. Search agent backend — writes `demo-agent-backend` cookie.
 * 2. Profile tier — writes `demo-profile-tier` cookie.
 *
 * Each card has its own state, dirty tracking, Save/Reset, and status row.
 * After a save or reset, `router.refresh()` re-triggers the server and the
 * parent remounts this component (keyed on both values) with fresh state.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: demo-only form that aggregates several independent, self-similar setting cards; splitting each into its own file adds indirection without real benefit.
export function DemoSettingsForm({
  currentAppointmentVariant,
  currentBackend,
  currentSkipAuth,
  currentVdpBookingState,
  currentTier,
  currentTradeInVehicleCount,
  currentVercelToolbarState,
  currentWatchlistVehicleCount,
}: DemoSettingsFormProps) {
  const router = useRouter();

  function runWithRefresh(
    startTransition: (callback: () => void) => void,
    action: () => Promise<{ success: boolean }>
  ) {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        router.refresh();
      }
    });
  }

  // ── Agent backend card state ─────────────────────────────────────────────
  const [selectedBackend, setSelectedBackend] = useState<AgentBackend>(currentBackend);
  const [isBackendPending, startBackendTransition] = useTransition();
  const isBackendDirty = selectedBackend !== currentBackend;

  function handleBackendSave() {
    runWithRefresh(startBackendTransition, () => setAgentBackend(selectedBackend));
  }

  function handleBackendReset() {
    runWithRefresh(startBackendTransition, resetAgentBackend);
  }

  // ── Profile tier card state ──────────────────────────────────────────────
  const [selectedTier, setSelectedTier] = useState<ProfileTier>(currentTier);
  const [isTierPending, startTierTransition] = useTransition();
  const isTierDirty = selectedTier !== currentTier;

  function handleTierSave() {
    runWithRefresh(startTierTransition, () => setProfileTier(selectedTier));
  }

  function handleTierReset() {
    runWithRefresh(startTierTransition, resetProfileTier);
  }

  // ── Skip auth card state ─────────────────────────────────────────────────
  const [selectedSkipAuth, setSelectedSkipAuth] = useState<SkipAuth>(currentSkipAuth);
  const [isSkipAuthPending, startSkipAuthTransition] = useTransition();
  const isSkipAuthDirty = selectedSkipAuth !== currentSkipAuth;

  function handleSkipAuthSave() {
    runWithRefresh(startSkipAuthTransition, () => setSkipAuth(selectedSkipAuth));
  }

  function handleSkipAuthReset() {
    runWithRefresh(startSkipAuthTransition, resetSkipAuth);
  }

  // ── Appointment variant card state ───────────────────────────────────────
  const [selectedVariant, setSelectedVariant] =
    useState<AppointmentVariant>(currentAppointmentVariant);
  const [isVariantPending, startVariantTransition] = useTransition();
  const isVariantDirty = selectedVariant !== currentAppointmentVariant;
  const isTierIneligibleForAppointments = selectedTier !== "t2" && selectedTier !== "t3";

  function handleVariantSave() {
    runWithRefresh(startVariantTransition, () => setAppointmentVariant(selectedVariant));
  }

  function handleVariantReset() {
    runWithRefresh(startVariantTransition, resetAppointmentVariant);
  }

  // ── Trade-in vehicle count card state ────────────────────────────────────
  const [selectedVehicleCount, setSelectedVehicleCount] = useState<TradeInVehicleCount>(
    currentTradeInVehicleCount
  );
  const [isVehicleCountPending, startVehicleCountTransition] = useTransition();
  const isVehicleCountDirty = selectedVehicleCount !== currentTradeInVehicleCount;

  function handleVehicleCountSave() {
    runWithRefresh(startVehicleCountTransition, () => setTradeInVehicleCount(selectedVehicleCount));
  }

  function handleVehicleCountReset() {
    runWithRefresh(startVehicleCountTransition, resetTradeInVehicleCount);
  }

  // ── Vercel Toolbar card state ────────────────────────────────────────────
  const [selectedVercelToolbarState, setSelectedVercelToolbarState] =
    useState<VercelToolbarState>(currentVercelToolbarState);
  const [isVercelToolbarPending, startVercelToolbarTransition] = useTransition();
  const isVercelToolbarDirty = selectedVercelToolbarState !== currentVercelToolbarState;

  function handleVercelToolbarSave() {
    runWithRefresh(startVercelToolbarTransition, () =>
      setVercelToolbar(selectedVercelToolbarState)
    );
  }

  function handleVercelToolbarReset() {
    runWithRefresh(startVercelToolbarTransition, resetVercelToolbar);
  }

  // ── Watchlist vehicle count card state ───────────────────────────────────
  const [selectedWatchlistCount, setSelectedWatchlistCount] = useState<WatchlistVehicleCount>(
    currentWatchlistVehicleCount
  );
  const [isWatchlistCountPending, startWatchlistCountTransition] = useTransition();
  const isWatchlistCountDirty = selectedWatchlistCount !== currentWatchlistVehicleCount;

  function handleWatchlistCountSave() {
    runWithRefresh(startWatchlistCountTransition, () =>
      setWatchlistVehicleCount(selectedWatchlistCount)
    );
  }

  function handleWatchlistCountReset() {
    runWithRefresh(startWatchlistCountTransition, resetWatchlistVehicleCount);
  }

  // ── VDP booking state card state ─────────────────────────────────────────
  const [selectedBookingState, setSelectedBookingState] =
    useState<VdpBookingState>(currentVdpBookingState);
  const [isBookingStatePending, startBookingStateTransition] = useTransition();
  const isBookingStateDirty = selectedBookingState !== currentVdpBookingState;

  function handleBookingStateSave() {
    startBookingStateTransition(async () => {
      const result = await setVdpBookingState(selectedBookingState);
      if (result.success) {
        router.refresh();
      }
    });
  }

  function handleBookingStateReset() {
    startBookingStateTransition(async () => {
      const result = await resetVdpBookingState();
      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <>
      {/* ── Search agent backend card ─────────────────────────────────── */}
      <Card id="section-search-agent-backend">
        <CardHeader className="pt-5">
          <CardTitle>Search agent backend</CardTitle>
          <CardDescription>
            Choose which backend serves the conversational search agent. Applies on your next search
            — no redeploy needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <RadioGroup
            onValueChange={(value) => setSelectedBackend(value as AgentBackend)}
            value={selectedBackend}
          >
            {AGENT_BACKEND_OPTIONS.map((option) => {
              const id = `agent-backend-${option.value}`;
              return (
                <FieldLabel className="!p-0" htmlFor={id} key={option.value}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{option.title}</FieldTitle>
                      <FieldDescription>{option.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem id={id} value={option.value} />
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              disabled={!isBackendDirty || isBackendPending}
              onClick={handleBackendSave}
              type="button"
            >
              {isBackendPending ? "Saving…" : "Save"}
            </Button>
            <Button
              disabled={isBackendPending}
              onClick={handleBackendReset}
              type="button"
              variant="tertiary"
            >
              Reset to deploy default
            </Button>
            {isBackendDirty && (
              <span className="font-medium text-brand text-sm">Unsaved change</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Profile tier card ─────────────────────────────────────────── */}
      <Card id="section-profile-tier">
        <CardHeader className="pt-5">
          <CardTitle>Profile: tier</CardTitle>
          <CardDescription>
            Preview the profile page as a specific identity tier. Demo-only — does not affect any
            backend data or real authentication state.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <RadioGroup
            onValueChange={(value) => setSelectedTier(value as ProfileTier)}
            value={selectedTier}
          >
            {PROFILE_TIER_OPTIONS.map((option) => {
              const id = `profile-tier-${option.value}`;
              return (
                <FieldLabel className="!p-0" htmlFor={id} key={option.value}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{option.title}</FieldTitle>
                      <FieldDescription>{option.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem id={id} value={option.value} />
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>

          <div className="flex flex-wrap items-center gap-4">
            <Button disabled={!isTierDirty || isTierPending} onClick={handleTierSave} type="button">
              {isTierPending ? "Saving…" : "Save"}
            </Button>
            <Button
              disabled={isTierPending}
              onClick={handleTierReset}
              type="button"
              variant="tertiary"
            >
              Reset to default tier
            </Button>
            {isTierDirty && <span className="font-medium text-brand text-sm">Unsaved change</span>}
          </div>
        </CardContent>
      </Card>

      {/* ── Skip auth card ────────────────────────────────────────── */}
      <Card id="section-skip-auth">
        <CardHeader className="pt-5">
          <CardTitle>Profile: skip auth</CardTitle>
          <CardDescription>
            Toggle the sign-in overlay that appears when tapping the profile icon. When disabled,
            the profile link navigates directly (same as develop behavior).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <RadioGroup
            onValueChange={(value) => setSelectedSkipAuth(value as SkipAuth)}
            value={selectedSkipAuth}
          >
            <FieldLabel htmlFor="skip-auth-false">
              <Field className="!p-0" orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Disabled</FieldTitle>
                  <FieldDescription>Profile link triggers the sign-in overlay.</FieldDescription>
                </FieldContent>
                <RadioGroupItem id="skip-auth-false" value="false" />
              </Field>
            </FieldLabel>
            <FieldLabel htmlFor="skip-auth-true">
              <Field className="!p-0" orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Enabled (skip)</FieldTitle>
                  <FieldDescription>
                    Profile link navigates directly — same as develop.
                  </FieldDescription>
                </FieldContent>
                <RadioGroupItem id="skip-auth-true" value="true" />
              </Field>
            </FieldLabel>
          </RadioGroup>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              disabled={!isSkipAuthDirty || isSkipAuthPending}
              onClick={handleSkipAuthSave}
              type="button"
            >
              {isSkipAuthPending ? "Saving…" : "Save"}
            </Button>
            <Button
              disabled={isSkipAuthPending}
              onClick={handleSkipAuthReset}
              type="button"
              variant="tertiary"
            >
              Reset to default
            </Button>
            {isSkipAuthDirty && (
              <span className="font-medium text-brand text-sm">Unsaved change</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Appointment variant card ──────────────────────────────────── */}
      <Card id="section-appointment-card-variant">
        <CardHeader className="pt-5">
          <CardTitle>Profile: appointment card variant</CardTitle>
          <CardDescription>
            Choose which appointment card variant to display on the profile page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {isTierIneligibleForAppointments && (
            <p className="text-sm text-text-warning">
              The active profile tier ({titleFor(PROFILE_TIER_OPTIONS, currentTier)}) does not
              display appointments. Switch to T2 or T3 for this setting to take effect.
            </p>
          )}
          <RadioGroup
            disabled={isTierIneligibleForAppointments}
            onValueChange={(value) => setSelectedVariant(value as AppointmentVariant)}
            value={selectedVariant}
          >
            {APPOINTMENT_VARIANT_OPTIONS.map((option) => {
              const id = `appointment-variant-${option.value}`;
              return (
                <FieldLabel className="!p-0" htmlFor={id} key={option.value}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{option.title}</FieldTitle>
                      <FieldDescription>{option.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem id={id} value={option.value} />
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              disabled={isTierIneligibleForAppointments || !isVariantDirty || isVariantPending}
              onClick={handleVariantSave}
              type="button"
            >
              {isVariantPending ? "Saving…" : "Save"}
            </Button>
            <Button
              disabled={isTierIneligibleForAppointments || isVariantPending}
              onClick={handleVariantReset}
              type="button"
              variant="tertiary"
            >
              Reset to default
            </Button>
            {isVariantDirty && (
              <span className="font-medium text-brand text-sm">Unsaved change</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Trade-in vehicle count card ───────────────────────────────── */}
      <Card id="section-trade-in-vehicle-count">
        <CardHeader className="pt-5">
          <CardTitle>Profile: trade-in vehicle count</CardTitle>
          <CardDescription>
            Control how many saved trade-in vehicles the mock returns. Requires{" "}
            <code className="rounded bg-surface-secondary px-1 py-px font-mono text-xs">
              USE_TRADE_IN_MOCKS=true
            </code>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <RadioGroup
            onValueChange={(value) => setSelectedVehicleCount(value as TradeInVehicleCount)}
            value={selectedVehicleCount}
          >
            {TRADE_IN_VEHICLE_COUNT_OPTIONS.map((option) => {
              const id = `trade-in-vehicle-count-${option.value}`;
              return (
                <FieldLabel className="!p-0" htmlFor={id} key={option.value}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{option.title}</FieldTitle>
                      <FieldDescription>{option.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem id={id} value={option.value} />
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              disabled={!isVehicleCountDirty || isVehicleCountPending}
              onClick={handleVehicleCountSave}
              type="button"
            >
              {isVehicleCountPending ? "Saving…" : "Save"}
            </Button>
            <Button
              disabled={isVehicleCountPending}
              onClick={handleVehicleCountReset}
              type="button"
              variant="tertiary"
            >
              Reset to default
            </Button>
            {isVehicleCountDirty && (
              <span className="font-medium text-brand text-sm">Unsaved change</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Vercel Toolbar card ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pt-5">
          <CardTitle>Vercel Toolbar</CardTitle>
          <CardDescription>
            Injects the Vercel Toolbar (feedback, flags, Web Vitals) for this browser only. Gated on
            the <code>demo-vercel-toolbar</code> cookie instead of <code>NODE_ENV</code> so it can
            be enabled on a deployed spike without shipping it to every visitor.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <RadioGroup
            onValueChange={(value) => setSelectedVercelToolbarState(value as VercelToolbarState)}
            value={selectedVercelToolbarState}
          >
            {VERCEL_TOOLBAR_OPTIONS.map((option) => {
              const id = `vercel-toolbar-${option.value}`;
              return (
                <FieldLabel htmlFor={id} key={option.value}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{option.title}</FieldTitle>
                      <FieldDescription>{option.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem id={id} value={option.value} />
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              disabled={!isVercelToolbarDirty || isVercelToolbarPending}
              onClick={handleVercelToolbarSave}
              type="button"
            >
              {isVercelToolbarPending ? "Saving…" : "Save"}
            </Button>
            <Button
              disabled={isVercelToolbarPending}
              onClick={handleVercelToolbarReset}
              type="button"
              variant="tertiary"
            >
              Reset to default
            </Button>
            <span className="text-sm text-text-secondary">
              {isVercelToolbarDirty
                ? "Unsaved change"
                : `Active: ${titleFor(VERCEL_TOOLBAR_OPTIONS, currentVercelToolbarState)}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ── Watchlist vehicle count card ──────────────────────────────── */}
      <Card id="section-watchlist-vehicle-count">
        <CardHeader className="pt-5">
          <CardTitle>Profile: watchlist vehicle count</CardTitle>
          <CardDescription>
            Control how many saved watchlist vehicles the mock returns. Drives the Compare CTA
            (hidden below 3) and the compare page column count. Requires{" "}
            <code className="rounded bg-surface-secondary px-1 py-px font-mono text-xs">
              NEXT_PUBLIC_MOCKS=true
            </code>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <RadioGroup
            onValueChange={(value) => setSelectedWatchlistCount(value as WatchlistVehicleCount)}
            value={selectedWatchlistCount}
          >
            {WATCHLIST_VEHICLE_COUNT_OPTIONS.map((option) => {
              const id = `watchlist-vehicle-count-${option.value}`;
              return (
                <FieldLabel className="!p-0" htmlFor={id} key={option.value}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{option.title}</FieldTitle>
                      <FieldDescription>{option.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem id={id} value={option.value} />
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              disabled={!isWatchlistCountDirty || isWatchlistCountPending}
              onClick={handleWatchlistCountSave}
              type="button"
            >
              {isWatchlistCountPending ? "Saving…" : "Save"}
            </Button>
            <Button
              disabled={isWatchlistCountPending}
              onClick={handleWatchlistCountReset}
              type="button"
              variant="tertiary"
            >
              Reset to default
            </Button>
            {isWatchlistCountDirty && (
              <span className="font-medium text-brand text-sm">Unsaved change</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── VDP booking state card ────────────────────────────────────── */}
      <Card id="section-vdp-booking-state">
        <CardHeader className="pt-5">
          <CardTitle>VDP: test drive booking state</CardTitle>
          <CardDescription>
            <strong>Default</strong> makes each VDP reflect the visitor&rsquo;s real bookings —
            scheduling stores the appointment and the card behaves accordingly. The other options
            force a specific state on any VDP for preview, ignoring real bookings. Reset clears all
            booked appointments (a mock &ldquo;cancel&rdquo;) and returns to Default.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <RadioGroup
            onValueChange={(value) => setSelectedBookingState(value as VdpBookingState)}
            value={selectedBookingState}
          >
            {VDP_BOOKING_STATE_OPTIONS.map((option) => {
              const id = `vdp-booking-state-${option.value}`;
              return (
                <FieldLabel htmlFor={id} key={option.value}>
                  <Field className="!p-0" orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{option.title}</FieldTitle>
                      <FieldDescription>{option.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem id={id} value={option.value} />
                  </Field>
                </FieldLabel>
              );
            })}
          </RadioGroup>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              disabled={!isBookingStateDirty || isBookingStatePending}
              onClick={handleBookingStateSave}
              type="button"
            >
              {isBookingStatePending ? "Saving…" : "Save"}
            </Button>
            <Button
              disabled={isBookingStatePending}
              onClick={handleBookingStateReset}
              type="button"
              variant="tertiary"
            >
              Reset &amp; clear appointment
            </Button>
            {isBookingStateDirty && (
              <span className="font-medium text-brand text-sm">Unsaved change</span>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
