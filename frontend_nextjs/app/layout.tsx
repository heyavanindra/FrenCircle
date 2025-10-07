import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NavbarVisibilityProvider } from "@/contexts/NavbarVisibilityContext";
import { Toaster } from "@/components/ui/sonner";
import { SessionChecker } from "@/components/SessionChecker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "linqyard", template: `%s • linqyard` },
  description: "All your links in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="light">
          <UserProvider>
            <NavbarVisibilityProvider>
              <SessionChecker />
              <Navbar />
              <main>{children}</main>
              <Toaster />
            </NavbarVisibilityProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
