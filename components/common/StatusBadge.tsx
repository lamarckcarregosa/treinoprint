type StatusVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

type StatusBadgeProps = {
  label: string;
  variant?: StatusVariant;
  className?: string;
};

const variantClasses: Record<StatusVariant, string> = {
  default: "bg-black text-white",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-700",
  neutral: "bg-zinc-100 text-zinc-700",
};

export default function StatusBadge({
  label,
  variant = "default",
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {label}
    </span>
  );
}