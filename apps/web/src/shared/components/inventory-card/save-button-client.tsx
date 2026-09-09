"use client";

import dynamic from "next/dynamic";
/**
 * SaveButtonClient — client-only dynamic wrapper for SaveButton.
 *
 * SaveButton calls useLiveQuery (TanStack DB / IDB) which has no server
 * snapshot and cannot run during SSR prerendering. This wrapper is a Client
 * Component so next/dynamic with ssr:false is permitted here. All Server
 * Components that need the save button import from this file instead.
 */
import type { ComponentType } from "react";
import type { SaveButtonProps } from "./save-button";

export const SaveButtonClient: ComponentType<SaveButtonProps> = dynamic(
  () => import("./save-button").then((m) => ({ default: m.SaveButton })),
  { ssr: false }
);
