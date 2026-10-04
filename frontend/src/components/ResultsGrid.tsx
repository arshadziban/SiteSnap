import { useState } from "react";
import { Download, Images } from "lucide-react";
import ResultCard from "./ResultCard";
import PreviewModal from "./PreviewModal";
import DownloadButton from "./DownloadButton";
import type { Job, JobItem } from "../types/job";
import { firstPartsZipDownloadUrl, zipDownloadUrl } from "../api/jobs";

interface ResultsGridProps {
  job: Job;
}

export default function ResultsGrid({ job }: ResultsGridProps) {
  const [previewItem, setPreviewItem] = useState<JobItem | null>(null);
  const hasMultipleCompleted = job.items.filter((i) => i.status === "completed").length > 1;
  const hasFirstParts = job.items.some((i) => i.status === "completed" && i.parts.length > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Capture Complete</h1>
          <p className="mt-1 text-muted">
            {job.total} website{job.total === 1 ? "" : "s"} processed
            {job.failed > 0 ? ` · ${job.completed} successful · ${job.failed} failed` : ` · ${job.completed} successful`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasFirstParts && (
            <DownloadButton
              href={firstPartsZipDownloadUrl(job.job_id)}
              filename="sitesnap-first-parts.zip"
              icon={<Images size={16} aria-hidden="true" />}
              label="Download First Parts ZIP"
              variant="secondary"
            />
          )}
          {hasMultipleCompleted && (
            <DownloadButton
              href={zipDownloadUrl(job.job_id)}
              filename="sitesnap-export.zip"
              icon={<Download size={16} aria-hidden="true" />}
              label="Download All ZIP"
              variant="primary"
            />
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {job.items.map((item) => (
          <ResultCard key={item.id} item={item} onPreview={setPreviewItem} />
        ))}
      </div>

      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
}
