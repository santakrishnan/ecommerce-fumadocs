import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthOverlayProps } from "../components/auth-overlay";
import { AuthOverlay } from "../components/auth-overlay";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, fill, ...rest } = props;
    // biome-ignore lint/a11y/useAltText: test mock
    // biome-ignore lint/correctness/useImageSize: test mock - dimensions come from spread
    // biome-ignore lint/performance/noImgElement: test mock for next/image
    return <img data-fill={fill} data-priority={priority} {...rest} />;
  },
}));

// The start mock exposes a button that submits a phone channel, so tests can
// drive the overlay from start to verify the same way a user would.
vi.mock("@shared/components/otp/otp-start", () => ({
  OtpStart: (props: Record<string, unknown>) => (
    <div data-description={props.description} data-testid="otp-start" data-title={props.title}>
      <button
        onClick={() =>
          (props.onSubmit as (p: { type: string; value: string }) => void)({
            type: "phone",
            value: "5551231234",
          })
        }
        type="button"
      >
        submit-start
      </button>
    </div>
  ),
}));

vi.mock("@shared/components/otp/otp-verify", () => ({
  OtpVerify: (props: Record<string, unknown>) => (
    <div data-identifier={props.identifier} data-testid="otp-verify" />
  ),
}));

const DEFAULT_REQUEST = { title: "Sign in", description: "Verify your identity." };

function createProps(overrides: Partial<AuthOverlayProps> = {}): AuthOverlayProps {
  return {
    onClose: vi.fn(),
    setOpen: vi.fn(),
    open: true,
    request: DEFAULT_REQUEST,
    ...overrides,
  };
}

async function advanceToVerify() {
  await userEvent.click(screen.getByText("submit-start"));
}

describe("AuthOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens as a dialog on the start step with the request's title/description", () => {
    render(
      <AuthOverlay
        {...createProps({ request: { title: "Custom Title", description: "Custom Desc" } })}
      />
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    const startEl = screen.getByTestId("otp-start");
    expect(startEl).toHaveAttribute("data-title", "Custom Title");
    expect(startEl).toHaveAttribute("data-description", "Custom Desc");
    expect(screen.queryByTestId("otp-verify")).not.toBeInTheDocument();
  });

  it("advances to the verify step and masks the submitted phone as the identifier", async () => {
    render(<AuthOverlay {...createProps()} />);
    await advanceToVerify();
    expect(screen.queryByTestId("otp-start")).not.toBeInTheDocument();
    expect(screen.getByTestId("otp-verify")).toHaveAttribute("data-identifier", "(***) ***-1234");
  });

  it("uses a custom background image when provided", () => {
    render(<AuthOverlay {...createProps({ backgroundSrc: "/custom-bg.jpg" })} />);
    expect(document.querySelector("img")).toHaveAttribute("src", "/custom-bg.jpg");
  });
});
