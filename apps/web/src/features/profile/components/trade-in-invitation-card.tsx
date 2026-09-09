"use client";

import {
  Button,
  Card,
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  Field,
  FieldGroup,
  FloatingInput,
  FloatingLabel,
  FloatingSelectTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@ucmp/ui";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "utils";
import { lookupTradeInVehicleAction } from "../actions/lookup-trade-in-vehicle";
import type { TradeInVehicle } from "../bff/contracts/trade-in-response";
import { TRADE_IN_CAROUSEL_IMAGES, US_STATES } from "./trade-in-constants";
import { TradeInEstimateDialog } from "./trade-in-estimate-dialog";

const PLATE_VIN_LABEL = "License plate or VIN";
const STATE_LABEL = "State";
const DEFAULT_STATE = "NY";
const HEADING_TEXT = "Track your trade-in value";
const SUBHEADING_TEXT =
  "Get an estimate in minutes and track the value over time so you're ready to buy.";

interface TradeInInvitationCardProps {
  /** Optional callback fired after a vehicle is successfully added to profile. */
  onComplete?: () => void;
}

/**
 * Trade-In Invitation Card — "use client" component.
 *
 * Mobile: text (centered) → carousel → form
 * Tablet/Desktop: carousel → text (centered) → form
 *
 * Price badge only appears on the currently centered/active slide.
 */
export function TradeInInvitationCard({ onComplete }: TradeInInvitationCardProps) {
  const [licensePlateOrVin, setLicensePlateOrVin] = useState("");
  const [selectedState, setSelectedState] = useState(DEFAULT_STATE);
  const [api, setApi] = useState<CarouselApi>();
  const [activeIndex, setActiveIndex] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [vehicle, setVehicle] = useState<TradeInVehicle | null>(null);

  useEffect(() => {
    if (!api) {
      return;
    }

    function onSelect() {
      if (api) {
        setActiveIndex(api.selectedScrollSnap());
      }
    }

    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  async function handleContinue() {
    setDialogOpen(true);
    const result = await lookupTradeInVehicleAction(licensePlateOrVin, selectedState);
    if (result.success) {
      setVehicle(result.data);
    }
  }

  return (
    <Card className="flex w-full flex-col gap-6 overflow-hidden pt-8 pb-8 shadow-none ring-0 md:pt-16">
      {/* ─── Mobile only: headline + subtext first (centered) ─── */}
      <div className="px-6 md:hidden">
        <h3 className="h2 text-center text-text-primary">{HEADING_TEXT}</h3>
        <p className="body-md mx-auto mt-2 w-67 text-center text-text-secondary">
          {SUBHEADING_TEXT}
        </p>
      </div>

      {/* Carousel — all breakpoints */}
      <div className="relative">
        <Carousel
          disableArrows
          loop
          opts={{ align: "center", startIndex: 1, dragFree: false }}
          setApi={setApi}
        >
          <CarouselContent className="-ml-10 gap-0">
            {TRADE_IN_CAROUSEL_IMAGES.map((img, index) => (
              <CarouselItem
                className="flex h-24 min-w-0 shrink-0 basis-58 items-center justify-center pl-10 xl:basis-1/4"
                key={img.id}
              >
                <div className="relative aspect-49/20 w-56.75 md:w-full md:max-w-56.75">
                  {/* Price badge — behind the vehicle image */}
                  <div className="absolute top-0 right-0 z-0 overflow-hidden">
                    <span
                      className={cn(
                        "subhead-lg block rounded-md bg-green-50 px-2 pt-1 pb-1.75 text-green-500 transition-transform duration-500 ease-out",
                        activeIndex === index ? "translate-y-0" : "translate-y-full"
                      )}
                    >
                      {img.price}
                    </span>
                  </div>
                  <Image
                    alt={img.alt}
                    className="relative z-10 object-contain"
                    fill
                    sizes="33vw"
                    src={img.src}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* ─── Tablet/Desktop only: headline + subtext after carousel (centered) ─── */}
      <div className="hidden md:block">
        <h3 className="h2 text-center text-text-primary">{HEADING_TEXT}</h3>
        <p className="body-md mx-auto mt-2 w-67 text-center text-text-secondary">
          {SUBHEADING_TEXT}
        </p>
      </div>

      {/* Form content — 448px max width, centered */}
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-6 lg:px-0">
        <FieldGroup orientation="horizontal">
          <Field className="relative flex-1">
            <FloatingInput
              id="trade-in-plate-vin"
              onChange={(e) => setLicensePlateOrVin(e.target.value)}
              placeholder=" "
              value={licensePlateOrVin}
              variant="outlined"
            />
            <FloatingLabel htmlFor="trade-in-plate-vin">{PLATE_VIN_LABEL}</FloatingLabel>
          </Field>

          <Field className="w-25.5 shrink-0">
            <Select
              onValueChange={(value) => setSelectedState(value ?? DEFAULT_STATE)}
              value={selectedState}
            >
              <FloatingSelectTrigger id="trade-in-state" variant="outlined">
                <SelectValue placeholder="State" />
              </FloatingSelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="max-h-60">
                {US_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FloatingLabel htmlFor="trade-in-state">{STATE_LABEL}</FloatingLabel>
          </Field>
        </FieldGroup>

        {/* Continue CTA */}
        <Button
          className="w-full"
          disabled={!licensePlateOrVin.trim()}
          onClick={handleContinue}
          size="lg"
        >
          Continue
        </Button>
      </div>

      <TradeInEstimateDialog
        onClose={() => {
          setDialogOpen(false);
          setVehicle(null);
          setLicensePlateOrVin("");
          setSelectedState(DEFAULT_STATE);
        }}
        onComplete={onComplete}
        open={dialogOpen}
        vehicle={vehicle}
      />
    </Card>
  );
}
