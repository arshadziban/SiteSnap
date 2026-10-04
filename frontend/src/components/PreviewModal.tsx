import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { JobItem } from "../types/job";

interface PreviewModalProps {
  item: JobItem;
  onClose: () => void;
}

export default function PreviewModal({ item, onClose }: PreviewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const domain = item.domain ?? item.url;

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${domain}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-card shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="truncate font-medium text-ink">{domain}</span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-background hover:text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-auto bg-background p-4">
          {item.screenshot_url && (
            <img
              src={item.screenshot_url}
              alt={`Full-page screenshot of ${domain}`}
              className="mx-auto max-w-full rounded-lg border border-border shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
