import { coerceAgentBackend } from "@config/agent-backend";
import { DEFAULT_SKIP_AUTH, SKIP_AUTH_COOKIE, skipAuthSchema } from "@config/skip-auth";
import {
  deriveTradeInVehicleCountFromTotal,
  resolveTradeInVehicleCount,
  TRADE_IN_VEHICLE_COUNT_COOKIE,
} from "@config/trade-in-vehicle-count";
import {
  DEFAULT_VDP_BOOKING_STATE,
  VDP_BOOKING_STATE_COOKIE,
  vdpBookingStateSchema,
} from "@config/vdp-booking-state";
import { coerceVercelToolbarState, VERCEL_TOOLBAR_COOKIE } from "@config/vercel-toolbar";
import {
  DEFAULT_WATCHLIST_VEHICLE_COUNT,
  WATCHLIST_VEHICLE_COUNT_COOKIE,
  watchlistVehicleCountSchema,
} from "@config/watchlist-vehicle-count";
import { getAppointmentVariant, getProfileTier } from "@features/profile/bff";
import {
  parseAddedVehicles,
  TRADE_IN_VEHICLE_DATA_COOKIE,
} from "@features/profile/lib/trade-in-cookies";
import { resolveAgentBackend } from "@features/search/bff";
import { cookies } from "next/headers";
import { DemoSettingsForm } from "./demo-settings-form";

/**
 * Derive the checked trade-in vehicle count option from the same fixture
 * baseline plus manually added collection the profile page renders, so the
 * demo-settings selection never disagrees with the profile total.
 */
async function getTradeInVehicleCount() {
  const cookieStore = await cookies();
  const baselineRaw = cookieStore.get(TRADE_IN_VEHICLE_COUNT_COOKIE)?.value;
  const dataRaw = cookieStore.get(TRADE_IN_VEHICLE_DATA_COOKIE)?.value;

  const baseline = Number(resolveTradeInVehicleCount(baselineRaw));
  const addedVehicles = parseAddedVehicles(dataRaw);

  return deriveTradeInVehicleCountFromTotal(baseline + addedVehicles.length);
}

async function getVercelToolbarState() {
  const cookieStore = await cookies();
  return coerceVercelToolbarState(cookieStore.get(VERCEL_TOOLBAR_COOKIE)?.value);
}

async function getWatchlistVehicleCount() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WATCHLIST_VEHICLE_COUNT_COOKIE)?.value;
  const parsed = watchlistVehicleCountSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_WATCHLIST_VEHICLE_COUNT;
}

async function getSkipAuth() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SKIP_AUTH_COOKIE)?.value;
  const parsed = skipAuthSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_SKIP_AUTH;
}

async function getVdpBookingStateValue() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(VDP_BOOKING_STATE_COOKIE)?.value;
  const parsed = vdpBookingStateSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_VDP_BOOKING_STATE;
}

/**
 * Async server leaf for `/demo-settings`. Reads the effective agent backend,
 * profile tier, appointment variant, trade-in vehicle count, and Vercel
 * Toolbar state (all from cookies → defaults) and seeds the client picker.
 */
export async function DemoSettingsLoader() {
  const [
    currentBackend,
    currentTier,
    currentAppointmentVariant,
    currentTradeInVehicleCount,
    currentVercelToolbarState,
    currentWatchlistVehicleCount,
    currentSkipAuth,
    currentVdpBookingState,
  ] = await Promise.all([
    resolveAgentBackend().then(coerceAgentBackend),
    getProfileTier(),
    getAppointmentVariant(),
    getTradeInVehicleCount(),
    getVercelToolbarState(),
    getWatchlistVehicleCount(),
    getSkipAuth(),
    getVdpBookingStateValue(),
  ]);
  return (
    <DemoSettingsForm
      currentAppointmentVariant={currentAppointmentVariant}
      currentBackend={currentBackend}
      currentSkipAuth={currentSkipAuth}
      currentTier={currentTier}
      currentTradeInVehicleCount={currentTradeInVehicleCount}
      currentVdpBookingState={currentVdpBookingState}
      currentVercelToolbarState={currentVercelToolbarState}
      currentWatchlistVehicleCount={currentWatchlistVehicleCount}
      key={`${currentBackend}:${currentTier}:${currentAppointmentVariant}:${currentTradeInVehicleCount}:${currentVercelToolbarState}:${currentWatchlistVehicleCount}:${currentSkipAuth}:${currentVdpBookingState}`}
    />
  );
}
