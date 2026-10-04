import { FileText, Layers, ShieldCheck, Zap } from "lucide-react";
import UrlInput from "./UrlInput";

interface HeroProps {
  onSubmit: (urls: string[]) => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

const FEATURES = [
  { icon: Zap, title: "Full-page capture", text: "Pixel-accurate screenshots from a real browser." },
  { icon: FileText, title: "PNG & PDF", text: "Download both formats for every site." },
  { icon: Layers, title: "Batch & parts", text: "Many URLs at once, long pages split into parts." },
];

export default function Hero({ onSubmit, isSubmitting, errorMessage }: HeroProps) {
  return (
    <section className="mx-auto max-w-4xl px-4 pb-20 pt-14 text-center sm:px-6 sm:pt-20">
      <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-sm font-semibold text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
        Website screenshot tool
      </span>
      <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink sm:text-6xl sm:leading-[1.05]">
        Turn websites into{" "}
        <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
          screenshots, PDFs &amp; PNGs
        </span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base font-medium text-muted sm:text-lg">
        Capture one website or process multiple URLs at once.
      </p>

      <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-border bg-card p-5 text-left shadow-card sm:p-7">
        <UrlInput onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </div>

      {errorMessage && (
        <p role="alert" className="mt-4 text-sm font-semibold text-danger">
          {errorMessage}
        </p>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted">
        <ShieldCheck size={16} className="shrink-0 text-success" aria-hidden="true" />
        <span>Your files are temporarily processed and automatically deleted.</span>
      </div>

      <ul className="mt-14 grid gap-4 text-left sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-xl border border-border bg-card/70 p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon size={18} aria-hidden="true" />
            </span>
            <h3 className="mt-3 font-bold text-ink">{title}</h3>
            <p className="mt-1 text-sm font-medium text-muted">{text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
