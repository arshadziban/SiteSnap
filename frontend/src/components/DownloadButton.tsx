import type { ReactNode } from "react";

interface DownloadButtonProps {
  href: string;
  filename: string;
  icon: ReactNode;
  label: string;
  variant?: "primary" | "secondary";
}

export default function DownloadButton({
  href,
  filename,
  icon,
  label,
  variant = "secondary",
}: DownloadButtonProps) {
  const baseClass =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2";
  const variantClass =
    variant === "primary"
      ? "bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary-hover focus:ring-primary/30"
      : "border border-primary/30 bg-card text-primary hover:bg-primary/5 focus:ring-primary/20";

  return (
    <a href={href} download={filename} className={`${baseClass} ${variantClass}`}>
      {icon}
      {label}
    </a>
  );
}
