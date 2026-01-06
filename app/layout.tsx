import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { ScreenReaderAnnouncer } from "@/components/accessibility/screen-reader-announcer";
import { SkipLinks } from "@/components/accessibility/skip-link";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Open Researcher - AI-Powered Web Research Assistant",
    template: "%s | Open Researcher",
  },
  description: "An intelligent web research assistant powered by Firecrawl and Claude AI for deep web research, real-time thinking visualization, and comprehensive content analysis.",
  keywords: [
    "AI research",
    "web scraping",
    "Claude AI",
    "Firecrawl",
    "research assistant",
    "AI agent",
    "web research",
    "content analysis",
    "thinking visualization",
  ],
  authors: [{ name: "Mendable AI", url: "https://mendable.ai" }],
  creator: "Mendable AI",
  publisher: "Mendable AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Open Researcher",
    title: "Open Researcher - AI-Powered Web Research Assistant",
    description: "An intelligent web research assistant powered by Firecrawl and Claude AI for deep web research, real-time thinking visualization, and comprehensive content analysis.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Researcher - AI-Powered Web Research Assistant",
    description: "An intelligent web research assistant powered by Firecrawl and Claude AI",
    creator: "@mendableai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {/* Skip links for keyboard navigation */}
        <SkipLinks />

        {/* Screen reader announcements */}
        <ScreenReaderAnnouncer />

        <MotionProvider>
          {children}
        </MotionProvider>
        <Toaster />
      </body>
    </html>
  );
}
