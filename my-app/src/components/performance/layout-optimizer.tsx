'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Hook para medir CLS
export function useCLS() {
  const [clsValue, setCLSValue] = useState(0);

  useEffect(() => {
    let clsScore = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count layout shifts without recent user input
        if (!(entry as any).hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          // If the entry occurred less than 1 second after the previous entry and
          // less than 5 seconds after the first entry in the session, include the
          // entry in the current session. Otherwise, start a new session.
          if (
            sessionValue &&
            entry.startTime - lastSessionEntry.startTime < 1000 &&
            entry.startTime - firstSessionEntry.startTime < 5000
          ) {
            sessionValue += (entry as any).value;
            sessionEntries.push(entry);
          } else {
            sessionValue = (entry as any).value;
            sessionEntries = [entry];
          }

          // If the current session value is larger than the current CLS value,
          // update CLS and the entries contributing to it.
          if (sessionValue > clsScore) {
            clsScore = sessionValue;
            setCLSValue(clsScore);
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return clsValue;
}

// Componente para reservar espaço e evitar layout shifts
interface SpaceReserverProps {
  width?: number | string;
  height?: number | string;
  aspectRatio?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SpaceReserver({
  width,
  height,
  aspectRatio,
  className = '',
  children,
}: SpaceReserverProps) {
  const style: React.CSSProperties = {};

  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  if (aspectRatio) style.aspectRatio = aspectRatio;

  return (
    <div className={`relative ${className}`} style={style}>
      {children}
    </div>
  );
}

// Componente para skeleton loading que mantém o layout
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded',
    circular: 'rounded-full',
  };
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Componente para texto skeleton
interface TextSkeletonProps {
  lines?: number;
  className?: string;
  lineHeight?: string;
  lastLineWidth?: string;
}

export function TextSkeleton({
  lines = 3,
  className = '',
  lineHeight = '1rem',
  lastLineWidth = '60%',
}: TextSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          variant="text"
        />
      ))}
    </div>
  );
}

// Componente para card skeleton
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <Skeleton height="12rem" className="mb-4" />
      <Skeleton height="1.5rem" width="80%" className="mb-2" />
      <TextSkeleton lines={2} />
      <div className="flex justify-between items-center mt-4">
        <Skeleton height="2rem" width="5rem" />
        <Skeleton height="2.5rem" width="6rem" />
      </div>
    </div>
  );
}

// Hook para detectar mudanças de layout
export function useLayoutStability() {
  const [isStable, setIsStable] = useState(true);
  const [shiftCount, setShiftCount] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        setIsStable(false);
        setShiftCount(prev => prev + entries.length);

        // Reset stability after 1 second of no shifts
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setIsStable(true);
        }, 1000);
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    return () => {
      observer.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  return { isStable, shiftCount };
}

// Componente para container com dimensões fixas
interface FixedContainerProps {
  width: number | string;
  height: number | string;
  className?: string;
  children?: React.ReactNode;
}

export function FixedContainer({
  width,
  height,
  className = '',
  children,
}: FixedContainerProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    overflow: 'hidden',
  };

  return (
    <div className={`relative ${className}`} style={style}>
      {children}
    </div>
  );
}

// Componente para lazy loading com placeholder
interface LazyContentProps {
  placeholder: React.ReactNode;
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function LazyContent({
  placeholder,
  children,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
}: LazyContentProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
}

// Componente para grid responsivo com aspect ratio fixo
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  aspectRatio?: string;
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = { default: 1, md: 2, lg: 3 },
  gap = '1rem',
  aspectRatio = '1/1',
  className = '',
}: ResponsiveGridProps) {
  const gridClasses = [
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={`grid ${gridClasses} ${className}`}
      style={{ gap, gridAutoRows: `minmax(0, 1fr)` }}
    >
      {React.Children.map(children, (child, index) => (
        <div key={index} style={{ aspectRatio }}>
          {child}
        </div>
      ))}
    </div>
  );
}

// Hook para medir performance de layout
export function useLayoutPerformance() {
  const [metrics, setMetrics] = useState({
    cls: 0,
    layoutShifts: 0,
    largestShift: 0,
  });

  useEffect(() => {
    let totalCLS = 0;
    let shiftCount = 0;
    let largestShift = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as any;
        if (!shift.hadRecentInput) {
          totalCLS += shift.value;
          shiftCount++;
          largestShift = Math.max(largestShift, shift.value);

          setMetrics({
            cls: totalCLS,
            layoutShifts: shiftCount,
            largestShift,
          });
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });

    return () => {
      observer.disconnect();
    };
  }, []);

  return metrics;
}