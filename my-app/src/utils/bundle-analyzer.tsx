import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import type { NextConfig } from 'next';
import React, { useState, useEffect } from 'react';

/**
 * Configuracao do Bundle Analyzer para analise de performance
 */
export const withBundleAnalyzer = (nextConfig: NextConfig): NextConfig => {
  return {
    ...nextConfig,
    webpack: (config, options) => {
      // Aplicar configuracao webpack existente se houver
      if (nextConfig.webpack) {
        config = nextConfig.webpack(config, options);
      }

      // Adicionar Bundle Analyzer apenas em builds de producao
      if (process.env.ANALYZE === 'true') {
        config.plugins = config.plugins || [];
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            reportFilename: options.isServer
              ? '../analyze/server.html'
              : './analyze/client.html',
          })
        );
      }

      // Otimizacoes de bundle
      if (!options.dev) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            ...config.optimization?.splitChunks,
            cacheGroups: {
              ...config.optimization?.splitChunks?.cacheGroups,
              vendor: {
                test: /[\\\\/]node_modules[\\\\/]/,
                name: 'vendors',
                chunks: 'all',
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                enforce: true,
              },
            },
          },
        };
      }

      return config;
    },
  };
};

/**
 * Analise de performance do bundle
 */
export const analyzeBundlePerformance = () => {
  const metrics = {
    bundleSize: 0,
    chunkCount: 0,
    loadTime: 0,
  };

  // Simular analise de performance
  if (typeof window !== 'undefined') {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
  }

  return metrics;
};

/**
 * Hook para monitorar performance de carregamento
 */
export const useLoadingPerformance = () => {
  const [loadingMetrics, setLoadingMetrics] = useState<{
    renderTime: number;
    hydrationTime: number;
    loadTime: number;
  } | null>(null);

  useEffect(() => {
    const startTime = performance.now();
    
    // Medir tempo de renderizacao
    const renderTime = performance.now() - startTime;
    
    // Medir tempo de hidratacao
    const hydrationTimer = setTimeout(() => {
      const hydrationTime = performance.now() - startTime;
      
      // Medir tempo de carregamento total
      const loadTime = performance.timing?.loadEventEnd - performance.timing?.navigationStart || 0;
      
      setLoadingMetrics({
        renderTime,
        hydrationTime,
        loadTime,
      });
    }, 100);

    return () => {
      clearTimeout(hydrationTimer);
    };
  }, []);

  return loadingMetrics;
};

/**
 * Componente para exibir metricas de performance em desenvolvimento
 */
export const PerformanceDebugger: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const loadingMetrics = useLoadingPerformance();

  // So mostrar em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-mono"
      >
        Perf
      </button>
      
      {isVisible && loadingMetrics && (
        <div className="absolute bottom-12 right-0 bg-black text-white p-4 rounded-lg text-xs font-mono min-w-[200px]">
          <div className="font-bold mb-2">Performance Metrics</div>
          <div>Render: {loadingMetrics.renderTime.toFixed(2)}ms</div>
          <div>Hydration: {loadingMetrics.hydrationTime.toFixed(2)}ms</div>
          <div>Load: {loadingMetrics.loadTime.toFixed(2)}ms</div>
        </div>
      )}
    </div>
  );
};