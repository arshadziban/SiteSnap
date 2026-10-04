export type JobStatus = "pending" | "processing" | "completed" | "failed";

export type ItemStatus = "waiting" | "processing" | "completed" | "failed";

export interface JobItemPart {
  index: number;
  png_url: string;
  pdf_url: string;
}

export interface JobItem {
  id: string;
  url: string;
  status: ItemStatus;
  domain?: string;
  screenshot_url?: string;
  pdf_url?: string;
  parts: JobItemPart[];
  error?: string;
}

export interface Job {
  job_id: string;
  status: JobStatus;
  total: number;
  completed: number;
  failed: number;
  items: JobItem[];
}

export interface ApiError {
  detail: string;
}
