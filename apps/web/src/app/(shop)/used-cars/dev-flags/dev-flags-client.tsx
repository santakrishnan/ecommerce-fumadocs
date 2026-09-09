"use client";

import { useState } from "react";

function setCookie(name: string, value: string): void {
  if (typeof document === "undefined") {
    return;
  }
  // biome-ignore lint/suspicious/noDocumentCookie: dev-only flag override UI requires direct cookie manipulation
  document.cookie = `${name}=${value}; path=/`;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") {
    return;
  }
  // biome-ignore lint/suspicious/noDocumentCookie: dev-only flag override UI requires direct cookie manipulation
  document.cookie = `${name}=; path=/; max-age=0`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") {
    return;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match?.[1];
}

export function DevFlagsClient() {
  const [certification, setCertification] = useState(
    () => getCookie("vercel-flag-override-vdp-certification") ?? "false"
  );
  const [featureCount, setFeatureCount] = useState(
    () => getCookie("vercel-flag-override-vdp-feature-count") ?? "3"
  );
  const [noPhotos, setNoPhotos] = useState(
    () => getCookie("vercel-flag-override-vdp-no-photos") === "true"
  );
  const [forceSold, setForceSold] = useState(
    () => getCookie("vercel-flag-override-vdp-sold") === "true"
  );
  const [saved, setSaved] = useState(false);

  function saveFlags(): void {
    setCookie("vercel-flag-override-vdp-certification", certification);
    setCookie("vercel-flag-override-vdp-feature-count", featureCount);
    setCookie("vercel-flag-override-vdp-no-photos", String(noPhotos));

    if (forceSold) {
      setCookie("vercel-flag-override-vdp-sold", "true");
    } else {
      deleteCookie("vercel-flag-override-vdp-sold");
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function applyFlags(): void {
    saveFlags();
    window.location.href = "/used-cars/details/toyota/highlander/xle/2024/DEMO123";
  }

  function clearFlags(): void {
    deleteCookie("vercel-flag-override-vdp-certification");
    deleteCookie("vercel-flag-override-vdp-feature-count");
    deleteCookie("vercel-flag-override-vdp-no-photos");
    deleteCookie("vercel-flag-override-vdp-sold");
    window.location.href = "/used-cars/details/toyota/highlander/xle/2024/DEMO123";
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8 p-10">
      <h1 className="font-bold text-2xl">VDP Flag Overrides</h1>
      <p className="text-sm text-text-secondary">
        Toggle flags and click Apply to see the VDP in different states.
      </p>

      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Certification</span>
          <select
            className="rounded-md border p-2"
            onChange={(e) => setCertification(e.target.value)}
            value={certification}
          >
            <option value="false">None</option>
            <option value="gold">Gold Certified</option>
            <option value="silver">Silver Certified</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-semibold text-sm">Feature Count</span>
          <select
            className="rounded-md border p-2"
            onChange={(e) => setFeatureCount(e.target.value)}
            value={featureCount}
          >
            <option value="none">None</option>
            <option value="1">1 card</option>
            <option value="2">2 cards</option>
            <option value="3">3 cards</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <input
            checked={noPhotos}
            onChange={(e) => setNoPhotos(e.target.checked)}
            type="checkbox"
          />
          <span className="font-semibold text-sm">No Photos</span>
        </label>

        <hr className="border-divider" />

        <label className="flex items-center gap-2">
          <input
            checked={forceSold}
            onChange={(e) => setForceSold(e.target.checked)}
            type="checkbox"
          />
          <span className="font-semibold text-sm">Force Sold State</span>
        </label>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          className="rounded-full bg-surface-dark px-6 py-3 font-semibold text-sm text-text-inverse"
          onClick={saveFlags}
          type="button"
        >
          Apply
        </button>
        <button
          className="rounded-full border border-divider px-6 py-3 font-semibold text-sm text-text-primary"
          onClick={applyFlags}
          type="button"
        >
          Apply & View VDP
        </button>
        <button
          className="rounded-full border border-divider px-6 py-3 font-semibold text-sm text-text-primary"
          onClick={clearFlags}
          type="button"
        >
          Clear Overrides
        </button>
      </div>

      {saved && (
        <p className="text-green-500 text-xs">✓ Flags saved. Refresh VDP tab to see changes.</p>
      )}
    </div>
  );
}
