import { Plus } from "lucide-react";
import { useState, type ClipboardEvent, type FormEvent } from "react";
import UrlInputRow from "./UrlInputRow";
import { dedupeUrls, splitRawInput } from "../utils/urls";

const MAX_URLS_PER_JOB = Number(import.meta.env.VITE_MAX_URLS_PER_JOB ?? 20);

interface UrlInputProps {
  onSubmit: (urls: string[]) => void;
  isSubmitting: boolean;
}

export default function UrlInput({ onSubmit, isSubmitting }: UrlInputProps) {
  const [urls, setUrls] = useState<string[]>([""]);
  const [limitMessage, setLimitMessage] = useState<string | null>(null);

  const applyUrls = (next: string[]) => {
    if (next.length > MAX_URLS_PER_JOB) {
      setLimitMessage(`You can process up to ${MAX_URLS_PER_JOB} websites at a time.`);
      setUrls(next.slice(0, MAX_URLS_PER_JOB));
    } else {
      setLimitMessage(null);
      setUrls(next);
    }
  };

  const handleChange = (index: number, value: string) => {
    const pastedMultiple = splitRawInput(value);
    if (pastedMultiple.length > 1) {
      const next = dedupeUrls([...urls.slice(0, index), ...pastedMultiple, ...urls.slice(index + 1)]);
      applyUrls(next.length > 0 ? next : [""]);
      return;
    }
    const next = [...urls];
    next[index] = value;
    setUrls(next);
  };

  const handlePaste = (index: number, event: ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text");
    const parts = splitRawInput(text);
    if (parts.length > 1) {
      event.preventDefault();
      const next = dedupeUrls([...urls.slice(0, index), ...parts, ...urls.slice(index + 1)]);
      applyUrls(next.length > 0 ? next : [""]);
    }
  };

  const handleAddRow = () => {
    if (urls.length >= MAX_URLS_PER_JOB) {
      setLimitMessage(`You can process up to ${MAX_URLS_PER_JOB} websites at a time.`);
      return;
    }
    setUrls([...urls, ""]);
  };

  const handleRemove = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
    setLimitMessage(null);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const cleaned = dedupeUrls(urls.map((u) => u.trim()).filter(Boolean));
    if (cleaned.length === 0) return;
    if (cleaned.length > MAX_URLS_PER_JOB) {
      setLimitMessage(`You can process up to ${MAX_URLS_PER_JOB} websites at a time.`);
      return;
    }
    onSubmit(cleaned);
  };

  const hasAnyValue = urls.some((u) => u.trim().length > 0);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3">
        {urls.map((url, index) => (
          <UrlInputRow
            key={index}
            index={index}
            value={url}
            onChange={handleChange}
            onPaste={handlePaste}
            onRemove={handleRemove}
            canRemove={urls.length > 1}
          />
        ))}
      </div>

      {limitMessage && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {limitMessage}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <Plus size={16} aria-hidden="true" />
          Add another URL
        </button>

        <button
          type="submit"
          disabled={!hasAnyValue || isSubmitting}
          className="w-full rounded-xl bg-primary px-7 py-3 text-base font-bold text-white shadow-md shadow-primary/25 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSubmitting ? "Starting capture..." : "Capture Websites"}
        </button>
      </div>
    </form>
  );
}
