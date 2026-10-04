import { CheckCircle2, CircleDashed, Loader2, XCircle } from "lucide-react";
import type { JobItem } from "../types/job";

const STATUS_CONFIG: Record<
  JobItem["status"],
  { label: string; icon: JSX.Element; textClass: string }
> = {
  waiting: {
    label: "Waiting",
    icon: <CircleDashed size={16} aria-hidden="true" />,
    textClass: "text-muted",
  },
  processing: {
    label: "Processing",
    icon: <Loader2 size={16} className="animate-spin" aria-hidden="true" />,
    textClass: "text-primary",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 size={16} aria-hidden="true" />,
    textClass: "text-success",
  },
  failed: {
    label: "Failed",
    icon: <XCircle size={16} aria-hidden="true" />,
    textClass: "text-danger",
  },
};

interface ProgressCardProps {
  item: JobItem;
}

export default function ProgressCard({ item }: ProgressCardProps) {
  const config = STATUS_CONFIG[item.status];
  const domain = item.domain ?? item.url;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="truncate font-medium text-ink">{domain}</span>
        <span className={`flex items-center gap-1.5 text-sm font-medium ${config.textClass}`}>
          {config.icon}
          {config.label}
        </span>
      </div>
      {item.status === "processing" && (
        <p className="mt-1 text-sm text-muted">Capturing screenshot...</p>
      )}
      {item.status === "failed" && item.error && (
        <p className="mt-1 text-sm text-danger">{item.error}</p>
      )}
    </div>
  );
}
