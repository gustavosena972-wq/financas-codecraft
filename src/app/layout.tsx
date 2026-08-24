import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LiveBg } from "@/components/live-bg";
import "./globals.css";

const sans = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodeCraft Gestão — sistema empresarial",
  description:
    "Financeiro, RH e operações para empresas. Multi-tenant seguro. Planos de R$ 280 a R$ 500. Da CodeCraft Solutions.",
  appleWebApp: {
    capable: true,
    title: "CodeCraft Gestão",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#12172b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full density-compact">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("cc-theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`,
          }}
        />
        <LiveBg />
        {children}
      </body>
    </html>
  );
}
