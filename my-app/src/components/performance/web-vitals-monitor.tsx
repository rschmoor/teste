'use client';

import { useState, useEffect, useCallback } from 'react';

// Types for Web Vitals metrics
interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

interface WebVitalsData {
  lcp?: WebVitalsMetric;
  cls?: WebVitalsMetric;
  fcp?: WebVitalsMetric;
  ttfb?: WebVitalsMetric;
  inp?: WebVitalsMetric;
}

// Thresholds for Web Vitals ratings
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

// Get rating based on metric value and thresholds
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Hook for monitoring Web Vitals
export function useWebVitals() {
  const [vitals, setVitals] = useState<WebVitalsData>({});
  const [isLoading, setIsLoading] = useState(true);

  const updateMetric = useCallback((metric: any) => {
    const webVitalsMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      rating: getRating(metric.name, metric.value),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType || 'navigate',
    };

    setVitals(prev => ({
      ...prev,
      [metric.name.toLowerCase()]: webVitalsMetric,
    }));
  }, []);

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(updateMetric);
      onFCP(updateMetric);
      onLCP(updateMetric);
      onTTFB(updateMetric);
      onINP(updateMetric);
      setIsLoading(false);
    }).catch(() => {
      setIsLoading(false);
    });
  }, [updateMetric]);

  return { vitals, isLoading };
}

// Component for displaying Web Vitals metrics
interface WebVitalsDisplayProps {
  showDetails?: boolean;
  className?: string;
}

export function WebVitalsDisplay({ showDetails = false, className = '' }: WebVitalsDisplayProps) {
  const { vitals, isLoading } = useWebVitals();

  if (isLoading) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-3 bg-gray-300 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') return value.toFixed(3);
    return `${Math.round(value)}ms`;
  };

  return (
    <div className={`p-4 bg-white border rounded-lg shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Core Web Vitals</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(vitals).map(([key, metric]) => {
          if (!metric) return null;
          
          return (
            <div key={key} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm uppercase">{metric.name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(metric.rating)}`}>
                  {metric.rating.replace('-', ' ')}
                </span>
              </div>
              
              <div className="text-2xl font-bold mb-1">
                {formatValue(metric.name, metric.value)}
              </div>
              
              {showDetails && (
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Delta: {formatValue(metric.name, metric.delta)}</div>
                  <div>ID: {metric.id.slice(0, 8)}...</div>
                  <div>Navigation: {metric.navigationType}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {Object.keys(vitals).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Aguardando métricas de performance...
        </div>
      )}
    </div>
  );
}

// Performance monitoring component
export function PerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  useEffect(() => {
    // Get navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      setPerformanceData({
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstByte: navigation.responseStart - navigation.requestStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        domComplete: navigation.domComplete - navigation.fetchStart,
      });
    }

    // Get network information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setNetworkInfo({
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      <WebVitalsDisplay showDetails={true} />
      
      {performanceData && (
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Navigation Timing</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">DOM Content Loaded</div>
              <div className="text-xl font-bold">{Math.round(performanceData.domContentLoaded)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Load Complete</div>
              <div className="text-xl font-bold">{Math.round(performanceData.loadComplete)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">First Byte</div>
              <div className="text-xl font-bold">{Math.round(performanceData.firstByte)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">DOM Interactive</div>
              <div className="text-xl font-bold">{Math.round(performanceData.domInteractive)}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">DOM Complete</div>
              <div className="text-xl font-bold">{Math.round(performanceData.domComplete)}ms</div>
            </div>
          </div>
        </div>
      )}
      
      {networkInfo && (
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Network Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Connection Type</div>
              <div className="text-lg font-bold">{networkInfo.effectiveType}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Downlink</div>
              <div className="text-lg font-bold">{networkInfo.downlink} Mbps</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">RTT</div>
              <div className="text-lg font-bold">{networkInfo.rtt}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Save Data</div>
              <div className="text-lg font-bold">{networkInfo.saveData ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for performance optimization based on network conditions
export function useAdaptivePerformance() {
  const [shouldOptimize, setShouldOptimize] = useState(false);
  const [networkQuality, setNetworkQuality] = useState<'fast' | 'slow' | 'unknown'>('unknown');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkInfo = () => {
        const effectiveType = connection.effectiveType;
        const saveData = connection.saveData;
        
        if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
          setNetworkQuality('slow');
          setShouldOptimize(true);
        } else if (effectiveType === '3g') {
          setNetworkQuality('slow');
          setShouldOptimize(true);
        } else {
          setNetworkQuality('fast');
          setShouldOptimize(false);
        }
      };
      
      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);
      
      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  return { shouldOptimize, networkQuality };
}

// Component for performance recommendations
export function PerformanceRecommendations() {
  const { vitals } = useWebVitals();
  const { shouldOptimize, networkQuality } = useAdaptivePerformance();

  const getRecommendations = () => {
    const recommendations = [];

    if (vitals.lcp && vitals.lcp.rating !== 'good') {
      recommendations.push({
        metric: 'LCP',
        issue: 'Largest Contentful Paint is slow',
        suggestions: [
          'Optimize images and use next-gen formats',
          'Implement critical CSS inlining',
          'Use a CDN for faster content delivery',
          'Preload important resources'
        ]
      });
    }



    if (vitals.cls && vitals.cls.rating !== 'good') {
      recommendations.push({
        metric: 'CLS',
        issue: 'Cumulative Layout Shift is high',
        suggestions: [
          'Set explicit dimensions for images and videos',
          'Reserve space for dynamic content',
          'Avoid inserting content above existing content',
          'Use CSS aspect-ratio for responsive media'
        ]
      });
    }

    if (shouldOptimize) {
      recommendations.push({
        metric: 'Network',
        issue: `Slow network detected (${networkQuality})`,
        suggestions: [
          'Enable data saver mode',
          'Reduce image quality',
          'Defer non-critical resources',
          'Use smaller bundle sizes'
        ]
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <div className="text-green-600 mr-2">✓</div>
          <div className="text-green-800 font-medium">Performance looks good!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance Recommendations</h3>
      {recommendations.map((rec, index) => (
        <div key={index} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="text-yellow-600 mr-2">⚠</div>
            <div className="font-medium text-yellow-800">{rec.issue}</div>
          </div>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 ml-6">
            {rec.suggestions.map((suggestion, i) => (
              <li key={i}>{suggestion}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}