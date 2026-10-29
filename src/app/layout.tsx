import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pachecos Advogados | Gestão",
  description: "Sistema interno de gestão do escritório",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = { themeColor: "#2e2a25" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
