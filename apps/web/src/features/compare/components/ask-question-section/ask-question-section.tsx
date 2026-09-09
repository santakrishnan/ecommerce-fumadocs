import { AskQuestionPrompt } from "@shared/components/ask-question-prompt";
import { cn } from "utils";

export interface AskQuestionSectionProps {
  /** Additional CSS classes */
  className?: string;
  /** Section heading (e.g. "Ask a question about Price & Value") */
  heading: string;
  /** Called when the user selects a question. Receives the question text, or null for catch-all. */
  onSelect?: (question: string | null) => void;
  /** Suggested question pills */
  questions: string[];
}

/**
 * AskQuestionSection — Compare page wrapper around the shared AskQuestionPrompt.
 *
 * Uses the "light" variant (horizontal-scroll pills on mobile, wrapped on desktop).
 * Selection is exposed via `onSelect` — currently a no-op placeholder until the
 * conversational overlay is wired for Compare.
 */
export function AskQuestionSection({
  heading,
  questions,
  className,
  onSelect,
}: AskQuestionSectionProps) {
  return (
    <AskQuestionPrompt
      className={cn("mt-12", className)}
      heading={heading}
      onSelect={onSelect}
      questions={questions}
      variant="light"
    />
  );
}
