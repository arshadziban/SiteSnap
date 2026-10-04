import { ShieldCheck } from "lucide-react";
import UrlInput from "./UrlInput";

interface HeroProps {
  onSubmit: (urls: string[]) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export default function Hero({ onSubmit, isSubmitting, errorMessage }: HeroProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-5xl">
        Turn websites into screenshots, PDFs &amp; PNGs
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
        Capture one website or process multiple URLs at once.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-card p-5 text-left shadow-sm sm:p-6">
        <UrlInput onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </div>

      {errorMessage && (
        <p role="alert" className="mt-4 text-sm font-medium text-danger">
          {errorMessage}
        </p>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
        <ShieldCheck size={16} className="shrink-0 text-success" aria-hidden="true" />
        <span>Your files are temporarily processed and automatically deleted.</span>
      </div>
    </section>
  );
}
