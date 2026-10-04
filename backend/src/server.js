// SiteSnap Express application entrypoint.
import { createApp } from "./app.js";
import { settings } from "./config.js";
import { browserManager } from "./services/browser.js";
import { cleanupWorker } from "./services/cleanup.js";

const app = createApp();

async function main() {
  await browserManager.start();
  cleanupWorker.start();
  console.log("SiteSnap backend ready.");

  const server = app.listen(settings.port, settings.host, () => {
    console.log(`Listening on http://${settings.host}:${settings.port}`);
  });

  const shutdown = async () => {
    server.close();
    cleanupWorker.stop();
    await browserManager.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start SiteSnap backend:", err);
  process.exit(1);
});
