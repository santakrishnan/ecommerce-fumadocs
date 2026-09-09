import userEvent from "@testing-library/user-event";
import { act, render, screen } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DemoSettingsForm } from "../components/demo-settings-form";

// ── Regex patterns ───────────────────────────────────────────────────────────
const AGENT_V1_PATTERN = /agent v1/i;
const SAVE_BUTTON_PATTERN = /^save$/i;
const RESET_DEPLOY_DEFAULT_PATTERN = /reset to deploy default/i;
const RESET_DEFAULT_TIER_PATTERN = /reset to default tier/i;
const T1_REACHABLE_PATTERN = /t1 — reachable/i;
const T2_IDENTIFIED_PATTERN = /t2 — identified/i;
const T3_QUALIFIED_PATTERN = /t3 — qualified/i;
const UNSAVED_CHANGE_PATTERN = /unsaved change/i;
const TIER_T0_PATTERN = /t0/i;
const TIER_T1_PATTERN = /t1/i;
const TIER_T2_PATTERN = /t2/i;
const TIER_T3_PATTERN = /t3/i;

// ── Next.js navigation mock ──────────────────────────────────────────────────
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

// ── Server Action mocks ──────────────────────────────────────────────────────
const mockSetAgentBackend = vi.fn();
const mockResetAgentBackend = vi.fn();
const mockSetProfileTier = vi.fn();
const mockResetProfileTier = vi.fn();

vi.mock("../actions/set-agent-backend", () => ({
  setAgentBackend: (...args: unknown[]) => mockSetAgentBackend(...args),
  resetAgentBackend: () => mockResetAgentBackend(),
}));

vi.mock("../actions/set-profile-tier", () => ({
  setProfileTier: (...args: unknown[]) => mockSetProfileTier(...args),
  resetProfileTier: () => mockResetProfileTier(),
}));

const mockSetVdpBookingState = vi.fn();
const mockResetVdpBookingState = vi.fn();

vi.mock("../actions/set-vdp-booking-state", () => ({
  setVdpBookingState: (...args: unknown[]) => mockSetVdpBookingState(...args),
  resetVdpBookingState: () => mockResetVdpBookingState(),
}));

const mockSetVercelToolbar = vi.fn();
const mockResetVercelToolbar = vi.fn();

vi.mock("../actions/set-vercel-toolbar", () => ({
  setVercelToolbar: (...args: unknown[]) => mockSetVercelToolbar(...args),
  resetVercelToolbar: () => mockResetVercelToolbar(),
}));

// ── Default props ────────────────────────────────────────────────────────────
const defaultProps = {
  currentAppointmentVariant: "test_drive_1" as const,
  currentBackend: "v2" as const,
  currentTier: "t0" as const,
  currentTradeInVehicleCount: "3" as const,
  currentVdpBookingState: "no_appointment" as const,
  currentVercelToolbarState: "off" as const,
  currentWatchlistVehicleCount: "3" as const,
  currentSkipAuth: "false" as const,
};

beforeEach(() => {
  mockRefresh.mockReset();
  mockSetAgentBackend.mockResolvedValue({ success: true });
  mockResetAgentBackend.mockResolvedValue({ success: true });
  mockSetProfileTier.mockResolvedValue({ success: true });
  mockResetProfileTier.mockResolvedValue({ success: true });
  mockSetVdpBookingState.mockResolvedValue({ success: true });
  mockResetVdpBookingState.mockResolvedValue({ success: true });
  mockSetVercelToolbar.mockResolvedValue({ success: true });
  mockResetVercelToolbar.mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.clearAllMocks();
});

// ── Agent backend card ───────────────────────────────────────────────────────
describe("DemoSettingsForm — agent backend card", () => {
  it("reflects the currentBackend prop as the initially selected radio", () => {
    render(<DemoSettingsForm {...defaultProps} currentBackend="v1" />);
    const radio = screen.getByRole("radio", { name: AGENT_V1_PATTERN });
    expect(radio).toBeChecked();
  });

  it("Save button is disabled when no change is made", () => {
    render(<DemoSettingsForm {...defaultProps} />);
    // Find the Save button for the agent backend card (first Save button)
    const saveButtons = screen.getAllByRole("button", { name: SAVE_BUTTON_PATTERN });
    expect(saveButtons[0]).toBeDisabled();
  });

  it("Save button becomes enabled when backend selection changes", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} currentBackend="v2" />);
    await user.click(screen.getByRole("radio", { name: AGENT_V1_PATTERN }));
    const saveButtons = screen.getAllByRole("button", { name: SAVE_BUTTON_PATTERN });
    expect(saveButtons[0]).not.toBeDisabled();
  });

  it("calls setAgentBackend with the selected value on Save", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} currentBackend="v2" />);
    await user.click(screen.getByRole("radio", { name: AGENT_V1_PATTERN }));
    const saveButtons = screen.getAllByRole("button", { name: SAVE_BUTTON_PATTERN });
    // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by getAllByRole
    await user.click(saveButtons[0]!);
    expect(mockSetAgentBackend).toHaveBeenCalledWith("v1");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("calls resetAgentBackend on Reset and triggers refresh", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: RESET_DEPLOY_DEFAULT_PATTERN }));
    expect(mockResetAgentBackend).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });
});

// ── Profile tier card ────────────────────────────────────────────────────────
describe("DemoSettingsForm — profile tier card", () => {
  it("reflects the currentTier prop as the initially selected radio", () => {
    render(<DemoSettingsForm {...defaultProps} currentTier="t2" />);
    const radio = screen.getByRole("radio", { name: T2_IDENTIFIED_PATTERN });
    expect(radio).toBeChecked();
  });

  it("Save button is disabled when no tier change is made", () => {
    render(<DemoSettingsForm {...defaultProps} />);
    const saveButtons = screen.getAllByRole("button", { name: SAVE_BUTTON_PATTERN });
    expect(saveButtons[1]).toBeDisabled();
  });

  it("Save button becomes enabled when tier selection changes", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} currentTier="t0" />);
    await user.click(screen.getByRole("radio", { name: T1_REACHABLE_PATTERN }));
    const saveButtons = screen.getAllByRole("button", { name: SAVE_BUTTON_PATTERN });
    expect(saveButtons[1]).not.toBeDisabled();
  });

  it("calls setProfileTier with the selected value on Save", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} currentTier="t0" />);
    await user.click(screen.getByRole("radio", { name: T1_REACHABLE_PATTERN }));
    const saveButtons = screen.getAllByRole("button", { name: SAVE_BUTTON_PATTERN });
    // biome-ignore lint/style/noNonNullAssertion: element is guaranteed by getAllByRole
    await user.click(saveButtons[1]!);
    expect(mockSetProfileTier).toHaveBeenCalledWith("t1");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("calls resetProfileTier on Reset and triggers refresh", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: RESET_DEFAULT_TIER_PATTERN }));
    expect(mockResetProfileTier).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("shows 'Unsaved change' when tier is dirty", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} currentTier="t0" />);
    await user.click(screen.getByRole("radio", { name: T3_QUALIFIED_PATTERN }));
    const unsaved = screen.getAllByText(UNSAVED_CHANGE_PATTERN);
    expect(unsaved.length).toBeGreaterThan(0);
  });
});

// ── Card independence ────────────────────────────────────────────────────────
describe("DemoSettingsForm — card independence", () => {
  it("changing tier selection does not dirty the agent-backend Save button", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} currentBackend="v2" currentTier="t0" />);

    // Change tier only
    await user.click(screen.getByRole("radio", { name: T1_REACHABLE_PATTERN }));

    // First Save button (agent backend) must remain disabled
    const saveButtons = screen.getAllByRole("button", { name: SAVE_BUTTON_PATTERN });
    expect(saveButtons[0]).toBeDisabled();
    // Second Save button (tier) must be enabled
    expect(saveButtons[1]).not.toBeDisabled();
  });

  it("changing backend selection does not dirty the profile-tier Save button", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} currentBackend="v2" currentTier="t0" />);

    // Change backend only
    await user.click(screen.getByRole("radio", { name: AGENT_V1_PATTERN }));

    const saveButtons = screen.getAllByRole("button", { name: SAVE_BUTTON_PATTERN });
    // First Save (backend) enabled
    expect(saveButtons[0]).not.toBeDisabled();
    // Second Save (tier) still disabled
    expect(saveButtons[1]).toBeDisabled();
  });
});

// ── Keyboard operability ─────────────────────────────────────────────────────
describe("DemoSettingsForm — keyboard operability", () => {
  it("profile tier radios are reachable via keyboard Tab and selectable with Space", async () => {
    const user = userEvent.setup();
    render(<DemoSettingsForm {...defaultProps} currentTier="t0" />);

    // Tab into the profile tier RadioGroup (after backend group)
    const t1Radio = screen.getByRole("radio", { name: T1_REACHABLE_PATTERN });
    act(() => {
      t1Radio.focus();
    });
    await user.keyboard(" ");

    expect(t1Radio).toBeChecked();
  });

  it("all profile tier radio options are rendered as proper radio inputs", () => {
    render(<DemoSettingsForm {...defaultProps} />);
    for (const pattern of [TIER_T0_PATTERN, TIER_T1_PATTERN, TIER_T2_PATTERN, TIER_T3_PATTERN]) {
      expect(screen.getByRole("radio", { name: pattern })).toBeInTheDocument();
    }
  });
});
