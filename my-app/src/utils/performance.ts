// Performance utilities and optimizations

// Lazy loading utility
export function lazyLoad<T extends React.ComponentType<Record<string, unknown>>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const LazyComponent = React.lazy(importFunc);
  
  return function LazyWrapper(props: React.ComponentProps<T>) {
    const fallbackElement = fallback ? React.createElement(fallback) : React.createElement('div', {}, 'Loading...');
    
    return React.createElement(
      React.Suspense,
      { fallback: fallbackElement },
      React.createElement(LazyComponent, props)
    );
  };
}

// Preload component utility
export function preloadComponent<T extends React.ComponentType<Record<string, unknown>>>(
  importFunc: () => Promise<{ default: T }>
) {
  const componentImport = importFunc();
  componentImport.catch(() => {}); // Prevent unhandled rejection
  return componentImport;
}

// Resource preloading
export function preloadResource(href: string, as: string, type?: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;
  document.head.appendChild(link);
}

// Critical resource preloading
export function preloadCriticalResources() {
  // Preload critical CSS
  preloadResource('/styles/critical.css', 'style');
  
  // Preload critical fonts
  preloadResource('/fonts/inter-var.woff2', 'font', 'font/woff2');
  
  // Preload hero images
  preloadResource('/images/hero-bg.webp', 'image');
}

// Bundle splitting helpers
export const dynamicImports = {
  // UI Components (commented out - modules don't exist yet)
  // Modal: () => import('@/components/ui/modal'),
  // Carousel: () => import('@/components/ui/carousel'),
  // Chart: () => import('@/components/ui/chart'),
  
  // Feature Components (commented out - modules don't exist yet)
  // ProductGallery: () => import('@/components/product/gallery'),
  // ShoppingCart: () => import('@/components/cart/shopping-cart'),
  // UserProfile: () => import('@/components/user/profile'),
  
  // Page Components (commented out - modules don't exist yet)
  // ProductPage: () => import('@/app/products/[id]/page'),
  // CheckoutPage: () => import('@/app/checkout/page'),
  // ProfilePage: () => import('@/app/profile/page'),
  
  // Third-party libraries (commented out - modules don't exist yet)
  // Analytics: () => import('@/lib/analytics'),
  // PaymentProcessor: () => import('@/lib/payment'),
  // ChatWidget: () => import('@/lib/chat'),
};

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    // Monitor Long Tasks
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn('Long task detected:', entry.duration, 'ms');
          this.metrics.set('longTask', entry.duration);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

      // Monitor Resource Loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.duration > 1000) {
            console.warn('Slow resource:', resource.name, resource.duration, 'ms');
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

// Image optimization utilities
export function generateSrcSet(src: string, sizes: number[]): string {
  return sizes
    .map(size => `${src}?w=${size} ${size}w`)
    .join(', ');
}

export function generateSizes(breakpoints: { [key: string]: string }): string {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(max-width: ${breakpoint}) ${size}`)
    .join(', ');
}

// Memory management
export class MemoryManager {
  private static cleanupTasks: (() => void)[] = [];

  static addCleanupTask(task: () => void) {
    this.cleanupTasks.push(task);
  }

  static cleanup() {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks = [];
  }

  static monitorMemory() {
    if ('memory' in performance) {
      const memory = (performance as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      const usage = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      };
      
      console.log('Memory usage:', usage);
      
      // Trigger cleanup if memory usage is high
      if (usage.used / usage.limit > 0.8) {
        console.warn('High memory usage detected, triggering cleanup');
        this.cleanup();
      }
      
      return usage;
    }
    return null;
  }
}

// Network-aware loading
export function getNetworkQuality(): 'fast' | 'slow' | 'unknown' {
  if ('connection' in navigator) {
    const connection = (navigator as { connection: { effectiveType: string } }).connection;
    const effectiveType = connection.effectiveType;
    
    if (effectiveType === '4g') return 'fast';
    if (effectiveType === '3g') return 'slow';
    if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'slow';
  }
  return 'unknown';
}

export function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function shouldSaveData(): boolean {
  if ('connection' in navigator) {
    return (navigator as { connection: { saveData?: boolean } }).connection.saveData || false;
  }
  return false;
}

// Adaptive loading based on device capabilities
export function getDeviceCapabilities() {
  const capabilities = {
    memory: (navigator as { deviceMemory?: number }).deviceMemory || 4,
    cores: navigator.hardwareConcurrency || 4,
    connection: getNetworkQuality(),
    saveData: shouldSaveData(),
    reducedMotion: shouldReduceMotion(),
  };

  // Determine device tier
  let tier: 'high' | 'medium' | 'low' = 'medium';
  
  if (capabilities.memory >= 8 && capabilities.cores >= 8 && capabilities.connection === 'fast') {
    tier = 'high';
  } else if (capabilities.memory <= 2 || capabilities.cores <= 2 || capabilities.connection === 'slow') {
    tier = 'low';
  }

  return { ...capabilities, tier };
}

// Adaptive component loading
export function loadComponentBasedOnCapabilities<T extends React.ComponentType<Record<string, unknown>>>(
  highEndComponent: () => Promise<{ default: T }>,
  lowEndComponent: () => Promise<{ default: T }>
) {
  const { tier } = getDeviceCapabilities();
  return tier === 'low' ? lowEndComponent() : highEndComponent();
}

// Performance budget checker
export class PerformanceBudget {
  private static budgets = {
    javascript: 200 * 1024, // 200KB
    css: 100 * 1024, // 100KB
    images: 500 * 1024, // 500KB
    fonts: 100 * 1024, // 100KB
    total: 1000 * 1024, // 1MB
  };

  static checkBudget() {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const sizes = {
        javascript: 0,
        css: 0,
        images: 0,
        fonts: 0,
        total: 0,
      };

      entries.forEach((entry) => {
        const resource = entry as PerformanceResourceTiming;
        const size = resource.transferSize || 0;
        sizes.total += size;

        if (resource.name.includes('.js')) {
          sizes.javascript += size;
        } else if (resource.name.includes('.css')) {
          sizes.css += size;
        } else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
          sizes.images += size;
        } else if (resource.name.match(/\.(woff|woff2|ttf|otf)$/)) {
          sizes.fonts += size;
        }
      });

      // Check budgets
      Object.entries(sizes).forEach(([type, size]) => {
        const budget = this.budgets[type as keyof typeof this.budgets];
        if (size > budget) {
          console.warn(`Performance budget exceeded for ${type}: ${Math.round(size / 1024)}KB > ${Math.round(budget / 1024)}KB`);
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
  }
}

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
  if (typeof window !== 'undefined') {
    // Start monitoring
    PerformanceMonitor.getInstance().startMonitoring();
    
    // Check performance budget
    PerformanceBudget.checkBudget();
    
    // Monitor memory usage periodically
    setInterval(() => {
      MemoryManager.monitorMemory();
    }, 30000); // Every 30 seconds
    
    // Preload critical resources
    preloadCriticalResources();
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      PerformanceMonitor.getInstance().stopMonitoring();
      MemoryManager.cleanup();
    });
  }
}

import React from 'react';