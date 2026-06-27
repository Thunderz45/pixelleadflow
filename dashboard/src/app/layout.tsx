import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "LeadFlow | Premium B2B Lead Generation & Browser Automation",
  description: "Automate Google Maps scraping, manage lead generation workflows, and export results directly to Excel/CSV. Build and scale your cold outreach pipeline securely.",
  keywords: ["Lead Generation", "Google Maps Scraper", "B2B Outreach", "Leadflow", "Puppeteer Automation", "SaaS Dashboard"],
  authors: [{ name: "LeadFlow Inc." }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light scroll-smooth">
      <head>
        {/* Load Material Symbols Outlined from Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} font-sans min-h-screen bg-background text-on-surface antialiased selection:bg-primary/20 selection:text-primary`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
