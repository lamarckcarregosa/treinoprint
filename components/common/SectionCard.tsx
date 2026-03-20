import { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  rightContent?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function SectionCard({
  title,
  rightContent,
  children,
  className = "",
}: SectionCardProps) {
  return (
    <section className={`rounded-[24px] bg-white p-5 shadow-sm ${className}`}>
      {(title || rightContent) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : <div />}
          {rightContent}
        </div>
      )}

      {children}
    </section>
  );
}