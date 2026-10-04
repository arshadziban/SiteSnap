// Express app factory, separated from server.js so tests can mount it without binding a port.
import cors from "cors";
import express from "express";
import { settings } from "./config.js";
import { healthRouter } from "./routes/health.js";
import { jobsRouter } from "./routes/jobs.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: settings.corsOriginList,
      credentials: false,
      methods: ["GET", "POST"],
    })
  );

  app.use(healthRouter);
  app.use(jobsRouter);

  app.use((err, req, res, next) => {
    console.error(`Unhandled exception while processing ${req.method} ${req.originalUrl}:`, err);
    res.status(500).json({ detail: "An unexpected server error occurred." });
  });

  return app;
}
