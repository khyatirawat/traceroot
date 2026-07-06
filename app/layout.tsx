import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "traceroot — AI engineering intelligence", template: "%s · traceroot" },
  description: "Inspect any public GitHub repo. Get release-readiness scores, insights, action items, and a prioritized backlog — in real time.",
  themeColor: "#f7f8fa",
  applicationName: "traceroot",
  metadataBase: new URL("https://traceroot.local"),
  openGraph: { type: "website", siteName: "traceroot", images: ["/og.svg"] },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
