import { transformV2CompletePayload } from "../mappers/agent-v2-card.mapper";
import { createAgentEventTransformer, normalizeCardsEnvelope } from "./agent-events-transformer";

const transformV2Events = createAgentEventTransformer(
  transformV2CompletePayload,
  "[agent-v2-transformer]"
);

// Retained export name — v2 keys off the shared cards-envelope normalizer.
const normalizeV2Event = normalizeCardsEnvelope;

export { normalizeV2Event, transformV2Events };
