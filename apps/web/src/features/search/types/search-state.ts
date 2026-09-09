/**
 * SearchAgentMode — discriminator surfaces use to determine which agent persona is running.
 *
 * - "general": default search experience
 * - "vdp-faq": vehicle detail page FAQ agent
 *
 * Adding a new mode only requires extending this union — nothing else.
 */
export type SearchAgentMode = "general" | "vdp-faq";

/**
 * SearchConversationalState — the full state machine for the conversational search page.
 *
 * Transitions:
 *   idle → focused (user clicks/tabs into the input)
 *   focused → typing (user types at least one character)
 *   typing → loading (submit accepted and handoff transition begins)
 *   loading → results-generated (turn settled and route handoff completes)
 *   loading → typing (initial submission settles with an error)
 *   results-generated → refinement (user selects a refinement chip)
 *   any → idle (user resets / navigates away)
 */
export type SearchConversationalState =
  | "idle"
  | "focused"
  | "typing"
  | "query-initialized"
  | "loading"
  | "results-generated"
  | "refinement"
  | "submitted";
