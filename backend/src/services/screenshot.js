// Full-page screenshot capture.
import { settings } from "../config.js";

export async function getPageDimensions(page) {
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  }));
  return [dimensions.width || 0, dimensions.height || 0];
}

/**
 * Capture a full-page PNG screenshot.
 *
 * If `maxHeightPx` is given, the screenshot is clipped to that height from the
 * top of the page instead of capturing the full page. Otherwise, guards against
 * excessively tall pages using the configured server-side limit.
 */
export async function captureFullPageScreenshot(page, outputPath, maxHeightPx = null) {
  const [width, height] = await getPageDimensions(page);

  if (maxHeightPx !== null && maxHeightPx !== undefined) {
    const clipHeight = Math.min(height, maxHeightPx) || maxHeightPx;
    await page.screenshot({
      path: outputPath,
      fullPage: true,
      clip: { x: 0, y: 0, width, height: clipHeight },
    });
    return;
  }

  if (height > settings.maxScreenshotHeightPx) {
    console.warn(`Page height ${height} exceeds limit; capturing viewport-clamped screenshot.`);
    await page.screenshot({ path: outputPath, fullPage: false });
    return;
  }

  await page.screenshot({ path: outputPath, fullPage: true });
}

/**
 * Split the full page into successive vertical bands, each exactly `partHeightPx` tall.
 *
 * Produces `part-1.png`, `part-2.png`, ... covering the page top to bottom. Every
 * part is a full `partHeightPx` tall: if the page height isn't an exact multiple
 * of `partHeightPx`, the final part's crop window is shifted up so it still ends
 * exactly at the bottom of the page (it may overlap the previous part slightly)
 * instead of being padded or left shorter.
 */
export async function captureScreenshotParts(page, outputDir, partHeightPx, maxParts) {
  const [width, height] = await getPageDimensions(page);
  if (width <= 0 || height <= 0) {
    throw new Error("Page has no visible content to capture.");
  }

  let partCount;
  if (height <= partHeightPx) {
    partCount = 1;
  } else {
    partCount = Math.min(Math.ceil(height / partHeightPx), maxParts);
  }

  const paths = [];

  for (let index = 0; index < partCount; index++) {
    let top = index * partHeightPx;
    const clipHeight = Math.min(partHeightPx, height);
    if (top + clipHeight > height) {
      top = Math.max(0, height - clipHeight);
    }

    const partPath = `${outputDir}/part-${index + 1}.png`;
    await page.screenshot({
      path: partPath,
      fullPage: true,
      clip: { x: 0, y: top, width, height: clipHeight },
    });
    paths.push(partPath);
  }

  return paths;
}
