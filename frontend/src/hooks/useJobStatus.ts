import { useEffect, useRef, useState } from "react";
import { getJob } from "../api/jobs";
import { extractErrorMessage } from "../api/client";
import type { Job } from "../types/job";

const POLL_INTERVAL_MS = 1500;

interface UseJobStatusResult {
  job: Job | null;
  error: string | null;
  isLoading: boolean;
}

export function useJobStatus(jobId: string | undefined): UseJobStatusResult {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setJob(null);

    const poll = async () => {
      try {
        const data = await getJob(jobId);
        if (cancelled) return;
        setJob(data);
        setIsLoading(false);
        if (data.status === "pending" || data.status === "processing") {
          timeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (cancelled) return;
        setError(extractErrorMessage(err, "Failed to load job status."));
        setIsLoading(false);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [jobId]);

  return { job, error, isLoading };
}
