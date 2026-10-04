import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import ErrorState from "../components/ErrorState";
import ProcessingView from "../components/ProcessingView";
import ResultsGrid from "../components/ResultsGrid";
import { useJobStatus } from "../hooks/useJobStatus";

export default function Job() {
  const { jobId } = useParams<{ jobId: string }>();
  const { job, error, isLoading } = useJobStatus(jobId);

  if (error) {
    return (
      <ErrorState
        title="We couldn't load this job"
        message={error}
      />
    );
  }

  if (isLoading || !job) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-24 text-center">
        <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
        <p className="mt-4 text-muted">Loading job status...</p>
      </div>
    );
  }

  if (job.status === "pending" || job.status === "processing") {
    return <ProcessingView job={job} />;
  }

  if (job.completed === 0 && job.failed > 0) {
    return (
      <ErrorState
        title="We couldn't capture these websites."
        message="Try checking the URLs and try again."
      />
    );
  }

  return <ResultsGrid job={job} />;
}
