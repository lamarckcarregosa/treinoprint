"use client";

type MobileHeaderProps = {
  title?: string;
  onMenuClick: () => void;
};

export default function MobileHeader({
  title = "TreinoPrint",
  onMenuClick,
}: MobileHeaderProps) {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 lg:hidden">
      <button
        onClick={onMenuClick}
        className="rounded-xl border border-black/10 px-3 py-2 text-sm font-medium"
      >
        Menu
      </button>

      <span className="text-base font-semibold">{title}</span>

      <div className="w-[58px]" />
    </div>
  );
}