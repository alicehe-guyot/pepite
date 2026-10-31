import type { Metadata, Viewport } from "next";
// Polices auto-hébergées (pas d'appel à Google Fonts au build ni au runtime).
import "@fontsource-variable/bricolage-grotesque/index.css";
import "@fontsource-variable/instrument-sans/index.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pépite",
  description: "Offrir sans corvée, recevoir sans déception.",
  appleWebApp: { capable: true, title: "Pépite", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
