import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface ErrorStateProps {
  title?: string;
  message: string;
}

export default function ErrorState({ title = "Something went wrong", message }: ErrorStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle size={22} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-muted">{message}</p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
      >
        Try again
      </Link>
    </div>
  );
}
