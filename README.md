# SiteSnap

Turn websites into full-page screenshots and PDFs.

Enter one or more URLs, and SiteSnap captures each with headless Chromium (Playwright). Download results individually or as a ZIP. No login, no database, no permanent storage.

## Features

- Full-page PNG and PDF capture, with automatic height-based parts (`part-1`, `part-2`, ...) for long pages
- Optional `max_height_px` to clip a capture to a fixed height
- Best-effort removal of cookie banners and popups
- Batch jobs with live per-URL status; one failure never cancels the rest
- Paste URLs separated by newlines, commas, or spaces
- "Download All" ZIP, organized by domain
- SSRF protection: only `http`/`https`, and private/loopback hosts are rejected
- Temporary files only, deleted after download or after the retention window

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js 18+, Express, Playwright, pdf-lib, sharp, archiver


## Limitations

- Job state is in memory; restarting the backend clears active jobs.
- SSRF checks run at job creation and do not cover redirect targets.
- A URL that fails validation rejects the whole batch; capture-time errors fail only that item.
