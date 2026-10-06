// Freeze background videos on a "finished" frame before capture.
//
// Hero sections often use an autoplaying, looping video with captions burned into
// the footage that type out letter by letter ("Pre" -> "Predictive analytics").
// That text is not in the DOM, so the only way to get it whole is to pick the
// right frame. Captions type in, hold, then erase before the next scene, so this pass:
//   1. pauses each visible background video;
//   2. samples frames from the start until the first scene cut: a frame-to-frame
//      jump that follows a held stretch (so an opening fade-in doesn't count);
//   3. seeks to the frame of that first scene with the most near-white pixels,
//      i.e. the one showing the most caption text.
// Pausing also keeps the PNG, the PDF and the parts on the same frame.
// Best-effort only, with its own time budget.

import sharp from "sharp";

const SAMPLE_STEP_S = 0.25;
const SAMPLE_WINDOW_S = 10;
// Diffs are mean absolute gray-level differences (0-255). Darkening overlays on
// hero videos keep real cuts low (~10), so a cut is judged relative to the held
// stretch before it rather than by a fixed level alone.
const CUT_MIN_DIFF = 6;
const CUT_RATIO = 4;
const HELD_SAMPLES = 4;
const BRIGHT_LEVEL = 200;
const SEEK_TIMEOUT_MS = 2000;
const MAX_VIDEOS = 3;
const BUDGET_MS = 8000;

// Runs in the page: tag large, playable, non-interactive videos and return their boxes.
function findBackgroundVideosInPage(maxVideos) {
  const found = [];
  document.querySelectorAll("video").forEach((v) => {
    if (found.length >= maxVideos) return;
    if (v.controls || !v.currentSrc || !Number.isFinite(v.duration) || v.duration <= 0) return;
    const r = v.getBoundingClientRect();
    if (r.width < 300 || r.height < 150) return;
    v.dataset.ssVideo = String(found.length);
    found.push({
      index: found.length,
      duration: v.duration,
      box: { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height },
    });
  });
  return found;
}

async function seek(page, index, time) {
  await page.evaluate(
    ({ index, time, timeoutMs }) =>
      new Promise((resolve) => {
        const v = document.querySelector(`video[data-ss-video="${index}"]`);
        if (!v) return resolve();
        v.pause();
        const timer = setTimeout(resolve, timeoutMs);
        v.addEventListener("seeked", () => { clearTimeout(timer); resolve(); }, { once: true });
        v.currentTime = time;
      }),
    { index, time, timeoutMs: SEEK_TIMEOUT_MS }
  );
}

// Returns a tiny thumbnail for cut detection and a near-white pixel count for text.
async function sampleFrame(page, box) {
  const png = await page.screenshot({ clip: box, fullPage: true });
  const gray = sharp(png).grayscale();
  const [thumb, detail] = await Promise.all([
    gray.clone().resize(64, 36, { fit: "fill" }).raw().toBuffer(),
    gray.clone().resize(320, 180, { fit: "fill" }).raw().toBuffer(),
  ]);
  let bright = 0;
  for (const level of detail) if (level >= BRIGHT_LEVEL) bright++;
  return { thumb, bright };
}

function meanDiff(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

async function freezeVideo(page, video, deadline) {
  const end = Math.min(video.duration, SAMPLE_WINDOW_S);
  const recent = [];
  let prev = null;
  let best = { time: 0, bright: -1 };

  for (let t = 0; t <= end && Date.now() < deadline; t += SAMPLE_STEP_S) {
    await seek(page, video.index, t);
    const { thumb, bright } = await sampleFrame(page, video.box);
    if (prev) {
      const diff = meanDiff(prev, thumb);
      const held = recent.length >= HELD_SAMPLES && recent.every((d) => d * CUT_RATIO < diff);
      if (diff >= CUT_MIN_DIFF && held) break; // next scene starts here
      recent.push(diff);
      if (recent.length > HELD_SAMPLES) recent.shift();
    }
    if (bright > best.bright) best = { time: t, bright };
    prev = thumb;
  }

  await seek(page, video.index, best.time);
}

export async function freezeBackgroundVideos(page) {
  const deadline = Date.now() + BUDGET_MS;
  try {
    const videos = await page.evaluate(findBackgroundVideosInPage, MAX_VIDEOS);
    for (const video of videos) {
      if (Date.now() >= deadline) break;
      await freezeVideo(page, video, deadline);
    }
  } catch {
    // best-effort only; never fail the capture
  }
}
