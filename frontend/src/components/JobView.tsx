import { CheckCircle2, Download, Images, Loader2, XCircle } from "lucide-react";
import { useState } from "react";
import DownloadButton from "./DownloadButton";
import JobCard from "./JobCard";
import PreviewModal from "./PreviewModal";
import ProgressBar from "./ProgressBar";
import type { Job, JobItem } from "../types/job";
import { firstPartsZipDownloadUrl, zipDownloadUrl } from "../api/jobs";

interface JobViewProps {
  job: Job;
}

function StatCard({ value, label, className }: { value: number; label: string; className: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}>
      <p className="text-4xl font-extrabold tabular-nums">{value}</p>
      <p className="mt-1 text-lg font-semibold">{label}</p>
    </div>
  );
}

export default function JobView({ job }: JobViewProps) {
  const [previewItem, setPreviewItem] = useState<JobItem | null>(null);

  const finished = job.status === "completed" || job.status === "failed";
  const done = job.completed + job.failed;
  const percent = job.total > 0 ? (done / job.total) * 100 : 0;
  const processing = job.items.filter((i) => i.status === "processing").length;
  const isSingle = job.completed === 1;
  const firstPartItems = job.items.filter((i) => i.status === "completed" && i.parts.length > 0);
  const hasFirstParts = firstPartItems.length > 0;
  // With a single site, "first part" downloads the PNG itself rather than a ZIP.
  const singleFirstPart = isSingle && hasFirstParts ? firstPartItems[0].parts[0] : null;
  const singleDomain = firstPartItems[0]?.domain ?? firstPartItems[0]?.url ?? "website";

  let badge: JSX.Element;
  if (!finished) {
    badge = (
      <span className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary">
        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
        Capture in progress
      </span>
    );
  } else if (job.failed === 0) {
    badge = (
      <span className="inline-flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-4 py-2.5 text-sm font-semibold text-success">
        <CheckCircle2 size={18} aria-hidden="true" />
        All websites captured successfully
      </span>
    );
  } else {
    badge = (
      <span className="inline-flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/10 px-4 py-2.5 text-sm font-semibold text-danger">
        <XCircle size={18} aria-hidden="true" />
        {job.failed} of {job.total} failed
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl font-extrabold tracking-tight text-ink">
            {finished ? "Capture complete" : "Capturing websites"}
          </h1>
          <p className="mt-1 text-lg font-medium text-muted">
            {finished
              ? `${job.total} website${job.total === 1 ? "" : "s"} processed.`
              : "This can take a little while: each page is loaded, scrolled and captured."}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1">
              <ProgressBar value={percent} tone={finished && job.failed > 0 ? "danger" : "primary"} label="Overall capture progress" />
            </div>
            <span className="w-14 text-right text-xl font-extrabold tabular-nums text-ink">
              {Math.round(percent)}%
            </span>
          </div>
          <p className="mt-2 text-base font-semibold text-muted">
            {done} of {job.total} completed
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-80">
          {badge}
          {finished && job.completed > 0 && (
            <DownloadButton
              href={zipDownloadUrl(job.job_id)}
              filename="sitesnap-export.zip"
              icon={<Download size={18} aria-hidden="true" />}
              label="Download All ZIP"
              variant="primary"
            />
          )}
          {finished && hasFirstParts && (
            singleFirstPart ? (
              <DownloadButton
                href={singleFirstPart.png_url}
                filename={`${singleDomain}-part-1.png`}
                icon={<Images size={18} aria-hidden="true" />}
                label="Download First Part (PNG)"
              />
            ) : (
              <DownloadButton
                href={firstPartsZipDownloadUrl(job.job_id)}
                filename="sitesnap-first-parts.zip"
                icon={<Images size={18} aria-hidden="true" />}
                label="Download First Parts ZIP"
              />
            )
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard value={job.completed} label="Completed" className="border-success/20 bg-success/10 text-success" />
        <StatCard value={processing} label="Processing" className="border-primary/20 bg-primary/10 text-primary" />
        <StatCard value={job.failed} label="Failed" className="border-danger/20 bg-danger/10 text-danger" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {job.items.map((item) => (
          <JobCard key={item.id} item={item} onPreview={setPreviewItem} />
        ))}
      </div>

      {previewItem && <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />}
    </div>
  );
}
