import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LiveBg } from "@/components/live-bg";
import "./globals.css";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Finanças CodeCraft — Gestão financeira inteligente",
  description:
    "Plataforma de gestão financeira para pessoas e empresas: controle, previsão e clareza para decidir melhor.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("fc-theme");if(t==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`,
          }}
        />
        <LiveBg />
        {children}
      </body>
    </html>
  );
}
