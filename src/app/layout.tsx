import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LiveBg } from "@/components/live-bg";
import "./globals.css";

const sans = Inter({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CodeCraft Gestão — financeiro e RH para empresas",
  description:
    "Caixa, títulos, DRE, ponto e folha para empresas em BH e Brasil. A partir de R$ 280/mês. PIX mensal ou cartão. CodeCraft Solutions.",
  keywords: [
    "ERP pequena empresa",
    "gestão financeira MEI",
    "ponto eletrônico empresa",
    "sistema RH PME",
    "Belo Horizonte",
  ],
  openGraph: {
    title: "CodeCraft Gestão — financeiro + RH",
    description: "Plataforma B2B a partir de R$ 280/mês. Cadastro com CNPJ. PIX mensal.",
    type: "website",
    locale: "pt_BR",
    url: "https://gustavosena972-wq.github.io/financas-codecraft/",
  },
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
