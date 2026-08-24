import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LiveBg } from "@/components/live-bg";
import "./globals.css";

const sans = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Finanças CodeCraft — o sistema da sua empresa",
  description:
    "Pessoas, vendas, projetos, caixa e estoque num só painel. IA autônoma em 95% do trabalho. Da CodeCraft Solutions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("fn-theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}`,
          }}
        />
        <LiveBg />
        {children}
      </body>
    </html>
  );
}
