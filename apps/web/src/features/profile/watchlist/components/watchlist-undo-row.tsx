"use client";

import { Button, Card } from "@ucmp/ui";
import Image from "next/image";
import { useRef } from "react";

export interface WatchlistUndoRowProps {
  imageAlt: string;
  imageSrc: string;
  listName: string;
  onUndo: () => void;
  title: string;
}

/** Inline undo row — replaces a removed card's slot. Auto-dismisses via parent timer. */
export function WatchlistUndoRow({
  imageAlt,
  imageSrc,
  listName,
  onUndo,
  title,
}: WatchlistUndoRowProps) {
  const undoRef = useRef<HTMLButtonElement>(null);

  const handleUndo = () => {
    onUndo();
  };

  return (
    <section
      aria-label={`${title} was removed. Press Undo to restore.`}
      className="grid grid-cols-4 items-center gap-4 md:grid-cols-8 md:gap-2"
      data-slot="watchlist-undo-row"
    >
      <Card className="relative col-span-1 aspect-[85/106] overflow-clip p-0 md:aspect-[11/13]">
        <Image
          alt={imageAlt}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 25vw, 12vw"
          src={imageSrc}
        />
      </Card>

      <div className="col-span-3 flex flex-col items-start gap-4 md:col-span-7 md:ml-6 md:flex-row md:items-center md:gap-8">
        <p className="body-lg flex-1 text-text-primary">
          {title} was removed from your {listName}.
        </p>

        <Button onClick={handleUndo} ref={undoRef} size="sm" variant="tertiary">
          Undo
        </Button>
      </div>
    </section>
  );
}
