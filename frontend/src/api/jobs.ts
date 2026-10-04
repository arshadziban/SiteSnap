import { apiClient, API_BASE_URL } from "./client";
import type { Job } from "../types/job";

function toAbsoluteUrl(path?: string): string | undefined {
  if (!path) return path;
  return path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
}

function resolveJobUrls(job: Job): Job {
  return {
    ...job,
    items: job.items.map((item) => ({
      ...item,
      screenshot_url: toAbsoluteUrl(item.screenshot_url),
      pdf_url: toAbsoluteUrl(item.pdf_url),
      parts: item.parts.map((part) => ({
        ...part,
        png_url: toAbsoluteUrl(part.png_url)!,
        pdf_url: toAbsoluteUrl(part.pdf_url)!,
      })),
    })),
  };
}

export async function createJob(urls: string[], maxHeightPx?: number): Promise<{ job_id: string }> {
  const response = await apiClient.post<{ job_id: string }>("/api/jobs", {
    urls,
    max_height_px: maxHeightPx,
  });
  return response.data;
}

export async function getJob(jobId: string): Promise<Job> {
  const response = await apiClient.get<Job>(`/api/jobs/${jobId}`);
  return resolveJobUrls(response.data);
}

export function zipDownloadUrl(jobId: string): string {
  return `${API_BASE_URL}/api/jobs/${jobId}/download`;
}
