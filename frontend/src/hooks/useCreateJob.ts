import { useCallback, useState } from "react";
import { createJob } from "../api/jobs";
import { extractErrorMessage } from "../api/client";

interface UseCreateJobResult {
  submit: (urls: string[]) => Promise<string | null>;
  isSubmitting: boolean;
  error: string | null;
}

export function useCreateJob(): UseCreateJobResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (urls: string[]): Promise<string | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { job_id: jobId } = await createJob(urls);
      return jobId;
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to start capture. Please try again."));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submit, isSubmitting, error };
}
