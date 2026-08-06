import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Web3Provider } from "./providers/Web3Provider";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "Verse AI — Intelligent DeFi Strategies",
  description: "AI-powered on-chain staking, risk management, and yield optimization",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>
          <Navbar />
          <main>{children}</main>
          <SpeedInsights />
        </Web3Provider>
      </body>
    </html>
  );
}