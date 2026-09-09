/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { VerificationStep } from "../verification-step";

const CONTINUE_RE = /continue/i;
const RESEND_RE = /resend/i;
const MASKED_CONTACT_RE = /\(\*\*\*\) \*\*\*-1234/;

describe("VerificationStep", () => {
  it("renders the heading and masked contact", () => {
    render(<VerificationStep contactDisplay="(***) ***-1234" onVerify={vi.fn()} />);
    expect(screen.getByText("Enter verification code")).toBeInTheDocument();
    expect(screen.getByText(MASKED_CONTACT_RE)).toBeInTheDocument();
  });

  it("keeps Continue disabled until the code is complete", () => {
    render(<VerificationStep contactDisplay="x" onVerify={vi.fn()} />);
    expect(screen.getByRole("button", { name: CONTINUE_RE })).toBeDisabled();
  });

  it("disables Continue while submitting", () => {
    render(<VerificationStep contactDisplay="x" isSubmitting onVerify={vi.fn()} />);
    expect(screen.getByRole("button", { name: CONTINUE_RE })).toBeDisabled();
  });

  it("renders a Resend control", () => {
    render(<VerificationStep contactDisplay="x" onVerify={vi.fn()} />);
    expect(screen.getByRole("button", { name: RESEND_RE })).toBeInTheDocument();
  });
});
