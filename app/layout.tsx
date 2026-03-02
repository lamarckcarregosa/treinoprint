import "./globals.css";   // 🔥 FALTAVA ISSO
import { AuthProvider } from "../context/authcontext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
