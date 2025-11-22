import { Inter } from "next/font/google";
import { NowPlayingContextProvider } from "react-nowplaying";
import classNames from "classnames";
import localFont from "next/font/local";
import type { Metadata, Viewport } from "next";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const favorit = localFont({
  src: "./fonts/ABCFavorit-Bold.woff2",
  variable: "--font-favorit",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  width: "device-width",
  // maximumScale: 1, hitting accessability
};

export const metadata: Metadata = {
  metadataBase: new URL("https://your-resume-project.com"), // Update this
  title: "iFlyTech Text-to-Speech Demo",
  description: `iFlyTech Speech API Demo showing fast and accurate Text-to-Speech technology.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-dvh">
      <body
        className={`h-full dark ${classNames(
          favorit.variable,
          inter.className
        )}`}
      >
        <NowPlayingContextProvider>{children}</NowPlayingContextProvider>
      </body>
    </html>
  );
}