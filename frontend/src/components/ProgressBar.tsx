interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  tone?: "primary" | "success" | "danger";
  /** Show a sliding bar when real progress isn't known (e.g. a capture in flight). */
  indeterminate?: boolean;
  size?: "sm" | "md";
}

const TONE_CLASS: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  danger: "bg-danger",
};

export default function ProgressBar({
  value,
  label = "Progress",
  tone = "primary",
  indeterminate = false,
  size = "md",
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : pct}
      className={`${height} w-full overflow-hidden rounded-full bg-border`}
    >
      {indeterminate ? (
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <span className={`absolute inset-y-0 left-0 w-1/3 animate-shimmer rounded-full ${TONE_CLASS[tone]}`} />
        </div>
      ) : (
        <div
          className={`h-full rounded-full ${TONE_CLASS[tone]} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      )}
    </div>
  );
}
