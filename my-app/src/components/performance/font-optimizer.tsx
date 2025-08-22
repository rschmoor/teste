'use client';

import { useEffect } from 'react';

// Preload critical fonts
const CRITICAL_FONTS = [
  {
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    as: 'style',
    crossOrigin: 'anonymous'
  }
];

// Preconnect to external domains
const PRECONNECT_DOMAINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// DNS prefetch domains
const DNS_PREFETCH_DOMAINS = [
  'https://api.example.com',
  'https://cdn.example.com'
];

interface FontOptimizerProps {
  children?: React.ReactNode;
}

export function FontOptimizer({ children }: FontOptimizerProps) {
  useEffect(() => {
    // Preload critical fonts
    CRITICAL_FONTS.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.href;
      link.as = font.as;
      if (font.crossOrigin) {
        link.crossOrigin = font.crossOrigin;
      }
      document.head.appendChild(link);
    });

    // Add preconnect links
    PRECONNECT_DOMAINS.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // Add DNS prefetch links
    DNS_PREFETCH_DOMAINS.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });

    // Font display optimization
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 400;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2') format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
      
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 500;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2') format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
      
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 600;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2') format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
      
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 700;
        font-display: swap;
        src: url('https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2') format('woff2');
        unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function
    return () => {
      // Remove added elements on unmount
      const links = document.querySelectorAll('link[rel="preload"], link[rel="preconnect"], link[rel="dns-prefetch"]');
      links.forEach(link => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
      
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  return <>{children}</>;
}

// Hook for font loading optimization
export function useFontOptimization() {
  useEffect(() => {
    // Check if fonts are loaded
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        console.log('All fonts loaded');
        // Trigger any font-dependent operations
        document.body.classList.add('fonts-loaded');
      });
    }

    // Preload next page fonts
    const preloadNextPageFonts = () => {
      const links = document.querySelectorAll('a[href^="/"]');
      links.forEach(link => {
        link.addEventListener('mouseenter', () => {
          // Preload fonts for the next page
          const nextPageLink = document.createElement('link');
          nextPageLink.rel = 'prefetch';
          nextPageLink.href = '/fonts/inter-subset.woff2';
          document.head.appendChild(nextPageLink);
        }, { once: true });
      });
    };

    // Run after DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', preloadNextPageFonts);
    } else {
      preloadNextPageFonts();
    }
  }, []);
}

// Critical CSS inlining component
export function CriticalCSS() {
  return (
    <style jsx>{`
      /* Critical CSS for above-the-fold content */
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-display: swap;
        line-height: 1.6;
        margin: 0;
        padding: 0;
      }
      
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      
      .header {
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
        position: sticky;
        top: 0;
        z-index: 50;
      }
      
      .nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 4rem;
      }
      
      .logo {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        text-decoration: none;
      }
      
      .hero {
        padding: 4rem 0;
        text-align: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .hero h1 {
        font-size: 3rem;
        font-weight: 700;
        margin: 0 0 1rem 0;
        line-height: 1.2;
      }
      
      .hero p {
        font-size: 1.25rem;
        margin: 0 0 2rem 0;
        opacity: 0.9;
      }
      
      .btn {
        display: inline-block;
        padding: 0.75rem 2rem;
        background: #fff;
        color: #667eea;
        text-decoration: none;
        border-radius: 0.5rem;
        font-weight: 600;
        transition: transform 0.2s;
      }
      
      .btn:hover {
        transform: translateY(-2px);
      }
      
      @media (max-width: 768px) {
        .hero h1 {
          font-size: 2rem;
        }
        
        .hero p {
          font-size: 1rem;
        }
      }
    `}</style>
  );
}