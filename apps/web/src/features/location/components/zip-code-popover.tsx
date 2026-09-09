"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@ucmp/ui";
import { IconArrowRight, IconLocation } from "@ucmp/ui/icons";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LOCATION_QUERY_KEY } from "../data/constants";
import type { LocationActionResult } from "../services/update-location";
import { updateLocationFromCoords, updateZipCode } from "../services/update-location";

export interface ZipCodePopoverContentProps {
  onSuccess?: () => void;
  zipCode: string;
}

/**
 * Content rendered inside the ZIP code entry popover.
 * The Popover wrapper and trigger are owned by LocationPill.
 *
 * On a successful update the cookie has already been rewritten by the Server
 * Action; this component resets the client context optimistically from the
 * action's response (`setQueryData` on the shared ["location"] slice — which
 * also triggers dependent-query invalidation via useLocationRehydration),
 * then `router.refresh()` reconciles every server-rendered consumer.
 */
export function ZipCodePopoverContent({ onSuccess, zipCode }: ZipCodePopoverContentProps) {
  const [zipInput, setZipInput] = useState(zipCode);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isGeoLocating, setIsGeoLocating] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const isValid = zipInput.length === 5;
  const isZipPending = isPending && !isGeoLocating;

  const applyResult = (result: LocationActionResult) => {
    if (!result.success) {
      setError(result.error);
      return;
    }
    queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: result.zip });
    onSuccess?.();
    router.refresh();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isValid) {
      startTransition(async () => {
        applyResult(await updateZipCode(zipInput));
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not available in this browser.");
      return;
    }

    setError("");
    setIsGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          applyResult(
            await updateLocationFromCoords(position.coords.latitude, position.coords.longitude)
          );
          setIsGeoLocating(false);
        });
      },
      () => {
        setIsGeoLocating(false);
        setError("We couldn't access your location. Enter a ZIP code instead.");
      }
    );
  };

  return (
    <>
      <div className="flex flex-start gap-1">
        <IconLocation aria-hidden="true" className="size-4 shrink-0" />
        <p className="body-sm" id="zip-popover-description">
          Enter your ZIP code to see local inventory and pricing.
        </p>
      </div>

      <form
        aria-describedby="zip-popover-description"
        aria-label="ZIP code entry"
        onSubmit={handleSubmit}
      >
        <InputGroup>
          <InputGroupInput
            aria-invalid={Boolean(error)}
            aria-label="ZIP code"
            inputMode="numeric"
            maxLength={5}
            onChange={(e) => {
              setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5));
              setError("");
            }}
            pattern="[0-9]*"
            placeholder="Zip Code"
            value={zipInput}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Submit ZIP code"
              disabled={!isValid || isPending || isGeoLocating}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              size="icon-xs"
              type="submit"
            >
              <IconArrowRight aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      {error && (
        <p aria-live="polite" className="body-sm text-destructive" role="status">
          {error}
        </p>
      )}

      <Button
        className="self-start px-0"
        onClick={() => {
          if (isGeoLocating || isZipPending) {
            return;
          }
          handleUseCurrentLocation();
        }}
        size="sm"
        trailingIcon={IconArrowRight}
        variant="text"
      >
        Use my current location
      </Button>
    </>
  );
}
