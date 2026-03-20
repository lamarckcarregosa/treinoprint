"use client";

import { ReactNode, useEffect, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { useDeviceMode } from "@/hooks/useDeviceMode";

type AppShellProps = {
  children: ReactNode;
  title?: string;
};

export default function AppShell({
  children,
  title = "TreinoPrint",
}: AppShellProps) {
  const { isDesktop } = useDeviceMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  return (
    <div className="min-h-screen bg-[#eef1f4]">
      {isDesktop ? (
        <div className="fixed left-0 top-0 z-30">
          <Sidebar />
        </div>
      ) : (
        <>
          <MobileHeader
            title={title}
            onMenuClick={() => setSidebarOpen(true)}
          />

          <Sidebar
            mobileOpen={sidebarOpen}
            onMobileClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      <div className="lg:pl-20">
        <main className="px-4 py-4 md:px-6 md:py-6 xl:px-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}