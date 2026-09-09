"use client";

import { Button, Separator } from "@ucmp/ui";
import { IconArrowRight, IconCheckmark } from "@ucmp/ui/icons";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "utils";

const DEFAULT_VISIBLE_FEATURES_COUNT = 11;

export interface VdpFeaturesProps {
  carfaxLogoAlt?: string;
  carfaxLogoSrc?: string;
  carfaxReportUrl: string;
  carfaxStatus: string;
  className?: string;
  keyFeatures: string[];
  maxVisibleFeatures?: number;
  onViewAllFeatures?: () => void;
  /** Optional action element to replace the default "View all features" button */
  viewAllFeaturesAction?: ReactNode;
  warrantyValue: string;
}

function StatusRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="body-lg lg:body-xl flex items-center gap-1 text-text-primary">
      <IconCheckmark aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <span className="wrap-break-word min-w-0 font-normal">{children}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="subhead-sm lg:subhead-lg text-text-primary">{children}</h3>;
}

export function VdpFeatures({
  carfaxLogoAlt = "CARFAX",
  carfaxLogoSrc = "/images/vdp/showme_carfax.svg",
  carfaxReportUrl,
  carfaxStatus,
  className,
  keyFeatures,
  maxVisibleFeatures = DEFAULT_VISIBLE_FEATURES_COUNT,
  onViewAllFeatures,
  viewAllFeaturesAction,
  warrantyValue,
}: VdpFeaturesProps) {
  const visibleFeatures = keyFeatures.slice(0, maxVisibleFeatures);

  return (
    <div
      className={cn(
        "col-span-full flex flex-col pt-8 text-text-primary",
        "lg:grid lg:grid-cols-subgrid",
        className
      )}
      data-surface="dark"
    >
      <section className="flex flex-col gap-4 lg:col-span-full lg:grid lg:grid-cols-subgrid">
        <Image
          alt={carfaxLogoAlt}
          className="h-12 w-auto self-start lg:col-start-1"
          height={48}
          src={carfaxLogoSrc}
          width={106}
        />

        <div className="flex flex-col gap-2 lg:col-span-6 lg:col-start-3">
          <StatusRow>{carfaxStatus}</StatusRow>
          <Button
            className="h-auto self-start pl-6"
            nativeButton={false}
            render={<Link href={carfaxReportUrl} rel="noopener noreferrer" />}
            size="sm"
            trailingIcon={IconArrowRight}
            variant="text"
          >
            View report
          </Button>
        </div>
      </section>

      <Separator className="my-8 bg-divider lg:col-span-full" />

      <section className="flex flex-col gap-4 lg:col-span-full lg:grid lg:grid-cols-subgrid">
        <SectionLabel>Warranty</SectionLabel>
        <div className="lg:col-span-6 lg:col-start-3">
          <StatusRow>{warrantyValue}</StatusRow>
        </div>
      </section>

      {keyFeatures.length > 0 && (
        <>
          <Separator className="my-8 bg-divider lg:col-span-full" />

          <section className="flex flex-col gap-4 lg:col-span-full lg:grid lg:grid-cols-subgrid">
            <SectionLabel>Key Features</SectionLabel>

            <div className="flex flex-col gap-4 lg:col-span-6 lg:col-start-3">
              {visibleFeatures.map((feature) => (
                <StatusRow key={feature}>{feature}</StatusRow>
              ))}

              {viewAllFeaturesAction ?? (
                <Button
                  className="h-auto self-start pl-6"
                  onClick={onViewAllFeatures}
                  size="sm"
                  trailingIcon={IconArrowRight}
                  variant="text"
                >
                  View all features
                </Button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
