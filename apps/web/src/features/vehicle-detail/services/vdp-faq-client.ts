import type { VdpSearchFaqApiResponse } from "../bff/contracts/vdp-search-faq.schema";

/**
 * Client-side fetch for VDP FAQ answers.
 *
 * Calls `GET /api/v1/vdp/{vin}?question={encoded}` and returns
 * the typed BFF response. Throws on HTTP or network errors.
 */
export async function fetchVdpFaq(
  vin: string,
  question: string,
  signal?: AbortSignal
): Promise<VdpSearchFaqApiResponse> {
  const url = `/api/v1/vdp/${encodeURIComponent(vin)}?question=${encodeURIComponent(question)}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      (body as { error?: { message?: string } })?.error?.message ?? response.statusText;
    throw new Error(message);
  }

  const res = (await response.json()) as VdpSearchFaqApiResponse;
  if (!res.data?.answer) {
    throw new Error("[fetchVdpFaq] unexpected BFF response shape");
  }
  return res;
}
