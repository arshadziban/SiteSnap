// Background cleanup loop for abandoned/expired jobs.
import { jobManager } from "./jobs.js";

const SWEEP_INTERVAL_MS = 60_000;

class CleanupWorker {
  constructor() {
    this._timer = null;
  }

  start() {
    this._timer = setInterval(() => {
      jobManager.sweepExpired().catch((err) => console.error("Cleanup sweep failed:", err));
    }, SWEEP_INTERVAL_MS);
  }

  stop() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}

export const cleanupWorker = new CleanupWorker();
