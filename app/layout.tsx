import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClientScout — I find you clients/customers",
  description: "Turn your offer into a shortlist of local prospects, researched with Gemini and backed by sources.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
