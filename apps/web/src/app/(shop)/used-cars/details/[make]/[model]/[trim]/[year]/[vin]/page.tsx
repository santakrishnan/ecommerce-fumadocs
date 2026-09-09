import type {
  VdpCertificationTier,
  VdpMarketingContent,
  VdpVehicleData,
  VdpVehicleImages,
  VehicleColorData,
  VehicleImage,
  VehicleInfoExtended,
  VehicleSummary,
} from "@features/vehicle-detail";
import {
  AskQuestionCard,
  BuyWithConfidence,
  buildGalleryImages,
  buildGalleryImagesFromManifest,
  CertificationBadgeCard,
  ContinueShoppingVdpClient,
  DetailCardPair,
  DetailImageCard,
  FALLBACK_HERO_IMAGE,
  formatWarrantyValue,
  GalleryOverlay,
  getVehicleStatus,
  HeroBackground,
  LlmIntroduction,
  mapVehicleFeaturesToCategories,
  mapVehicleFeaturesToKeyList,
  mapVehicleInfoToColorData,
  mapVehicleInfoToSpecs,
  mapVehicleInfoToSpecsCategories,
  mapVehiclePackagesToModal,
  PRICE_COMPARISON_DEFAULT,
  PriceComparison,
  PurchaseCardRail,
  PurchaseCardRailSkeleton,
  RecordVehicleViewClient,
  SimilarVehicles,
  SimilarVehiclesSkeleton,
  StatusCard,
  StatusHeroCard,
  toSoldCardFromApi,
  UnavailableVehicleLayout,
  UnblockRecentReturn,
  VDP_COOKIE_CERTIFICATION,
  VDP_COOKIE_NO_PHOTOS,
  VdpFeatures,
  VehicleDetailLayout,
  VehicleSpecsCard,
  ViewAllFeaturesModal,
  ViewAllSpecsModal,
} from "@features/vehicle-detail";
import type { VehicleDetailData } from "@features/vehicle-detail/__fixtures__";
import {
  ASK_QUESTION_SUGGESTIONS_SUV,
  SEARCH_ALIASES_FIXTURE,
  VDP_FIXTURE_GOLD,
  VDP_FIXTURE_NO_PHOTOS,
  VDP_FIXTURE_SILVER,
  VDP_FIXTURE_UNCERTIFIED,
} from "@features/vehicle-detail/__fixtures__";
import { VDP_RESPONSE_DEFAULT_FIXTURE } from "@features/vehicle-detail/bff";
import { fetchCarCutterManifest } from "@features/vehicle-detail/lib/car-cutter";
import { VIEW_TRANSITION_NAME_HERO } from "@shared/components/shared-hero-transition";
import { normalizeImageUrl, sortMediaByFilenamePrefix } from "@shared/lib/media";
import { resolveDisplayPrice } from "@shared/lib/pricing";
import { Button } from "@ucmp/ui";
import { IconArrowRight, IconToyotaX } from "@ucmp/ui/icons";
import { hasNext360 } from "@ucmp/vehicle-360";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SignalHeroReady } from "./signal-hero-ready";
import { VdpPageSkeleton } from "./vdp-page-skeleton";

/**
 * Vehicle Detail Page (VDP)
 *
 * Route: /used-cars/details/[make]/[model]/[trim]/[year]/[vin]
 *
 * When the BFF returns a "sold" status for the VIN, the
 * sold state renders instead of the standard VDP layout. The page still
 * returns a 200 status — the vehicle existed, it's just sold.
 *
 * Reads feature flags from cookies (set via /used-cars/dev-flags).
 * Resolves fixture data based on active flag state.
 */
type PageParams = Promise<{
  make: string;
  model: string;
  trim: string;
  vin: string;
  year: string;
}>;

const slugToTitle = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { year, make, model } = await params;
  return {
    title: `${year} ${slugToTitle(make)} ${slugToTitle(model)}`,
  };
}

export default function VdpPage({ params }: { params: PageParams }) {
  const skeletonParams = params.then(({ make, model, trim, year }) => ({
    make,
    model,
    trim,
    year,
  }));

  return (
    <Suspense fallback={<VdpPageSkeleton params={skeletonParams} />}>
      <VdpPageContent params={params} />
    </Suspense>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrator assembles dealer fallback + image resolution logic
async function VdpPageContent({ params }: { params: PageParams }) {
  const { vin } = await params;

  // Start BFF and manifest fetches concurrently — total wait ≈ max(BFF, CDN)
  const vdpPromise = getVehicleStatus(vin);
  const manifestPromise = fetchCarCutterManifest(vin);

  const { vehicleStatus, vdpData } = await vdpPromise;

  // Extract marketing data from VDP response (returned by getVehicleStatus)
  const marketingData: VdpMarketingContent | null = vdpData?.data.marketing ?? null;
  const bffVehicle = vdpData?.data.vehicle ?? null;
  const vehicleImages = vdpData?.data.vehicleImages;

  if (vehicleStatus === "not-found") {
    notFound();
  }

  if (vehicleStatus === "sold") {
    // Sold data must come from the VIN API — no client-side fallback
    if (!vdpData) {
      notFound();
    }

    const soldData = toSoldCardFromApi(vdpData);

    return (
      <>
        <SignalHeroReady />
        <UnavailableVehicleLayout
          heroCard={
            <StatusHeroCard
              alt="Sold vehicle"
              ctaCard={
                <StatusCard
                  dealer={soldData.dealer}
                  soldDate={soldData.soldDate}
                  vehicle={soldData.vehicle}
                />
              }
              imageUrl={soldData.heroImageUrl}
              imageUrlDesktop={soldData.heroImageUrlDesktop}
              imageUrlTablet={soldData.heroImageUrlTablet}
            />
          }
          recommendations={
            <Suspense fallback={<SimilarVehiclesSkeleton />}>
              <SimilarVehicles vin={vin} />
            </Suspense>
          }
        />
      </>
    );
  }

  const cookieStore = await cookies();

  const certification = (cookieStore.get(VDP_COOKIE_CERTIFICATION)?.value ||
    "false") as VdpCertificationTier;
  const noPhotos = cookieStore.get(VDP_COOKIE_NO_PHOTOS)?.value === "true";

  // Resolve vehicle fixture based on certification flag
  const vehicle = noPhotos ? VDP_FIXTURE_NO_PHOTOS : resolveVehicleFixture(certification);

  // Canonical display fields — prefer live BFF data, fall back to fixture.
  // Use `rv` anywhere the page needs make/model/trim/year/mileage/listPrice
  // so we don't scatter `bffVehicle?.vehicleInfo.X ?? vehicle.X` everywhere.
  const rv = {
    make: bffVehicle?.vehicleInfo.make ?? vehicle.make,
    model: bffVehicle?.vehicleInfo.model ?? vehicle.model,
    trim: bffVehicle?.vehicleInfo.trim ?? vehicle.trim,
    year: bffVehicle?.vehicleInfo.year ?? vehicle.year,
    mileage: bffVehicle?.status.mileage ?? vehicle.mileage,
    listPrice: bffVehicle
      ? resolveDisplayPrice({
          effectivePrice: bffVehicle.computed?.effectivePrice,
          sellingPrice: bffVehicle.pricing?.sellingPrice,
          listPrice: bffVehicle.pricing?.listPrice,
          msrp: bffVehicle.pricing?.msrp,
        })
      : vehicle.price,
  };

  // Await the manifest (was fetching in parallel with the BFF call above)
  const manifest = await manifestPromise;

  // Hero image: use the first photo by filename prefix (lowest = first in capture sequence).
  const sortedPhotos = sortMediaByFilenamePrefix(bffVehicle?.media?.photos ?? []);
  const heroPhoto = noPhotos ? undefined : sortedPhotos[0];
  const heroImageUrl = heroPhoto
    ? normalizeImageUrl(heroPhoto?.url, FALLBACK_HERO_IMAGE)
    : (vehicle.heroImageUrl ?? FALLBACK_HERO_IMAGE);

  // Identity used for alt text generation
  const identity = bffVehicle
    ? {
        make: bffVehicle.vehicleInfo.make,
        model: bffVehicle.vehicleInfo.model,
        year: bffVehicle.vehicleInfo.year,
      }
    : { make: vehicle.make, model: vehicle.model, year: vehicle.year };

  // Gallery images: prefer manifest (new primary source); fall back to BFF media.photos
  // when CAR_CUTTER_GALLERY_HASH is not set, CDN is unreachable, or the manifest has no still images.
  //
  // When BFF photos are available, build a Set of their sourceIds and pass it to the manifest
  // builder so that only images also present in the BFF response are rendered (deduplication).
  const bffPhotos = bffVehicle?.media?.photos ?? [];
  const bffSourceIds = new Set<string>();
  for (const photo of bffPhotos) {
    if (photo.sourceId) {
      bffSourceIds.add(photo.sourceId.toLowerCase());
    }
  }
  const manifestImages = manifest
    ? buildGalleryImagesFromManifest(
        manifest,
        identity,
        bffSourceIds.size > 0 ? bffSourceIds : undefined
      )
    : [];
  let galleryImages: VehicleImage[];
  if (manifestImages.length > 0) {
    galleryImages = manifestImages;
  } else if (bffVehicle) {
    galleryImages = buildGalleryImages(bffVehicle.media?.photos ?? [], identity);
  } else {
    galleryImages = [];
  }

  // Gallery cover: first manifest image when available (already an absolute CDN URL),
  // else fall back to the second photo in sort order.
  const bffCoverPhoto = sortedPhotos[1] ?? sortedPhotos.find((p) => p !== heroPhoto);
  const galleryCoverUrl = galleryImages[0]?.url ?? normalizeImageUrl(bffCoverPhoto?.url, "");
  const galleryCoverAlt =
    galleryImages[0]?.alt ?? `${rv.year} ${rv.make} ${rv.model} — gallery cover`;

  // hasPhotos: when the no-photos flag is active, always treat as no photos.
  // Otherwise use manifest-derived images when available, else fall back to fixture logic.
  let hasPhotos = false;
  if (!noPhotos) {
    hasPhotos = bffVehicle ? galleryImages.length > 0 : vehicle.photos.length > 0;
  }

  // 360 viewer URL: enabled only when the manifest confirms next360 content exists.
  // Falls back to null (first gallery image used as hero instead) when CAR_CUTTER_GALLERY_HASH
  // is unset or the manifest has no next360 category.
  const threeSixtyManifestUrl: string | null =
    manifest !== null && hasNext360(manifest)
      ? `/api/v1/vehicles/${encodeURIComponent(vin.toUpperCase())}/360`
      : null;

  // Extract color data from the VDP response already fetched by getVehicleStatus()
  const vehicleColorData = mapVehicleInfoToColorData(
    vdpData?.data.vehicle?.vehicleInfo as VehicleInfoExtended | undefined
  );

  // Use the collision-safe shared constant for view-transition-name.
  // The clicked card's image gets this name assigned dynamically at click time
  // by HeroTransitionProvider, so the browser morphs it into this hero.
  const imageTransitionName = VIEW_TRANSITION_NAME_HERO;

  // Extract FAQ from the VDP data already fetched by getVehicleStatus()
  // to avoid a duplicate BFF call. Falls back to defaults if VDP data is unavailable.
  let faqQuestions: string[] = ASK_QUESTION_SUGGESTIONS_SUV;
  if (vdpData?.data.faq) {
    faqQuestions = vdpData.data.faq.questions.map((q) => q.question);
  }

  // Build heading dynamically from vehicle data to match Figma pattern:
  // "See what others are asking about this {year} {model} {trim}"
  const faqHeading = `See what others are asking about this ${rv.year} ${rv.model} ${rv.trim}`;

  return (
    <>
      <UnblockRecentReturn />
      <RecordVehicleViewClient
        vehicle={{
          imageUrl: heroImageUrl,
          make: rv.make,
          mileage: rv.mileage,
          model: rv.model,
          price: rv.listPrice,
          trim: rv.trim,
          vin,
          year: rv.year,
        }}
      />
      <VehicleDetailLayout
        continueShopping={<ContinueShoppingVdpClient excludeVin={vin} />}
        description={
          bffVehicle?.computed?.comparisonProfile ? (
            <DescriptionSection description={bffVehicle.computed.comparisonProfile} />
          ) : undefined
        }
        detailCards={
          <DetailCardsSection
            bffVehicle={bffVehicle}
            certification={certification}
            faqHeading={faqHeading}
            faqQuestions={faqQuestions}
            galleryCoverAlt={galleryCoverAlt}
            galleryCoverUrl={galleryCoverUrl}
            galleryImages={galleryImages}
            hasPhotos={hasPhotos}
            rv={rv}
            threeSixtyManifestUrl={threeSixtyManifestUrl}
            vehicle={vehicle}
            vehicleColorData={vehicleColorData}
            vehicleImages={vehicleImages}
            vin={vin}
          />
        }
        hero={
          <HeroBackground
            alt={
              heroImageUrl === FALLBACK_HERO_IMAGE
                ? "Illustrative vehicle rendering"
                : "Vehicle hero background"
            }
            src={heroImageUrl}
            viewTransitionName={imageTransitionName}
          />
        }
        rightRail={
          <Suspense fallback={<PurchaseCardRailSkeleton />}>
            <PurchaseCardRail
              certification={certification}
              vdpData={vdpData ?? VDP_RESPONSE_DEFAULT_FIXTURE}
            />
          </Suspense>
        }
        specs={
          <VdpFeatures
            carfaxReportUrl="#"
            carfaxStatus="1-owner vehicle, accident free"
            keyFeatures={
              bffVehicle?.features ? mapVehicleFeaturesToKeyList(bffVehicle.features) : []
            }
            viewAllFeaturesAction={
              <ViewAllFeaturesModal
                categories={
                  bffVehicle?.features ? mapVehicleFeaturesToCategories(bffVehicle.features) : []
                }
                packages={
                  bffVehicle?.packages ? mapVehiclePackagesToModal(bffVehicle.packages) : undefined
                }
                searchAliases={SEARCH_ALIASES_FIXTURE}
                trigger={
                  <Button
                    className="flex h-auto justify-start self-start pl-6"
                    nativeButton={false}
                    render={<span />}
                    size="sm"
                    trailingIcon={IconArrowRight}
                    variant="text"
                  >
                    View all features
                  </Button>
                }
              />
            }
            warrantyValue={
              bffVehicle?.warranty ? formatWarrantyValue(bffVehicle.warranty) : "Warranty included"
            }
          />
        }
        whyBuy={<WhyBuySection data={marketingData} />}
      />
    </>
  );
}

/* ─── Flag Resolution ─── */

function resolveVehicleFixture(certification: VdpCertificationTier): VehicleDetailData {
  switch (certification) {
    case "gold":
      return VDP_FIXTURE_GOLD;
    case "silver":
      return VDP_FIXTURE_SILVER;
    default:
      return VDP_FIXTURE_UNCERTIFIED;
  }
}

/* ─── Section Components ─── */

function DescriptionSection({ description }: { description: string }) {
  return (
    <div className="col-span-4 flex flex-col gap-3 md:col-span-6 lg:col-span-7" data-surface="dark">
      <IconToyotaX className="size-5 text-text-primary" />
      <LlmIntroduction text={description} />
    </div>
  );
}

function DetailCardsSection({
  bffVehicle,
  certification,
  faqHeading,
  faqQuestions,
  galleryCoverAlt,
  galleryCoverUrl,
  galleryImages,
  hasPhotos,
  rv,
  threeSixtyManifestUrl,
  vehicle,
  vehicleColorData,
  vehicleImages,
  vin,
}: {
  bffVehicle: VdpVehicleData | null;
  certification: VdpCertificationTier;
  faqHeading: string;
  faqQuestions: string[];
  galleryCoverAlt: string;
  galleryCoverUrl: string;
  galleryImages: VehicleImage[];
  hasPhotos: boolean;
  rv: Pick<VehicleSummary, "listPrice" | "make" | "mileage" | "model" | "trim" | "year">;
  threeSixtyManifestUrl: string | null;
  vehicle: VehicleDetailData;
  vehicleColorData?: VehicleColorData;
  vehicleImages?: VdpVehicleImages;
  vin: string;
}) {
  const showCertification = certification !== "false";
  const certTier = showCertification ? (certification as "gold" | "silver") : false;

  return (
    <div className="col-span-full flex flex-col gap-2">
      {/* Image Gallery card — opens full-screen overlay on click */}
      {hasPhotos && galleryImages.length > 0 && (
        <GalleryOverlay
          conditionHotspots={vehicle.conditionHotspots}
          coverImageAlt={galleryCoverAlt}
          coverImageUrl={galleryCoverUrl}
          images={galleryImages}
          keyFeaturesHotspots={vehicle.keyFeaturesHotspots}
          make={rv.make}
          model={rv.model}
          threeSixtyManifestUrl={threeSixtyManifestUrl}
          trim={rv.trim}
          year={rv.year}
        />
      )}

      {/* Exterior — large card, MOCK flow only (vehicleImages present) */}
      {hasPhotos && vehicleImages && (
        <DetailImageCard
          badge={vehicleImages.exterior.badge}
          imageAlt={vehicleImages.exterior.label}
          imageUrl={vehicleImages.exterior.imageUrl}
          label={vehicleImages.exterior.label}
          size="large"
          subLabel={vehicleImages.exterior.subLabel}
        />
      )}

      {/* Interior + Wheels cards — 2-col grid, MOCK flow only (vehicleImages present) */}
      {vehicleImages && (
        <DetailCardPair
          hasPhotos={hasPhotos}
          vehicleColorData={vehicleColorData}
          vehicleImages={vehicleImages}
        />
      )}

      {/* Color swatch cards — only when no photos and no vehicleImages (LIVE flow fallback) */}
      {!(vehicleImages || hasPhotos) && (
        <DetailCardPair hasPhotos={false} vehicleColorData={vehicleColorData} />
      )}

      <VehicleSpecsCard
        specs={
          bffVehicle ? mapVehicleInfoToSpecs(bffVehicle.vehicleInfo, bffVehicle.computed ?? {}) : {}
        }
        viewAllSpecsAction={
          <ViewAllSpecsModal
            categories={
              bffVehicle
                ? mapVehicleInfoToSpecsCategories(
                    bffVehicle.vehicleInfo,
                    bffVehicle.computed ?? {},
                    bffVehicle.vin,
                    bffVehicle.stockNumber ?? ""
                  )
                : []
            }
            searchAliases={SEARCH_ALIASES_FIXTURE}
            trigger={
              <Button
                className="h-auto min-h-0 p-0"
                nativeButton={false}
                render={<span />}
                size="sm"
                trailingIcon={IconArrowRight}
                variant="text"
              >
                View All Specs
              </Button>
            }
          />
        }
      />

      {/* Certification + Pricing */}
      <div className={showCertification ? "grid grid-cols-1 gap-2 lg:grid-cols-2" : undefined}>
        {showCertification && <CertificationBadgeCard model={rv.model} tier={certTier} />}
        <PriceComparison
          className={showCertification ? "col-span-1" : "col-span-4 md:col-span-8"}
          data={PRICE_COMPARISON_DEFAULT}
        />
      </div>

      <AskQuestionCard
        heading={faqHeading}
        model={rv.model}
        suggestions={faqQuestions}
        trim={rv.trim}
        vin={vin}
        year={rv.year}
      />
    </div>
  );
}

function WhyBuySection({ data }: { data: VdpMarketingContent | null }) {
  if (!data) {
    return null;
  }
  return <BuyWithConfidence data={data} />;
}
