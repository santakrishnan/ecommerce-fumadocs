# Origination BFF — flow & data model

Foundation (FND-01) for the origination flow. Mirrors `features/search/bff` and
`features/landing/bff`: Zod contracts are the single source of truth, use-cases
return a `Result<T, E>` (never throw), and every endpoint switches between a mock
and a real BED upstream behind one env flag.

The whole domain is mocked behind a single `USE_ORIGINATION_MOCKS` flag until the
OpenAPI spec lands — at which point only the `*-upstream.ts` services and their
response `safeParse` change. Contracts, use-case signatures, and fixtures stay put.

## Layer layout

```
features/origination/bff/
  contracts/    origination-model.ts (canonical model) + <name>-request/response schemas
  errors/       origination.errors.ts (factory + code union), origination-error-response.ts
  services/     <name>-mock.ts, <name>-upstream.ts
  use-cases/    patch-origination.ts (server-only, returns Result)
  lib/          result.ts, mock-delay.ts
  __fixtures__/ typed fixtures (satisfy the Zod model)
```

## Request flow (one PATCH transition)

Each origination screen is its own route. On every state transition the client
PATCHes the **same** BFF endpoint; the use-case returns the full, unified
`OriginationApplication`.

```mermaid
sequenceDiagram
    actor Client as Origination screen
    participant Route as Route handler / Server Action
    participant UC as patchOrigination (use-case, server-only)
    participant Env as USE_ORIGINATION_MOCKS
    participant BED as resolveBedService("origination")
    participant Mock as patch-origination-mock
    participant Up as patch-origination-upstream
    participant Err as originationErrorResponse

    Client->>Route: PATCH { originationId, step, status }
    Route->>Route: patchOriginationRequestSchema.safeParse(body)
    Route->>UC: patchOrigination(request, traceId, identity)
    UC->>Env: flag === "true"?
    alt mock flag on (always wins)
        Env-->>UC: yes
        UC->>Mock: mockPatchOrigination(request)
        Mock-->>UC: Result.success(OriginationApplication)
    else real upstream
        UC->>BED: resolve service
        alt service configured
            BED-->>UC: ResolvedBedService
            UC->>Up: patchOriginationUpstream(service, request, traceId, identity)
            Up->>Up: safeParse(originationApplicationSchema)
            Up-->>UC: Result.success | Result.failure(OriginationError)
        else not configured
            BED-->>UC: null
            UC-->>UC: 503 ServiceUnavailable
        end
    end
    alt Result.success
        UC-->>Route: { success: true, data: OriginationApplication }
        Route-->>Client: 200 OriginationApplication
    else Result.failure
        UC-->>Route: { success: false, error: OriginationError }
        Route->>Err: originationErrorResponse(error, traceId)
        Err-->>Client: { error: { code, message }, meta } + status
    end
```

## Mock / upstream / 503 switch

The resolution order inside every origination use-case:

```mermaid
flowchart TD
    A[use-case called] --> B{USE_ORIGINATION_MOCKS === true?}
    B -- yes --> M[return mock fixture data]
    B -- no --> C{resolveBedService origination}
    C -- ResolvedBedService --> U[call *-upstream.ts]
    C -- null --> E[503 ServiceUnavailable]
    U --> P{response safeParse ok?}
    P -- yes --> S[Result.success data]
    P -- no --> BG[UpstreamError 502]
```

## Unified data model

One canonical `OriginationApplication` is returned across the whole flow. It is
**PII-free**: raw sensitive inputs (phone, SSN, DOB, income) flow through each
step's own dedicated endpoint and are dropped server-side. Only derived,
non-sensitive state lives here.

```mermaid
classDiagram
    class OriginationApplication {
        +string originationId
        +OriginationStatus status
        +OriginationStep currentStep
        +OriginationStep[] completedSteps
        +Partial~Record~ steps
        +string updatedAt
    }
    class OriginationStepState {
        +OriginationStepStatus status
        +string updatedAt
    }
    class OriginationStep {
        <<enum>>
        phone-verification
        otp-verification
        identity
        trade-in
        down-payment
        entry
        credit-check
        offers
        review
    }
    class OriginationStepStatus {
        <<enum>>
        started
        completed
        skipped
    }
    class OriginationStatus {
        <<enum>>
        in-progress
        completed
        abandoned
    }
    OriginationApplication "1" o-- "0..*" OriginationStepState : steps[step]
    OriginationApplication ..> OriginationStep
    OriginationStepState ..> OriginationStepStatus
    OriginationApplication ..> OriginationStatus
```

`steps` is a **partial** record keyed by step (`z.partialRecord`), so only
reached steps appear. `currentStep`, `completedSteps`, and `status` are derived
roll-ups the UI reads directly (progress bar, flow branching).

## Application lifecycle

```mermaid
stateDiagram-v2
    [*] --> in_progress: first PATCH
    in_progress --> in_progress: PATCH step (started | completed | skipped)
    in_progress --> completed: PATCH review + completed
    in_progress --> abandoned: session dropped (upstream policy)
    completed --> [*]
    abandoned --> [*]
```

## BED service registration

Origination and its third-party providers are registered as **separate** BED
services in `src/config/bed-services.ts`, so credentials, versioning, and
outages stay isolated.

```mermaid
flowchart LR
    subgraph env[Typed env schema]
        K1[ORIGINATION_API_KEY / _PATH]
        K2[ORIGINATION_IDENTITY_API_KEY / _PATH]
        K3[ORIGINATION_TRADEIN_API_KEY / _PATH]
    end
    D[API_UPSTREAM_URL] --> R[resolveBedService]
    K1 --> R
    K2 --> R
    K3 --> R
    R --> S1[origination -> /origination/v1]
    R --> S2[origination-identity -> Experian]
    R --> S3[origination-tradein -> valuation]
```
