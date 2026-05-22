import { Suspense, type LazyExoticComponent, type ComponentType, type ReactNode } from 'react';

export interface LazyWrapProps {
  Component: LazyExoticComponent<ComponentType>;
  fallback?: ReactNode;
}

export function LazyWrap({ Component, fallback }: LazyWrapProps) {
  return (
    <Suspense fallback={fallback ?? <DefaultSpinner />}>
      <Component />
    </Suspense>
  );
}

function DefaultSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{
        width: 32, height: 32, border: '2px solid rgba(99,102,241,0.15)',
        borderTopColor: 'rgba(99,102,241,0.6)', borderRadius: '50%',
        animation: 'yyc3-rotate-slow 0.6s linear infinite',
      }} />
    </div>
  );
}
