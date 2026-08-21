import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
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
        <div className="bg-motion" aria-hidden="true">
          <i className="bg-aurora" />
          <i className="bg-orb a" />
          <i className="bg-orb b" />
          <i className="bg-orb c" />
          <i className="bg-grid" />
        </div>
        {children}
      </body>
    </html>
  );
}
