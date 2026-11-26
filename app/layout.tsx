import type { Metadata } from "next";
import { Fira_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/top-bar";
import { Nav } from "@/components/nav";
import { Toaster } from "@/components/ui/feedback";

const fira = Fira_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800", "900"],
  variable: "--font-fira",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Warmline",
  description: "Cold outreach that reads warm: personal emails to anyone, approved by you and sent from your own Gmail.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fira.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <TopBar />
        <main className="mx-auto w-full max-w-app px-[clamp(20px,4vw,48px)] pb-24 pt-6">
          <div className="mb-10">
            <Nav />
          </div>
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
