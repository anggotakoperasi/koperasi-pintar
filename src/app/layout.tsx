import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koperasi Pintar - PRIMKOPPOL Resor Subang",
  description: "Sistem Manajemen Koperasi Terpadu - Simpan Pinjam Koperasi",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
