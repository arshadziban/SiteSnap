import ProgressCard from "./ProgressCard";
import type { Job } from "../types/job";

interface ProcessingViewProps {
  job: Job;
}

export default function ProcessingView({ job }: ProcessingViewProps) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Capturing websites...</h1>
      <p className="mt-1 text-muted">
        {job.total} website{job.total === 1 ? "" : "s"} in queue
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {job.items.map((item) => (
          <ProgressCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
