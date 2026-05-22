import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563EB" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "YYC³ AI Intelligent Calling",
    template: "%s | YYC³ AI",
  },
  description: "AI 驱动的智能外呼系统 - 言启象限 语枢未来",
  keywords: [
    "YYC³", "AI", "Intelligent Calling", "智能外呼",
    "客户服务", "PWA", "YanYuCloudCube",
  ],
  authors: [{ name: "YanYu", url: "https://github.com/YY-Nexus" }],
  creator: "YanYu",
  publisher: "YYC³",
  robots: "index, follow",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/yyc3-icons/favicon/favicon.ico", sizes: "any" },
      { url: "/yyc3-icons/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/yyc3-icons/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/yyc3-icons/ios/icon-60@3x.png", sizes: "180x180" },
      { url: "/yyc3-icons/ios/icon-76@2x.png", sizes: "152x152" },
      { url: "/yyc3-icons/ios/icon-40@3x.png", sizes: "120x120" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    title: "YYC³ AI Intelligent Calling",
    description: "AI 驱动的智能外呼系统 | 言启象限 语枢未来",
    siteName: "YYC³ AI",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YYC³ AI",
  },
  formatDetection: {
    telephone: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="apple-touch-icon" href="/yyc3-icons/ios/icon-60@3x.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="overscroll-none">{children}</body>
    </html>
  )
}
