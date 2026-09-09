import spinningIcon from "@public/images/spinning.svg";
import { IconCheckmark, IconExclamation } from "@ucmp/ui/icons";
import Image from "next/image";

/** A single row in the loading checklist — presentation-only, decoupled from the turn model. */
export interface SearchLoadingBeat {
  /** Stable beat id used as the React key — keeps the DOM node alive when message updates. */
  beat: string;
  message: string;
  status: "active" | "done" | "error";
}

interface SearchLoadingIndicatorProps {
  beats?: SearchLoadingBeat[];
  thinkingStatus?: string;
}

export function SearchLoadingIndicator({ thinkingStatus, beats }: SearchLoadingIndicatorProps) {
  const hasStream = Boolean(beats && beats.length > 0);

  return (
    <div className="flex flex-col" data-surface="dark">
      <div aria-live="polite" className="flex items-center gap-2.5" role="status">
        <Image alt="brand ai star" aria-hidden className="animate-spin-pause" src={spinningIcon} />
        {thinkingStatus && <p className="subhead-sm text-text-primary/70">{thinkingStatus}</p>}
      </div>

      {hasStream && beats && (
        <div className="mt-6 ml-2.5 flex flex-col">
          {beats.map((beat, index) => {
            const rowKey = `${index}:${beat.beat}`;
            return (
              <div className="flex flex-row" key={rowKey}>
                <div className="h-9 w-px origin-top animate-line-grow bg-text-inverse/30" />
                <div className="flex animate-keyword-in items-center gap-1 py-1.5 pl-5">
                  {beat.status === "done" && (
                    <IconCheckmark className="size-5 shrink-0 animate-keyword-in text-text-inverse/70" />
                  )}
                  {beat.status === "error" && (
                    <IconExclamation className="size-5 shrink-0 animate-keyword-in text-text-inverse/70" />
                  )}
                  <span className="body-md text-text-primary/70">{beat.message}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
