import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ParkOps PMS — Cordano Inversiones · Serrano 447, Iquique',
  description: 'Plataforma de Control de Estacionamiento y Recaudación Presencial en Garita (Serrano 447, Iquique). Conectado a Google Cloud Run.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-[#f4f6f9] text-slate-900 antialiased">{children}</body>
    </html>
  );
}
