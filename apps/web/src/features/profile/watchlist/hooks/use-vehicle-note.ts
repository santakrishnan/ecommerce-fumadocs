import { useState } from "react";

/**
 * Local-state hook for vehicle notes keyed by VIN.
 *
 * Returns the note for the given VIN and a saveNote function.
 * No persistence — the integration story will swap this for a server call.
 */
export function useVehicleNote(vin: string) {
  const [notes, setNotes] = useState<Record<string, string>>({});

  const note = notes[vin];

  const saveNote = (text: string) => {
    setNotes((prev) => ({ ...prev, [vin]: text }));
  };

  return { note, saveNote };
}
