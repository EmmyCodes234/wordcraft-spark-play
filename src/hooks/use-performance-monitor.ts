import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export function usePerformanceMonitor(componentName: string) {
  const startTime = useRef(performance.now());
  const renderStartTime = useRef(performance.now());

  useEffect(() => {
    const loadTime = performance.now() - startTime.current;
    
    // Log performance metrics
    console.log(`[Performance] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
    
    // Track memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`[Performance] Memory usage: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
    }
    
    // Report to analytics if needed
    if (loadTime > 1000) {
      console.warn(`[Performance] ${componentName} took ${loadTime.toFixed(2)}ms to load`);
    }
  }, [componentName]);

  const trackRender = () => {
    const renderTime = performance.now() - renderStartTime.current;
    console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    renderStartTime.current = performance.now();
  };

  return { trackRender };
}

export function usePageLoadTime() {
  useEffect(() => {
    const loadTime = performance.now();
    
    const handleLoad = () => {
      const totalLoadTime = performance.now() - loadTime;
      console.log(`[Performance] Page loaded in ${totalLoadTime.toFixed(2)}ms`);
      
      // Send to analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'page_load_time', {
          value: Math.round(totalLoadTime),
          custom_parameter: 'load_time_ms'
        });
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);
}
