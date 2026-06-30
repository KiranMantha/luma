let cachedPreviewUrl: string | null | undefined = undefined; // undefined = not yet loaded

export function getCachedPreviewUrl() {
  return cachedPreviewUrl;
}

export function setCachedPreviewUrl(url: string | null) {
  cachedPreviewUrl = url;
}
