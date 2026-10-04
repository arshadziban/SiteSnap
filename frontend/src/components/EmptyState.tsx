import { ImageOff } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted">
        <ImageOff size={22} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink">Capture your first website</h2>
      <p className="mt-1 text-muted">Paste a URL above to get started.</p>
    </div>
  );
}
