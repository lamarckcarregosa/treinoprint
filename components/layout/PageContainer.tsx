"use client";

import { ReactNode } from "react";
import { useDeviceMode } from "@/hooks/useDeviceMode";

type PageContainerProps = {
  title?: string;
  subtitle?: string;
  rightContent?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function PageContainer({
  title,
  subtitle,
  rightContent,
  children,
  className = "",
}: PageContainerProps) {
  const { isMobile } = useDeviceMode();

  return (
    <div className={`w-full ${className}`}>
      {(title || subtitle || rightContent) && (
        <div
          className={[
            "mb-6 rounded-[28px] text-white",
            "bg-gradient-to-r from-black via-[#0b0d14] to-[#2d3821]",
            isMobile ? "p-5" : "p-7",
          ].join(" ")}
        >
          <div
            className={`flex ${
              isMobile ? "flex-col gap-4" : "items-start justify-between gap-6"
            }`}
          >
            <div>
              {title && (
                <h1
                  className={`font-bold tracking-tight ${
                    isMobile ? "text-3xl" : "text-5xl"
                  }`}
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-sm text-white/85 md:text-lg">
                  {subtitle}
                </p>
              )}
            </div>

            {rightContent && <div className="shrink-0">{rightContent}</div>}
          </div>
        </div>
      )}

      <div className="space-y-6">{children}</div>
    </div>
  );
}