import Sidebar from "../components/Sidebar";
import AuthGuard from "../components/AuthGuard";

export default function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-slate-100 to-zinc-200">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-3 md:p-6">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}