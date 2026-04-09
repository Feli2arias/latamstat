import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LatamStat | Análisis Socioeconómico LATAM",
  description: "Dashboard de análisis de CPI y pobreza en América Latina — Hackathon ULACIT × Databricks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&family=Sora:wght@300;400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#111319]">{children}</body>
    </html>
  );
}
