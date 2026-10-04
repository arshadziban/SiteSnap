import { X } from "lucide-react";
import type { ChangeEvent, ClipboardEvent } from "react";

interface UrlInputRowProps {
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
  onPaste: (index: number, event: ClipboardEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

export default function UrlInputRow({
  index,
  value,
  onChange,
  onPaste,
  onRemove,
  canRemove,
}: UrlInputRowProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(index, event.target.value);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        inputMode="url"
        value={value}
        onChange={handleChange}
        onPaste={(event) => onPaste(index, event)}
        placeholder="https://example.com"
        aria-label={`Website URL ${index + 1}`}
        className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 font-medium text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {canRemove && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label={`Remove URL ${index + 1}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted hover:border-danger hover:text-danger focus:outline-none focus:ring-2 focus:ring-danger/20"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
