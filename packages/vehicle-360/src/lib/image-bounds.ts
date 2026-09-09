export interface ImageBounds {
  drawHeight: number;
  drawWidth: number;
  offsetX: number;
  offsetY: number;
}

export function getImageBounds(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  cover = false
): ImageBounds {
  const scale = cover
    ? Math.max(canvasWidth / imageWidth, canvasHeight / imageHeight)
    : Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;

  return { offsetX, offsetY, drawWidth, drawHeight };
}

export function normalizedToPixel(
  x: number,
  y: number,
  bounds: ImageBounds
): { left: number; top: number } {
  return {
    left: bounds.offsetX + x * bounds.drawWidth,
    top: bounds.offsetY + y * bounds.drawHeight,
  };
}
