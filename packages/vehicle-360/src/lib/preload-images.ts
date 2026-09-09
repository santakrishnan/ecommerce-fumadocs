export interface PreloadProgress {
  failed: number;
  loaded: number;
  total: number;
}

export async function preloadImageBitmaps(
  urls: string[],
  onProgress?: (progress: PreloadProgress) => void,
  concurrency = 12
): Promise<ImageBitmap[]> {
  const results: ImageBitmap[] = new Array(urls.length);
  let loaded = 0;
  let failed = 0;
  let nextIndex = 0;
  let lastReportAt = 0;

  const report = () => {
    const now = Date.now();
    const isComplete = loaded === urls.length;
    if (!isComplete && now - lastReportAt < 120) {
      return;
    }
    lastReportAt = now;
    onProgress?.({ loaded, total: urls.length, failed });
  };

  const worker = async () => {
    while (nextIndex < urls.length) {
      const index = nextIndex;
      nextIndex += 1;

      try {
        const url = urls[index];
        if (url === undefined) {
          break;
        }
        results[index] = await loadImageBitmap(url);
        loaded += 1;
      } catch {
        failed += 1;
        loaded += 1;
      }

      report();
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));

  const denseResults = Array.from({ length: urls.length }, (_, index) => results[index]);
  const valid = denseResults.filter((bitmap): bitmap is ImageBitmap => Boolean(bitmap));
  if (!valid.length) {
    throw new Error("Unable to preload any spin frames");
  }
  const fallback = valid[0] as ImageBitmap;
  return denseResults.map((bitmap, index) => bitmap ?? valid[index % valid.length] ?? fallback);
}

async function loadImageBitmap(url: string): Promise<ImageBitmap> {
  const response = await fetch(url, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  const blob = await response.blob();
  return createImageBitmap(blob);
}
