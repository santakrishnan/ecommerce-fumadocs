"use client";

import { OtpStart } from "@shared/components/otp/otp-start";
import { OtpVerify } from "@shared/components/otp/otp-verify";
import { Button, Dialog, DialogClose, DialogContent, DialogTitle, PageGrid } from "@ucmp/ui";
import { IconClose } from "@ucmp/ui/icons";
import Image from "next/image";
import { cn } from "utils";
import type { AuthGateRequest } from "../auth-provider";
import { useOtpFlow } from "../hooks/use-auth";

const DEFAULT_BACKGROUND = "/images/backgrounds/profile-sign-in-bg.jpg";

/** Hold the opaque overlay after verifying so the destination page can paint. */
const REVEAL_DELAY_MS = 600;

export interface AuthOverlayProps {
  backgroundSrc?: string;
  /** Close the overlay (clears the pending request). */
  onClose: () => void;
  onResend?: () => void;
  /** Whether the overlay is open — driven by the provider's pending request. */
  open: boolean;
  /** The pending request, or null when closed. */
  request: AuthGateRequest | null;
  setOpen: (open: boolean) => void;
  startDescription?: string;
  startHint?: string;
  startTitle?: string;
}

/**
 * Full-screen overlay placement of the OTP flow. Base UI's Dialog handles the
 * focus trap, scroll lock, and Escape. `open` is driven by the provider, so it
 * fades in and out, and resets the flow once closed.
 */
export function AuthOverlay({
  backgroundSrc = DEFAULT_BACKGROUND,
  onClose,
  onResend,
  open,
  request,
  setOpen,
}: AuthOverlayProps) {
  const otpFlow = useOtpFlow();

  const handleVerify = () => {
    request?.onVerified?.();
    // Navigate now, hold the opaque overlay a beat so the destination paints,
    // then close (which fades out to reveal it).
    window.setTimeout(() => {
      setOpen(false);
      onClose();
    }, REVEAL_DELAY_MS);
  };

  const content =
    otpFlow.step === "start" ? (
      <OtpStart
        autoFocus
        className="text-text-primary"
        description={request?.description ?? ""}
        hint="Already a member? Sign in below"
        onSubmit={otpFlow.submitChannel}
        surface="dark"
        title={request?.title ?? ""}
      />
    ) : (
      <OtpVerify
        className="animate-[sign-in-content-slide-up_500ms_cubic-bezier(0.16,1,0.3,1)_100ms_both] text-text-primary"
        identifier={otpFlow.identifier}
        onResend={onResend}
        onVerify={handleVerify}
        surface="dark"
      />
    );

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  return (
    <>
      {/* Preload the background so it's cached before the overlay opens. */}
      <Image
        alt=""
        aria-hidden="true"
        className="sr-only"
        fill={false}
        height={1}
        priority
        sizes="1px"
        src={backgroundSrc}
        width={1}
      />
      <Dialog
        onOpenChange={handleOpenChange}
        onOpenChangeComplete={(isOpen: boolean) => {
          if (!isOpen) {
            onClose();
            otpFlow.reset();
          }
        }}
        open={open}
      >
        <DialogContent
          className={cn(
            "z-60 bg-black pb-0 lg:pb-0",
            "opacity-100 transition-opacity duration-400",
            "data-ending-style:opacity-0 data-starting-style:opacity-0"
          )}
          data-surface="dark"
          fullScreen
          innerClassName="relative max-w-none px-0"
          overlayClassName="hidden"
        >
          <DialogTitle className="sr-only">
            {otpFlow.step === "start" ? "Sign in" : "Enter verification code"}
          </DialogTitle>

          {/* Background image + scrim */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-[-91%] left-0 h-[217%] w-full">
                <Image
                  alt=""
                  className="h-full w-full object-cover"
                  fill={false}
                  height={1880}
                  priority
                  sizes="100vw"
                  src={backgroundSrc}
                  style={{ width: "100%", height: "100%" }}
                  width={1440}
                />
              </div>
            </div>
            <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="relative z-10 flex flex-1 flex-col">
            <div className="flex w-full justify-end p-5 lg:px-10 lg:py-8">
              <DialogClose
                render={
                  <Button
                    aria-label="Close"
                    className="bg-white/16"
                    leadingIcon={IconClose}
                    size="icon"
                    surface="dark"
                    variant="secondary"
                  />
                }
              />
            </div>

            <PageGrid className="flex-1" maxWidth="none">
              <div className="col-span-full flex flex-col items-center pt-4 pb-12 md:col-span-4 md:col-start-3 md:pt-8 lg:col-span-4 lg:col-start-5">
                {content}
              </div>
            </PageGrid>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
