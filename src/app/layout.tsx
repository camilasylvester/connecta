import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { IdleSessionGuard } from "@/components/IdleSessionGuard";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CONNECTA — Marcas y creadores",
  description:
    "Publicá eventos, recibí postulaciones y construí historial entre marcas y creadores.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="es"
        className={`${inter.variable} ${ibmPlexMono.variable} h-full`}
      >
        <body className="min-h-full font-sans antialiased">
          <IdleSessionGuard />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
