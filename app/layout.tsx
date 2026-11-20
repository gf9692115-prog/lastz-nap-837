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
    default: "NAP WATCH // 837 服违规雷达",
    template: "%s · NAP WATCH",
  },
  description:
    "Last Z Server 837 联盟 NAP 违规自动检测：上传赏金、矿区争夺或贸易货车战报截图，AI 识别违规方并自动计入联盟违规榜。",
  applicationName: "NAP WATCH 837",
  keywords: [
    "Last Z",
    "Last Z Survival Shooter",
    "Server 837",
    "NAP",
    "违规检测",
    "联盟排行榜",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "NAP WATCH // 837 服违规雷达",
    description:
      "上传战报截图，自动锁定 837 服 NAP 违规联盟。AI 识别，规则复核，证据公开。",
    type: "website",
    locale: "zh_CN",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#060806",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-void-950 font-sans text-zinc-200 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-acid focus:px-4 focus:py-2 focus:font-display focus:text-sm focus:font-bold focus:text-void-950"
        >
          跳到主要内容
        </a>
        {children}
      </body>
    </html>
  );
}
