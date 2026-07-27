import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const body = Archivo({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bumper — free motion graphics for YouTube",
  description:
    "Lower thirds, section cards, subscribe bumps and end screens. Described in a sentence, exported as a real video file with a real alpha channel. Free, because rendering is cheap.",
  openGraph: {
    title: "Bumper — free motion graphics for YouTube",
    description:
      "AI video tools charge per second because they run diffusion on a GPU. Motion graphics don't need diffusion — they need a renderer.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
