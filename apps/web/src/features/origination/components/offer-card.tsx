import { Button, Card, CardContent, CardFooter, CardHeader, Separator } from "@ucmp/ui";
import { cn, formatPrice } from "utils";

interface OfferCardProps {
  /** APR percentage rendered without reformatting. */
  apr: number;
  /** Optional class name for the Card root. */
  className?: string;
  /** Button label override. */
  ctaLabel?: string;
  /** Down payment amount in whole dollars. */
  downPayment: number;
  /** Card title. */
  header: string;
  /** Selects the minimized variation. */
  minimized?: boolean;
  /** Monthly payment amount in whole dollars. */
  monthlyPayment: number;
  /** Supplemental line shown in the default variation. */
  supplementalText?: string;
  /** Loan term in whole months rendered without reformatting. */
  termMonths: number;
  /** Total financed amount in whole dollars. */
  totalFinanced: number;
  /** Estimated trade-in value, omitted when not supplied. */
  tradeInValue?: number;
}

export const OFFER_CARD_DEFAULT_CTA_LABEL = "Continue with this option";

export function OfferCard({
  header,
  supplementalText,
  monthlyPayment,
  apr,
  termMonths,
  downPayment,
  totalFinanced,
  tradeInValue,
  ctaLabel,
  minimized = false,
  className,
}: OfferCardProps) {
  const formattedTradeInValue = tradeInValue === undefined ? undefined : formatPrice(tradeInValue);
  const formattedDownPayment = formatPrice(downPayment);
  const formattedTotalFinanced = formatPrice(totalFinanced);
  const compactBreakdown = [
    formattedTradeInValue === undefined ? null : `${formattedTradeInValue} est. trade-in`,
    `${formattedDownPayment} down payment`,
    `Total financed ${formattedTotalFinanced}`,
  ]
    .filter((segment) => segment !== null)
    .join(" · ");

  const figureValueClassName = cn("number-lg text-text-primary", !minimized && "lg:number-xl");
  const ctaText = ctaLabel ?? OFFER_CARD_DEFAULT_CTA_LABEL;

  return (
    <Card className={cn("w-full gap-8 px-6 py-8", className)}>
      <CardHeader className="gap-2 px-0 py-0">
        <h3 className={cn(minimized ? "subhead-sm" : "subhead-lg", "text-text-primary")}>
          {header}
        </h3>
        {minimized || supplementalText === undefined ? null : (
          <p className="body-lg text-text-secondary">{supplementalText}</p>
        )}
      </CardHeader>

      <CardContent className="px-0 py-0">
        <dl aria-label="Financing details" className="grid grid-cols-3 gap-4">
          <div className="flex min-w-0 flex-col-reverse gap-2">
            <dt className="body-md text-text-secondary">Per month</dt>
            <dd className={figureValueClassName}>{formatPrice(monthlyPayment)}</dd>
          </div>
          <div className="flex min-w-0 flex-col-reverse gap-2">
            <dt className="body-md text-text-secondary">APR</dt>
            <dd className={cn(figureValueClassName, "flex items-baseline gap-0.5")}>
              {apr}
              <span className="h3">%</span>
            </dd>
          </div>
          <div className="flex min-w-0 flex-col-reverse gap-2">
            <dt className="body-md text-text-secondary">Months</dt>
            <dd className={figureValueClassName}>{termMonths}</dd>
          </div>
        </dl>
      </CardContent>

      <Separator />

      {minimized ? (
        <CardContent className="p-0">
          <p className="body-md text-text-secondary">{compactBreakdown}</p>
        </CardContent>
      ) : (
        <CardContent className="flex flex-col gap-4 p-0">
          {tradeInValue === undefined ? null : (
            <div className="flex items-baseline justify-between">
              <span className="body-md text-text-primary">Estimated Trade-In Value</span>
              <span className="subhead-sm text-text-primary">{formattedTradeInValue}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="body-md text-text-primary">Down Payment</span>
            <span className="subhead-sm text-text-primary">{formattedDownPayment}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="body-md text-text-primary">Total Financed</span>
            <span className="subhead-sm text-text-primary">{formattedTotalFinanced}</span>
          </div>
        </CardContent>
      )}

      <CardFooter className="p-0">
        <Button fullWidth size="lg" type="button" variant={minimized ? "tertiary" : "primary"}>
          {ctaText}
        </Button>
      </CardFooter>
    </Card>
  );
}

export type { OfferCardProps };
