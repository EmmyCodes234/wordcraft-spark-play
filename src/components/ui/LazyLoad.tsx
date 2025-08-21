import React, { Suspense, lazy, ComponentType } from 'react';

interface LazyLoadProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

const LazyLoad: React.FC<LazyLoadProps> = ({ 
  component, 
  fallback = <div className="flex items-center justify-center p-4">Loading...</div>,
  ...props 
}) => {
  const LazyComponent = lazy(component);
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default LazyLoad;
