import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from '@/components/providers'
import { QueryProvider } from '@/components/providers/query-provider'
import { FontOptimizer, CriticalCSS } from '@/components/performance/font-optimizer'
import { PerformanceInitializer } from '@/components/performance/performance-initializer'
import { ErrorBoundaryProvider } from '@/providers/ErrorBoundaryProvider'

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boutique-store.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' }
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Boutique Store - Moda Feminina e Masculina Online',
    template: '%s | Boutique Store'
  },
  description: 'Descubra as últimas tendências da moda na Boutique Store. Roupas, calçados e acessórios das melhores marcas com entrega rápida e segura. Compre online com desconto!',
  keywords: [
    'moda feminina', 'moda masculina', 'roupas online', 'calçados', 'acessórios',
    'vestidos', 'blusas', 'calças', 'jeans', 'sapatos', 'bolsas',
    'e-commerce', 'boutique', 'loja online', 'moda brasileira',
    'tendências', 'estilo', 'fashion', 'comprar roupas'
  ],
  authors: [{ name: 'Boutique Store', url: siteUrl }],
  creator: 'Boutique Store',
  publisher: 'Boutique Store',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'E-commerce',
  classification: 'Moda e Vestuário',
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Boutique Store',
    title: 'Boutique Store - Moda Feminina e Masculina Online',
    description: 'Descubra as últimas tendências da moda. Roupas, calçados e acessórios das melhores marcas com entrega rápida.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Boutique Store - Moda Online',
        type: 'image/jpeg',
      },
      {
        url: `${siteUrl}/og-image-square.jpg`,
        width: 1200,
        height: 1200,
        alt: 'Boutique Store',
        type: 'image/jpeg',
      }
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    site: '@boutiquestore',
    creator: '@boutiquestore',
    title: 'Boutique Store - Moda Online',
    description: 'Descubra as últimas tendências da moda. Roupas, calçados e acessórios das melhores marcas.',
    images: [`${siteUrl}/twitter-image.jpg`],
  },
  

  
  // App Links
  appLinks: {
    web: {
      url: siteUrl,
      should_fallback: true,
    },
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
    other: {
      'facebook-domain-verification': process.env.FACEBOOK_VERIFICATION || '',
    },
  },
  
  // Alternates
  alternates: {
    canonical: siteUrl,
    languages: {
      'pt-BR': siteUrl,
      'en-US': `${siteUrl}/en`,
    },
  },
  
  // Other
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Boutique Store',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#2563eb',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <CriticalCSS />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundaryProvider>
          <FontOptimizer>
            <QueryProvider>
              <Providers>
                <PerformanceInitializer />
                {children}
              </Providers>
            </QueryProvider>
          </FontOptimizer>
        </ErrorBoundaryProvider>
      </body>
    </html>
  );
}
