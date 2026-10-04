import { AlertCircle, CheckCircle2, Eye, FileText, Image as ImageIcon, Layers } from "lucide-react";
import { useState } from "react";
import DownloadButton from "./DownloadButton";
import type { JobItem } from "../types/job";

interface ResultCardProps {
  item: JobItem;
  onPreview: (item: JobItem) => void;
}

export default function ResultCard({ item, onPreview }: ResultCardProps) {
  const domain = item.domain ?? item.url;
  const [showParts, setShowParts] = useState(false);
  const hasParts = item.parts.length > 1;

  if (item.status === "failed") {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
        <span className="truncate font-medium text-ink">{domain}</span>
        <span className="mt-2 flex items-center gap-1.5 text-sm font-medium text-danger">
          <AlertCircle size={16} aria-hidden="true" />
          Failed
        </span>
        <p className="mt-1 text-sm text-muted">{item.error ?? "Unable to capture this website."}</p>
      </div>
    );
  }

  if (item.status !== "completed" || !item.screenshot_url || !item.pdf_url) {
    return (
      <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
        <span className="truncate font-medium text-ink">{domain}</span>
        <span className="mt-2 text-sm text-muted">Processing...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => onPreview(item)}
        className="group relative block aspect-video w-full overflow-hidden bg-background focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-label={`Preview screenshot of ${domain}`}
      >
        <img
          src={item.screenshot_url}
          alt={`Full-page screenshot of ${domain}`}
          className="h-full w-full object-cover object-top transition-transform group-hover:scale-[1.02]"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-ink/0 opacity-0 transition-opacity group-hover:bg-ink/10 group-hover:opacity-100">
          <span className="rounded-full bg-card/90 p-2 shadow">
            <Eye size={18} className="text-ink" aria-hidden="true" />
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <span className="truncate font-medium text-ink">{domain}</span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-success">
            <CheckCircle2 size={16} aria-hidden="true" />
            Completed
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <DownloadButton
            href={item.screenshot_url}
            filename={`${domain}-screenshot.png`}
            icon={<ImageIcon size={15} aria-hidden="true" />}
            label="PNG"
          />
          <DownloadButton
            href={item.pdf_url}
            filename={`${domain}-screenshot.pdf`}
            icon={<FileText size={15} aria-hidden="true" />}
            label="PDF"
          />
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <Eye size={15} aria-hidden="true" />
            Preview
          </button>
        </div>

        {hasParts && (
          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowParts((prev) => !prev)}
              aria-expanded={showParts}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <Layers size={15} aria-hidden="true" />
              {showParts ? "Hide" : "Show"} {item.parts.length} parts
            </button>

            {showParts && (
              <ul className="mt-3 flex flex-col gap-2">
                {item.parts.map((part) => (
                  <li key={part.index} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted">Part {part.index}</span>
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
