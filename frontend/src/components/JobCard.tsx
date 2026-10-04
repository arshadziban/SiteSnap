import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import DownloadButton from "./DownloadButton";
import ProgressBar from "./ProgressBar";
import type { JobItem } from "../types/job";

const STATUS_CONFIG: Record<
  JobItem["status"],
  { label: string; icon: JSX.Element; pillClass: string }
> = {
  waiting: {
    label: "Waiting",
    icon: <CircleDashed size={15} aria-hidden="true" />,
    pillClass: "border-border bg-background text-muted",
  },
  processing: {
    label: "Capturing...",
    icon: <Loader2 size={15} className="animate-spin" aria-hidden="true" />,
    pillClass: "border-primary/20 bg-primary/10 text-primary",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 size={15} aria-hidden="true" />,
    pillClass: "border-success/20 bg-success/10 text-success",
  },
  failed: {
    label: "Failed",
    icon: <AlertCircle size={15} aria-hidden="true" />,
    pillClass: "border-danger/20 bg-danger/10 text-danger",
  },
};

interface JobCardProps {
  item: JobItem;
  onPreview: (item: JobItem) => void;
}

export default function JobCard({ item, onPreview }: JobCardProps) {
  const [showParts, setShowParts] = useState(false);
  const domain = item.domain ?? item.url;
  const status = STATUS_CONFIG[item.status];
  const isDone = item.status === "completed" && !!item.screenshot_url && !!item.pdf_url;
  const hasParts = item.parts.length > 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="p-3 pb-0">
        {isDone ? (
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="group relative block aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label={`Preview screenshot of ${domain}`}
          >
            <img
              src={item.screenshot_url}
              alt={`Full-page screenshot of ${domain}`}
              className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          </button>
        ) : (
          <div
            className={`flex aspect-[16/10] w-full items-center justify-center rounded-xl border border-dashed border-border bg-background ${
              item.status === "processing" ? "animate-pulse" : ""
            }`}
          >
            {item.status === "failed" ? (
              <AlertCircle size={28} className="text-danger/70" aria-hidden="true" />
            ) : (
              <Globe size={28} className="text-muted/50" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-ink">{domain}</p>
            <p className="truncate text-sm font-medium text-muted">{item.url}</p>
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${status.pillClass}`}
          >
            {status.icon}
            {status.label}
          </span>
        </div>

        {item.status === "processing" && (
          <ProgressBar value={0} indeterminate label={`Capturing ${domain}`} size="sm" />
        )}
        {item.status === "completed" && <ProgressBar value={100} tone="success" label={`${domain} complete`} size="sm" />}
        {item.status === "failed" && <ProgressBar value={100} tone="danger" label={`${domain} failed`} size="sm" />}
        {item.status === "waiting" && <ProgressBar value={0} label={`${domain} waiting`} size="sm" />}

        {item.status === "failed" && (
          <p className="text-sm font-medium text-danger">{item.error ?? "Unable to capture this website."}</p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onPreview(item)}
            disabled={!isDone}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eye size={15} aria-hidden="true" />
            Preview
          </button>
          {isDone ? (
            <>
              <DownloadButton
                href={item.screenshot_url!}
                filename={`${domain}-screenshot.png`}
                icon={<ImageIcon size={15} aria-hidden="true" />}
                label="PNG"
              />
              <DownloadButton
                href={item.pdf_url!}
                filename={`${domain}-screenshot.pdf`}
                icon={<FileText size={15} aria-hidden="true" />}
                label="PDF"
              />
            </>
          ) : (
            <>
              <span className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted opacity-40">
                <ImageIcon size={15} aria-hidden="true" />
                PNG
              </span>
              <span className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted opacity-40">
                <FileText size={15} aria-hidden="true" />
                PDF
              </span>
            </>
          )}
        </div>

        {isDone && hasParts && (
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowParts((prev) => !prev)}
              aria-expanded={showParts}
              className="flex w-full items-center justify-between text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <span>
                {item.parts.length} part{item.parts.length === 1 ? "" : "s"}
              </span>
              <ChevronDown
                size={18}
                className={`text-muted transition-transform ${showParts ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>

            {showParts && (
              <ul className="mt-3 flex flex-col gap-2">
                {item.parts.map((part) => (
                  <li key={part.index} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-muted">Part {part.index}</span>
                    <div className="flex gap-2">
                      <DownloadButton
                        href={part.png_url}
                        filename={`${domain}-part-${part.index}.png`}
                        icon={<ImageIcon size={13} aria-hidden="true" />}
                        label="PNG"
                      />
                      <DownloadButton
                        href={part.pdf_url}
                        filename={`${domain}-part-${part.index}.pdf`}
                        icon={<FileText size={13} aria-hidden="true" />}
                        label="PDF"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
