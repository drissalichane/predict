import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";
import NavbarWrapper from "@/components/NavbarWrapper";
import FloatingChatButton from "@/components/chat/FloatingChatButton";
import ScrollToTop from "@/components/ScrollToTop";
import FeatureDiscoveryModal from "@/components/FeatureDiscoveryModal";
import "./globals.css";

export const metadata: Metadata = {
  title: "World Cup 2026 Predictions",
  description: "Join private rooms, predict matches, and climb the real-time leaderboard with your friends for the 2026 FIFA World Cup!",
  openGraph: {
    title: "World Cup 2026 Predictions",
    description: "Join private rooms, predict matches, and climb the real-time leaderboard with your friends for the 2026 FIFA World Cup!",
    siteName: "World Cup Predictor",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavbarWrapper>
          <Navbar />
        </NavbarWrapper>
        {children}
        <FeatureDiscoveryModal />
        <FloatingChatButton />
        <ScrollToTop />
        <Analytics />
      </body>
    </html>
  );
}
