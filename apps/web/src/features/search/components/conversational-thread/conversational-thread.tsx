import { cn } from "utils";

export interface ConversationalThreadProps {
  className?: string;
  contentClassName?: string;
  query: string;
  responseParagraphs: string[];
}

export function ConversationalThread({
  className,
  contentClassName,
  query,
  responseParagraphs,
}: ConversationalThreadProps) {
  return (
    <section
      aria-label="Conversational thread"
      className={cn("w-full", className)}
      data-surface="dark"
      data-testid="conversational-thread"
    >
      <div
        className={cn("max-w-md space-y-6", contentClassName)}
        data-testid="conversational-thread-content"
      >
        <p className="subhead-sm truncate text-text-tertiary">{query}</p>

        <div className="space-y-5">
          {responseParagraphs.map((paragraph) => (
            <p className="body-xl text-text-primary" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
