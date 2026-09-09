import {
  EXTRA_SAVINGS_CONTEXT_FIXTURE,
  EXTRA_SAVINGS_DESCRIPTION,
  EXTRA_SAVINGS_TITLE,
  ExtraSavingsContent,
  READINESS_DESCRIPTION,
  READINESS_ITEMS,
  READINESS_TITLE,
  ReadinessItemCard,
  TRADE_IN_DESCRIPTION,
  TRADE_IN_TITLE,
  TradeInContent,
} from "@features/origination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ucmp/ui";
import type { Metadata } from "next";
import { DOWN_PAYMENT_CONTEXT_FIXTURE } from "~/features/origination/bff/__fixtures__/down-payment.fixture";
import { SCHEDULING_CONTEXT_FIXTURE } from "~/features/origination/bff/__fixtures__/scheduling.fixture";
import {
  DOWN_PAYMENT_DESCRIPTION,
  DOWN_PAYMENT_TITLE,
  DownPaymentContent,
} from "~/features/origination/components/down-payment-content";
import {
  INCOME_DESCRIPTION,
  INCOME_TITLE,
  IncomeContent,
} from "~/features/origination/components/income-content";
import {
  PHONE_VERIFICATION_DESCRIPTION,
  PHONE_VERIFICATION_TITLE,
  PhoneVerificationContent,
} from "~/features/origination/components/phone-verification-content";
import {
  SCHEDULING_DESCRIPTION,
  SCHEDULING_TITLE,
  SchedulingContent,
} from "~/features/origination/components/scheduling-content";
import { ConfirmationTab } from "./confirmation-tab";
import { CreditCheckLoadingTab } from "./credit-check-loading-tab";
import { FinancingCoApplicantTab } from "./financing-coapplicant-tab";
import { PurchaseMethodTab } from "./purchase-method-tab";
import { TradeInOfferTab } from "./trade-in-offer-tab";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Origination demo",
};

// Temporary demo page — each tab represents one origination flow step.
// Add a new tab here as each content component is built.
// This page is deleted once all screens are wired into the XState machine.

function ReadinessTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">⬇ Passed to OriginationPanel layout</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <div className="flex flex-col gap-2">
          <h2 className="h3 text-text-primary">{READINESS_TITLE}</h2>
          <p className="body-md text-text-secondary">{READINESS_DESCRIPTION}</p>
        </div>
      </div>
      <p className="body-xs font-medium text-text-secondary">⬇ XState content boundary</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <ReadinessItemCard items={READINESS_ITEMS} />
      </div>
    </div>
  );
}

function DownPaymentTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">⬇ Passed to OriginationPanel layout</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <div className="flex flex-col gap-2">
          <h2 className="h3 text-text-primary">{DOWN_PAYMENT_TITLE}</h2>
          <p className="body-md text-text-secondary">{DOWN_PAYMENT_DESCRIPTION}</p>
        </div>
      </div>
      <p className="body-xs font-medium text-text-secondary">⬇ XState content boundary</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <DownPaymentContent
          presets={DOWN_PAYMENT_CONTEXT_FIXTURE.presets}
          vehiclePrice={DOWN_PAYMENT_CONTEXT_FIXTURE.vehiclePrice}
        />
      </div>
    </div>
  );
}

function IncomeTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">⬇ Passed to OriginationPanel layout</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <div className="flex flex-col gap-2">
          <h2 className="h3 text-text-primary">{INCOME_TITLE}</h2>
          <p className="body-md text-text-secondary">{INCOME_DESCRIPTION}</p>
        </div>
      </div>
      <p className="body-xs font-medium text-text-secondary">⬇ XState content boundary</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <IncomeContent />
      </div>
    </div>
  );
}

function TradeInTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">⬇ Passed to OriginationPanel layout</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <div className="flex flex-col gap-2">
          <h2 className="h3 text-text-primary">{TRADE_IN_TITLE}</h2>
          <p className="body-md text-text-secondary">{TRADE_IN_DESCRIPTION}</p>
        </div>
      </div>
      <p className="body-xs font-medium text-text-secondary">⬇ XState content boundary</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <TradeInContent />
      </div>
    </div>
  );
}

function SchedulingTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">⬇ Passed to OriginationPanel layout</p>
      <h2 className="h3 text-text-primary">{SCHEDULING_TITLE}</h2>
      <p className="body-md text-text-secondary">{SCHEDULING_DESCRIPTION}</p>
      <p className="body-xs font-medium text-text-secondary">⬇ XState content boundary</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <SchedulingContent days={SCHEDULING_CONTEXT_FIXTURE.days} />
      </div>
    </div>
  );
}

function ExtraSavingsTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">⬇ Passed to OriginationPanel layout</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <div className="flex flex-col gap-2">
          <h2 className="h3 text-text-primary">{EXTRA_SAVINGS_TITLE}</h2>
          <p className="body-md text-text-secondary">{EXTRA_SAVINGS_DESCRIPTION}</p>
        </div>
      </div>
      <p className="body-xs font-medium text-text-secondary">⬇ XState content boundary</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <ExtraSavingsContent options={EXTRA_SAVINGS_CONTEXT_FIXTURE.options} />
      </div>
    </div>
  );
}

function PhoneVerificationTab() {
  return (
    <div className="flex flex-col gap-6">
      <p className="body-xs font-medium text-text-secondary">⬇ Passed to OriginationPanel layout</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <div className="flex flex-col gap-2">
          <h2 className="h3 text-text-primary">{PHONE_VERIFICATION_TITLE}</h2>
          <p className="body-md text-text-secondary">{PHONE_VERIFICATION_DESCRIPTION}</p>
        </div>
      </div>
      <p className="body-xs font-medium text-text-secondary">⬇ XState content boundary</p>
      <div className="rounded-lg border-2 border-surface-muted border-dashed p-6">
        <PhoneVerificationContent />
      </div>
    </div>
  );
}

export default function OriginationsDemoPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="h2 text-text-primary">Origination Flow: Screen Demo Page</h1>
        <p className="body-md mt-2 text-text-secondary">
          Temporary page for demoing individual screen content before the XState machine is wired
          up.
        </p>
      </div>
      <Tabs defaultValue="readiness">
        {/* Many demo tabs — allow the list to scroll horizontally instead of
            overflowing the page. `shrink-0` keeps each trigger readable. */}
        <TabsList className="max-w-full flex-nowrap overflow-x-auto *:shrink-0">
          <TabsTrigger value="readiness">Readiness</TabsTrigger>
          <TabsTrigger value="trade-in">Trade-in</TabsTrigger>
          <TabsTrigger value="purchase-method">Purchase method</TabsTrigger>
          <TabsTrigger value="financing-coapplicant">Financing co-applicant</TabsTrigger>
          <TabsTrigger value="down-payment">Down payment</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="confirmation">Confirmation</TabsTrigger>
          <TabsTrigger value="extra-savings">Extra savings</TabsTrigger>
          <TabsTrigger value="phone-verification">Phone verification</TabsTrigger>
          <TabsTrigger value="credit-check-loading">Credit check loading</TabsTrigger>
          <TabsTrigger value="trade-in-offer">Trade-in offer</TabsTrigger>
          {/* Add more tabs here as screens are built */}
        </TabsList>
        <TabsContent className="mt-8" value="readiness">
          <ReadinessTab />
        </TabsContent>
        <TabsContent className="mt-8" value="trade-in">
          <TradeInTab />
        </TabsContent>
        <TabsContent className="mt-8" value="down-payment">
          <DownPaymentTab />
        </TabsContent>
        <TabsContent className="mt-8" value="purchase-method">
          <PurchaseMethodTab />
        </TabsContent>
        <TabsContent className="mt-8" value="confirmation">
          <ConfirmationTab />
        </TabsContent>
        <TabsContent className="mt-8" value="financing-coapplicant">
          <FinancingCoApplicantTab />
        </TabsContent>
        <TabsContent className="mt-8" value="income">
          <IncomeTab />
        </TabsContent>
        <TabsContent className="mt-8" value="scheduling">
          <SchedulingTab />
        </TabsContent>
        <TabsContent className="mt-8" value="extra-savings">
          <ExtraSavingsTab />
        </TabsContent>
        <TabsContent className="mt-8" value="phone-verification">
          <PhoneVerificationTab />
        </TabsContent>
        <TabsContent className="mt-8" value="credit-check-loading">
          <CreditCheckLoadingTab />
        </TabsContent>
        <TabsContent className="mt-8" value="trade-in-offer">
          <TradeInOfferTab />
        </TabsContent>
        {/* Add a matching <TabsContent> for each trigger — see instructions above */}
      </Tabs>
    </div>
  );
}
