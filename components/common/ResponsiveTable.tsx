"use client";

import { ReactNode } from "react";
import { useDeviceMode } from "@/hooks/useDeviceMode";
import SectionCard from "@/components/common/SectionCard";

type Column<T> = {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type ResponsiveTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  emptyText?: string;
  mobileCardTitle?: (row: T) => ReactNode;
};

export default function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  emptyText = "Nenhum registro encontrado.",
  mobileCardTitle,
}: ResponsiveTableProps<T>) {
  const { isMobile } = useDeviceMode();

  if (!data.length) {
    return (
      <SectionCard>
        <div className="py-8 text-center text-sm text-zinc-500">{emptyText}</div>
      </SectionCard>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((row, index) => (
          <SectionCard key={index}>
            {mobileCardTitle && (
              <div className="mb-4 text-base font-semibold">{mobileCardTitle(row)}</div>
            )}

            <div className="space-y-3">
              {columns.map((col) => (
                <div
                  key={String(col.key)}
                  className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-2 last:border-b-0 last:pb-0"
                >
                  <span className="text-sm text-zinc-500">{col.label}</span>
                  <div className={`text-right text-sm font-medium ${col.className ?? ""}`}>
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "-")}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-sm font-semibold text-zinc-700"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-zinc-100 last:border-b-0">
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-4 text-sm text-zinc-700 ${col.className ?? ""}`}
                  >
                    {col.render ? col.render(row) : String(row[col.key as keyof T] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}