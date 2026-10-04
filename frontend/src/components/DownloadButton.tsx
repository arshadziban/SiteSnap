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
    "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2";
  const variantClass =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-hover focus:ring-primary/20"
      : "border border-border text-ink hover:bg-background focus:ring-primary/20";

  return (
    <a href={href} download={filename} className={`${baseClass} ${variantClass}`}>
      {icon}
      {label}
    </a>
  );
}
