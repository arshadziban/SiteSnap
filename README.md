# SiteSnap

Turn websites into screenshots, PDFs & PNGs.

SiteSnap lets you enter one or more website URLs, captures a full-page
screenshot and a PDF of each using a real headless browser (Playwright +
Chromium), and lets you download the results individually or as a single
ZIP. No login, no database, no permanent storage.

## Features

- Full-page PNG screenshots of any public website
- PDF generation with backgrounds and print styling
- Automatic split into height-based parts (`part-1`, `part-2`, ...) for long pages, both PNG and PDF, each part downloadable on its own
- Optional `max_height_px` on a job to clip the primary screenshot/PDF to a fixed height instead of the full page
- Best-effort removal of cookie/consent banners and modal popups before capture
- Batch processing of up to `MAX_URLS_PER_JOB` URLs with controlled concurrency
- Paste-to-parse: drop in a block of URLs separated by newlines, commas, or spaces
- "Download All ZIP" for batch jobs, structured by domain
- Live processing status per URL (waiting / processing / completed / failed)
- One failed URL never cancels the rest of the batch
- No accounts, no database — job state lives in memory only
- Temporary files only: generated screenshots/PDFs are deleted after download or after a retention window, whichever comes first
- SSRF protections: only `http`/`https` URLs are accepted, and hostnames resolving to private/internal/loopback IP ranges are rejected

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Lucide React

**Backend:** Node.js 18+, Express, Playwright (Chromium), pdf-lib, sharp, archiver

No database. No cloud storage.

## Local Setup

### Backend

```bash
cd backend
npm install
npx playwright install chromium
npm run dev
```

The API runs at `http://localhost:8000`. Defaults work out of the box;
override any setting by exporting the corresponding environment variable
before starting the server (see [Environment Variables](#environment-variables)).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # optional, defaults work out of the box
npm run dev
```

The app runs at `http://localhost:5173`.

## Environment Variables

### Backend (shell/OS environment variables)

| Variable | Default | Description |
|---|---|---|
| `APP_ENV` | `development` | Environment label |
| `HOST` | `0.0.0.0` | Bind host |
| `PORT` | `8000` | Bind port |
| `MAX_URLS_PER_JOB` | `20` | Max URLs accepted per job |
| `MAX_CONCURRENT_JOBS` | `3` | Max concurrent browser captures |
| `BROWSER_TIMEOUT_MS` | `30000` | Playwright navigation timeout |
| `TEMP_FILE_RETENTION_MINUTES` | `30` | How long unaccessed job files are kept before deletion |
| `TEMP_DIR` | *(unset)* | Override the base temp directory (defaults to the OS temp dir) |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed origins |
| `SPLIT_PART_HEIGHT_PX` | `1000` | Height of each auto-generated part (both PNG and PDF) |
| `MAX_SPLIT_PARTS` | `20` | Hard cap on the number of parts generated per capture |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API base URL |

## API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/jobs` | Create a job: `{"urls": [...], "max_height_px": 1000}` → `{"job_id": "..."}` (`max_height_px` optional) |
| `GET` | `/api/jobs/{job_id}` | Poll job status and per-item results, including a `parts` array per item |
| `GET` | `/api/jobs/{job_id}/items/{item_id}/png` | Stream the full-page screenshot |
| `GET` | `/api/jobs/{job_id}/items/{item_id}/pdf` | Stream the full-page PDF |
| `GET` | `/api/jobs/{job_id}/items/{item_id}/parts/{n}/png` | Stream part `n`'s PNG |
| `GET` | `/api/jobs/{job_id}/items/{item_id}/parts/{n}/pdf` | Stream part `n`'s PDF |
| `GET` | `/api/jobs/{job_id}/download` | Stream a ZIP of all completed results, including each item's parts |

Full request/response schemas are available at `/docs`.

## Testing

```bash
cd backend
npm test
```

Covers URL validation and normalization, SSRF/private-IP rejection,
deduplication, filename sanitization and path-traversal protection, ZIP
structure, job creation/polling via the Express app, and one real
end-to-end Playwright capture against a live website.

## Privacy

SiteSnap does not permanently store your URLs or generated files. Each
job's screenshots, PDFs, and ZIP are written to a temporary directory,
served only through authenticated download endpoints (never as static
files), and deleted after you download them or after the retention
window (`TEMP_FILE_RETENTION_MINUTES`, default 30 minutes) elapses —
whichever comes first. A background sweep also cleans up abandoned jobs.
Job state itself lives in memory and disappears when the server restarts.

## Known Limitations

- Job state is in-memory only — restarting the backend clears all active jobs. This is intentional for the MVP; a future version can move this to Redis/a queue without changing the API surface.
- SSRF protection resolves and checks hostnames at job-creation time; it does not re-validate on redirect targets during navigation.
- Very tall pages are capped (`max_screenshot_height_px`) and fall back to a viewport-only screenshot to bound memory usage.
- A URL that fails DNS/SSRF validation blocks the whole batch from being created rather than failing just that item, since that check happens before a job exists. Errors surfaced during actual page capture (timeouts, crashes, blocked automation) do fail only that item, as required.

## Future Improvements

- Redis/Celery-backed job queue for horizontal scaling
- User accounts and API keys
- Scheduled/recurring screenshots
- Custom viewport sizes and mobile emulation
- Webhooks on job completion
