import type { Metadata, Viewport } from "next";

import "./globals.css";

function resolveMetadataBase(): URL | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!value) return undefined;
  try {
    return new URL(value);
  } catch {
    return undefined;
  }
}

const metadataBase = resolveMetadataBase();

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  title: {
    default: "NAP WAR REPORT // Server 837 Violation Dossier",
    template: "%s · NAP WAR REPORT",
  },
  description:
    "The NAP War Report for Last Z Server 837. Upload bounty, resource-tile, or trade-truck reports and let AI vision plus a deterministic ruleset identify offenders and update the alliance leaderboard.",
  applicationName: "NAP WAR REPORT 837",
  keywords: [
    "Last Z",
    "Last Z Survival Shooter",
    "Server 837",
    "NAP",
    "war report",
    "violation detection",
    "alliance leaderboard",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "NAP WAR REPORT // Server 837 Violation Dossier",
    description:
      "Upload a report screenshot and identify Server 837 NAP offenders. AI extraction, server-side rules, and public evidence.",
    type: "website",
    locale: "en_US",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0606",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-void-950 font-sans text-zinc-200 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-acid focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:font-bold focus:text-void-950"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
