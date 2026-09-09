"use client";

import { Button } from "@ucmp/ui";
import { IconEdit } from "@ucmp/ui/icons";
import { useState } from "react";

export interface WatchlistNoteDisplayProps {
  /** The saved note text to display. */
  note: string;
}

/**
 * Inline note display for a watchlist vehicle card.
 *
 * Collapsed: shows text truncated with "… Show more" inline at the end.
 * Expanded: shows full text with "Show less" below.
 *
 * The inline "Show more" uses the UI Button with `render={<span />}` to
 * produce an inline element that flows naturally with the surrounding text
 * while retaining all Button accessibility and interaction behavior.
 */
const TRUNCATE_LENGTH = 200;

/** Shared toggle button for Show more / Show less actions. */
function NoteToggleButton({ expanded, onClick }: { expanded: boolean; onClick: () => void }) {
  return (
    <Button
      aria-expanded={expanded}
      className="body-sm inline min-h-0 min-w-0 shrink rounded-none border-0 p-0 text-text-secondary underline"
      nativeButton={false}
      onClick={onClick}
      render={<span />}
      variant="text"
    >
      {expanded ? "Show less" : "Show more"}
    </Button>
  );
}

export function WatchlistNoteDisplay({ note }: WatchlistNoteDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = note.length > TRUNCATE_LENGTH;

  return (
    <div className="flex items-start gap-1">
      <IconEdit aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <div className="body-sm min-w-0 flex-1 break-words text-text-secondary">
        {!expanded && (
          <span>
            {isLong ? `${note.slice(0, TRUNCATE_LENGTH).trimEnd()}…` : note}
            {isLong && (
              <>
                {" "}
                <NoteToggleButton expanded={false} onClick={() => setExpanded(true)} />
              </>
            )}
          </span>
        )}

        {expanded && (
          <>
            <span>{note}</span>
            {isLong && (
              <div className="mt-1">
                <NoteToggleButton expanded={true} onClick={() => setExpanded(false)} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
